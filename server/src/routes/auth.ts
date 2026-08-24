import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db, withTransaction } from '../db.js';
import {
  newId, generateRecoveryCode, hashRecoveryCode, generateDeviceToken, hashToken,
  hashPassword, verifyPassword, normalizeLogin, isValidLogin,
  LOGIN_MIN, LOGIN_MAX, PASSWORD_MIN,
} from '../crypto.js';
import { requireAuth, type AuthedDevice } from '../auth.js';
import { makeRateLimiter } from '../rate-limit.js';

/**
 * Вход по логину и паролю.
 *
 * Зачем, если уже есть токены устройств и QR-парность: те схемы удобны
 * машине, но не человеку. Чтобы зайти с нового устройства, приходилось
 * иметь под рукой уже настроенное — а если его нет, оставался код
 * восстановления, который надо где-то хранить. Логин с паролем убирает
 * и то, и другое: помнишь пару — заходишь откуда угодно.
 *
 * Токены устройств никуда не делись и остаются транспортом: логин просто
 * выдаёт новый токен. Всё, что ниже по стеку (WebSocket /sync, Bearer
 * в REST), работает как работало.
 *
 * Отдельный маршрут — POST /auth/credentials: он привязывает логин к УЖЕ
 * существующему аккаунту. Без него аккаунт, заведённый до этой версии
 * (а в нём лежат все данные), остался бы без входа: зарегистрировать
 * новый логин можно, но он создал бы пустой аккаунт рядом.
 */

interface AccountRow {
  id: string;
  login: string | null;
  password_hash: string | null;
}

const findByLogin = db.prepare(
  `SELECT id, login, password_hash FROM accounts WHERE login = ?`,
);
const findById = db.prepare(
  `SELECT id, login, password_hash FROM accounts WHERE id = ?`,
);
const insertAccount = db.prepare(
  `INSERT INTO accounts (id, recovery_code_hash, login, password_hash) VALUES (?, ?, ?, ?)`,
);
const insertDevice = db.prepare(
  `INSERT INTO devices (id, account_id, token_hash, label, platform) VALUES (?, ?, ?, ?, ?)`,
);
const insertBlob = db.prepare(`INSERT INTO sync_blobs (account_id, data) VALUES (?, ?)`);
const setCredentials = db.prepare(
  `UPDATE accounts SET login = ?, password_hash = ? WHERE id = ?`,
);

// Подбор пароля — главная угроза для этой схемы. Окно намеренно широкое:
// живой человек за час десяти попыток не исчерпает, а перебор становится
// бессмысленным.
const loginRateLimit = makeRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });
const registerRateLimit = makeRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });

interface AuthBody {
  login?: string;
  password?: string;
  device_label?: string;
  platform?: string;
}

/** Заводит устройство в аккаунте и возвращает его свежий токен. */
function issueDevice(accountId: string, label: string | null, platform: string | null) {
  const deviceId = newId();
  const deviceToken = generateDeviceToken();
  insertDevice.run(deviceId, accountId, hashToken(deviceToken), label, platform);
  return { deviceId, deviceToken };
}

export function registerAuthRoutes(app: FastifyInstance): void {
  /** Новый аккаунт сразу с логином и паролем. */
  app.post<{ Body: AuthBody }>('/auth/register', async (req, reply) => {
    const gate = registerRateLimit(req.ip);
    if (!gate.ok) {
      reply.header('Retry-After', String(gate.retryAfterSec ?? 3600));
      return reply.code(429).send({ error: 'too_many_attempts' });
    }

    const login = normalizeLogin(req.body?.login ?? '');
    const password = req.body?.password ?? '';
    if (!isValidLogin(login)) return reply.code(400).send({ error: 'invalid_login' });
    if (password.length < PASSWORD_MIN) return reply.code(400).send({ error: 'weak_password' });
    if (findByLogin.get(login)) return reply.code(409).send({ error: 'login_taken' });

    const accountId = newId();
    const recoveryCode = generateRecoveryCode();
    let issued!: { deviceId: string; deviceToken: string };

    try {
      withTransaction(() => {
        insertAccount.run(accountId, hashRecoveryCode(recoveryCode), login, hashPassword(password));
        issued = issueDevice(accountId, req.body?.device_label ?? null, req.body?.platform ?? null);
        insertBlob.run(accountId, '{}');
      });
    } catch (err) {
      // Гонка: между проверкой выше и вставкой логин мог занять другой запрос.
      if (String(err).includes('UNIQUE')) return reply.code(409).send({ error: 'login_taken' });
      throw err;
    }

    return reply.code(201).send({
      account_id: accountId,
      device_id: issued.deviceId,
      device_token: issued.deviceToken,
      login,
    });
  });

  /** Вход с любого устройства: пара логин/пароль → новый токен устройства. */
  app.post<{ Body: AuthBody }>('/auth/login', async (req, reply) => {
    const gate = loginRateLimit(req.ip);
    if (!gate.ok) {
      reply.header('Retry-After', String(gate.retryAfterSec ?? 3600));
      return reply.code(429).send({ error: 'too_many_attempts' });
    }

    const login = normalizeLogin(req.body?.login ?? '');
    const password = req.body?.password ?? '';
    const row = findByLogin.get(login) as AccountRow | undefined;

    // Одинаковый ответ на «нет такого логина» и «неверный пароль»:
    // иначе форма превращается в способ узнать, какие логины заняты.
    if (!row || !verifyPassword(password, row.password_hash)) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    const issued = issueDevice(row.id, req.body?.device_label ?? null, req.body?.platform ?? null);
    return reply.code(200).send({
      account_id: row.id,
      device_id: issued.deviceId,
      device_token: issued.deviceToken,
      login: row.login,
    });
  });

  /**
   * Привязать логин и пароль к текущему аккаунту (или сменить пароль).
   * Именно этим устройство, у которого аккаунт уже есть, открывает себе
   * вход с других устройств — не создавая второй, пустой аккаунт.
   */
  app.post<{ Body: AuthBody }>('/auth/credentials', { preHandler: requireAuth }, async (req, reply) => {
    const { accountId } = (req as FastifyRequest & { device: AuthedDevice }).device;

    const login = normalizeLogin(req.body?.login ?? '');
    const password = req.body?.password ?? '';
    if (!isValidLogin(login)) return reply.code(400).send({ error: 'invalid_login' });
    if (password.length < PASSWORD_MIN) return reply.code(400).send({ error: 'weak_password' });

    const existing = findByLogin.get(login) as AccountRow | undefined;
    if (existing && existing.id !== accountId) return reply.code(409).send({ error: 'login_taken' });

    try {
      setCredentials.run(login, hashPassword(password), accountId);
    } catch (err) {
      if (String(err).includes('UNIQUE')) return reply.code(409).send({ error: 'login_taken' });
      throw err;
    }
    return reply.code(200).send({ ok: true, login });
  });

  /** Кто я: есть ли у текущего аккаунта логин. UI по этому решает, что показывать. */
  app.get('/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const { accountId } = (req as FastifyRequest & { device: AuthedDevice }).device;
    const row = findById.get(accountId) as AccountRow | undefined;
    if (!row) return reply.code(404).send({ error: 'account_not_found' });
    return reply.code(200).send({ account_id: row.id, login: row.login });
  });

  /** Ограничения формы — чтобы клиент не дублировал константы. */
  app.get('/auth/limits', async (_req, reply) =>
    reply.send({ login_min: LOGIN_MIN, login_max: LOGIN_MAX, password_min: PASSWORD_MIN }),
  );
}
