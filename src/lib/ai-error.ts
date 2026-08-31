/**
 * Человеческий текст вместо «Не удалось разобрать».
 *
 * Три ИИ-функции — текст, картинка, голос — ловили ошибку пустым `catch {}`
 * и показывали одну и ту же строку. Когда провайдер снял с раздачи модель,
 * приложение сообщало ровно то же, что и при отсутствии сети, и понять,
 * что чинить, можно было только по логам сервера. Настоящая причина всегда
 * приходила в ответе — её просто выбрасывали.
 */

/** Достаёт detail/error из JSON-тела ответа сервера; если это не JSON — отдаёт как есть. */
function extractDetail(body: string): string {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown; error?: unknown };
    const detail = parsed.detail ?? parsed.error;
    if (typeof detail === 'string') return detail;
  } catch { /* не JSON — ниже вернём сырой текст */ }
  return body;
}

function short(text: string, limit = 160): string {
  const clean = text.trim();
  return clean.length > limit ? `${clean.slice(0, limit)}…` : clean;
}

export function describeAiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg === 'no_account') return 'Нужен вход в облако — ИИ работает через сервер.';
  if (msg.startsWith('Transcription returned empty')) return 'В записи не распозналась речь.';
  if (msg === 'Input is empty') return 'Пустой текст.';

  const parts = msg.match(/^(?:parse_failed|transcribe_failed):(\d+):([\s\S]*)$/);
  if (!parts) return short(msg);

  const status = Number(parts[1]);
  const detail = extractDetail(parts[2]);

  if (status === 401) return 'Сервер не принял устройство — перезайди в аккаунт на экране SYNC.';
  if (status === 413) return 'Файл слишком большой.';

  if (/model_not_found|does not exist|No endpoints found/i.test(detail)) {
    return `Модель ИИ снята с раздачи провайдером — нужно поменять её на сервере. ${short(detail, 100)}`;
  }
  if (/rate.?limit|quota|429|temporarily/i.test(detail)) {
    return 'Бесплатный пул модели сейчас перегружен — попробуй через минуту.';
  }
  if (/GROQ_API_KEY|OPENROUTER_API_KEY/i.test(detail)) {
    return 'На сервере не настроен ключ ИИ-провайдера.';
  }
  if (status === 502) return `Сервер не достучался до ИИ: ${short(detail)}`;

  return `Ошибка ИИ (${status}): ${short(detail)}`;
}
