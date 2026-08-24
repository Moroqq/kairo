import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Раздача манифеста апдейтера и файлов релиза.
 *
 * Зачем это здесь. И `tauri.conf.json` (`plugins.updater.endpoints`), и
 * ручной Android-путь в клиенте ходят за `/update/latest.json`. При этом
 * в репозитории такого эндпоинта не существовало вообще: предполагалось,
 * что файл руками положен на VPS и раздаётся отдельным location в nginx.
 * Нигде не описанный, он же и был точкой отказа — клиент показывал
 * «Failed to fetch», хотя сам бэкенд был жив.
 *
 * Теперь маршрут принадлежит репозиторию: сервер отдаёт то, что лежит в
 * каталоге релизов, и внятно объясняет, если там пусто.
 *
 * Каталог: $KAIRO_UPDATE_DIR (по умолчанию server/data/update).
 * Публикация релиза = положить в него latest.json и файл сборки.
 *
 * Формат latest.json — стандартный для tauri-plugin-updater:
 * {
 *   "version": "0.4.8",
 *   "notes": "что нового",
 *   "pub_date": "2026-08-24T10:00:00Z",
 *   "platforms": {
 *     "windows-x86_64":  { "signature": "...", "url": "https://<host>/update/Kairo_0.4.8_x64-setup.exe" },
 *     "android-aarch64": { "signature": "",    "url": "https://<host>/update/kairo-0.4.8.apk" }
 *   }
 * }
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPDATE_DIR = process.env.KAIRO_UPDATE_DIR ?? join(__dirname, '..', '..', 'data', 'update');

/** Только простые имена файлов — никаких `..`, слэшей и скрытых файлов. */
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

const CONTENT_TYPES: Record<string, string> = {
  '.apk':  'application/vnd.android.package-archive',
  '.exe':  'application/octet-stream',
  '.msi':  'application/octet-stream',
  '.dmg':  'application/octet-stream',
  '.deb':  'application/vnd.debian.binary-package',
  '.gz':   'application/gzip',
  '.zip':  'application/zip',
  '.sig':  'text/plain',
  '.json': 'application/json',
};

function contentTypeFor(name: string): string {
  const dot = name.lastIndexOf('.');
  return (dot >= 0 && CONTENT_TYPES[name.slice(dot).toLowerCase()]) || 'application/octet-stream';
}

export function registerUpdateRoutes(app: FastifyInstance): void {
  /** Манифест. Читаем с диска на каждый запрос — публикация релиза не требует рестарта. */
  app.get('/update/latest.json', async (_req, reply) => {
    const file = join(UPDATE_DIR, 'latest.json');
    let raw: string;
    try {
      raw = await readFile(file, 'utf-8');
    } catch {
      return reply.code(404).send({
        error: 'manifest_not_published',
        detail: `Нет файла ${file}. Положи в этот каталог latest.json и сборки релиза.`,
      });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return reply.code(500).send({ error: 'manifest_invalid_json', detail: `Не разобрался в ${file}` });
    }
    // no-store: апдейтер должен видеть свежий манифест сразу после публикации.
    return reply.header('Cache-Control', 'no-store').send(parsed);
  });

  /** Файлы релиза (APK / установщики), на которые ссылается манифест. */
  app.get<{ Params: { file: string } }>('/update/:file', async (req, reply) => {
    const name = req.params.file;
    if (!SAFE_NAME.test(name)) return reply.code(400).send({ error: 'bad_file_name' });
    if (name === 'latest.json') return reply.callNotFound(); // обработан выше

    const path = join(UPDATE_DIR, name);
    let size: number;
    try {
      const st = await stat(path);
      if (!st.isFile()) return reply.code(404).send({ error: 'not_found' });
      size = st.size;
    } catch {
      return reply.code(404).send({ error: 'not_found' });
    }

    return reply
      .header('Content-Type', contentTypeFor(name))
      .header('Content-Length', String(size))
      .header('Content-Disposition', `attachment; filename="${name}"`)
      .send(createReadStream(path));
  });
}
