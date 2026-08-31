// Тонкая обёртка над Groq Whisper через Deno-прокси.
// Груз шлём через ffmpeg-транскод в WAV: MediaRecorder на Android может
// отдавать экзотические контейнеры (matroska/webm-opus без правильного
// mux), а Groq хочет чистый распознаваемый формат. WAV — беспроигрышный.

import { spawn } from 'node:child_process';

const BASE = process.env.GROQ_BASE_URL ?? 'https://api.groq.com';
const URL_TRANSCRIBE = `${BASE.replace(/\/$/, '')}/openai/v1/audio/transcriptions`;
const URL_CHAT = `${BASE.replace(/\/$/, '')}/openai/v1/chat/completions`;
const PROXY_SECRET = process.env.OPENROUTER_PROXY_SECRET ?? '';
const MODEL = process.env.GROQ_STT_MODEL ?? 'whisper-large-v3-turbo';

/**
 * Таймауты. Без них зависший апстрим вешает запрос навсегда: сервер молчит,
 * приложение крутит «разбираю…» и не показывает даже ошибки — состояние
 * хуже любого честного отказа. Именно так выглядел разбор текста, когда
 * прокси переставал отвечать: в логе оставался только «incoming request».
 */
/**
 * Просим несжатый ответ намеренно.
 *
 * Прокси перед провайдером ставит `Content-Encoding: gzip` на тело, которое
 * gzip-ом не является. curl этого не замечает — он по умолчанию сжатие не
 * запрашивает; а `fetch` в Node всегда шлёт `Accept-Encoding: gzip, deflate`,
 * получает битый поток и падает в `Error: incorrect header check` внутри
 * zlib. Наружу это выглядело хуже, чем ошибка: разбор текста просто висел,
 * а живые vision-модели, отвечавшие в curl двухсоткой, считались мёртвыми.
 *
 * `identity` убирает сжатие из уравнения целиком. Тела здесь маленькие
 * (JSON на пару килобайт), так что терять нечего.
 */
const NO_COMPRESSION = { 'Accept-Encoding': 'identity' } as const;

const CHAT_TIMEOUT_MS = Number(process.env.AI_CHAT_TIMEOUT_MS ?? 45_000);
const STT_TIMEOUT_MS = Number(process.env.AI_STT_TIMEOUT_MS ?? 120_000);

// ── Текстовый чат через Groq (OpenAI-совместимый) ───────────────────────────
// Бесплатный и быстрый; используется для парсинга текста в задачу вместо
// ':free'-моделей OpenRouter, которые часто отдают 429/503.

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatParams {
  model: string;
  messages: GroqMessage[];
  maxTokens?: number;
  /** Просить у модели строгий JSON (response_format json_object). */
  json?: boolean;
}

export async function groqChat(params: GroqChatParams): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...NO_COMPRESSION,
  };
  if (PROXY_SECRET) headers['X-Proxy-Secret'] = PROXY_SECRET;

  const send = (json: boolean) => {
    const body: Record<string, unknown> = {
      model: params.model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 1024,
      temperature: 0.2,
    };
    if (json) body.response_format = { type: 'json_object' };
    return fetch(URL_CHAT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
    });
  };

  let res = await send(params.json ?? false);

  // Строгий JSON-режим поддерживают не все модели, а рассуждающие (gpt-oss)
  // умеют потратить весь бюджет токенов на размышление и вернуть пустой
  // ответ — Groq отвечает на это 400 json_validate_failed. Ответ модели при
  // этом нам всё равно годится: extractJson выше по стеку достаёт объект
  // регуляркой из любого текста. Поэтому один раз пробуем без режима,
  // вместо того чтобы объявлять всю функцию сломанной.
  if (!res.ok && params.json && res.status === 400) {
    const probe = await res.text().catch(() => '');
    if (probe.includes('json_validate_failed') || probe.includes('response_format')) {
      res = await send(false);
    } else {
      throw new Error(`groq_chat 400: ${probe.slice(0, 500)}`);
    }
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`groq_chat ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new Error('groq_chat: no text in response');
  return text;
}

/**
 * Перекодирует любой входной аудио-буфер в mono 16kHz WAV через ffmpeg.
 * ffmpeg сам разберётся с контейнером/кодеком, а нам не надо гадать,
 * какой mime прислал клиент.
 */
async function transcodeToWav(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-i', 'pipe:0',
      '-ac', '1',           // mono
      '-ar', '16000',       // 16 kHz — то, что любит whisper
      '-f', 'wav',
      'pipe:1',
    ]);
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    ff.stdout.on('data', (c) => chunks.push(c));
    ff.stderr.on('data', (c) => errChunks.push(c));
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code !== 0) {
        const err = Buffer.concat(errChunks).toString().slice(0, 500);
        reject(new Error(`ffmpeg exit ${code}: ${err}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
    ff.stdin.write(input);
    ff.stdin.end();
  });
}

export async function groqTranscribe(audio: Buffer, _mime: string, _filename: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  // Всегда перекодируем в WAV — универсально и убирает целый класс
  // проблем с mime/контейнером.
  const wav = await transcodeToWav(audio);

  const form = new FormData();
  form.append('file', new Blob([wav], { type: 'audio/wav' }), 'audio.wav');
  form.append('model', MODEL);
  form.append('response_format', 'json');

  const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}`, ...NO_COMPRESSION };
  if (PROXY_SECRET) headers['X-Proxy-Secret'] = PROXY_SECRET;

  const res = await fetch(URL_TRANSCRIBE, {
    method: 'POST',
    headers,
    body: form,
    signal: AbortSignal.timeout(STT_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`groq ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = (await res.json()) as { text?: string };
  if (typeof data.text !== 'string') throw new Error('groq: no text in response');
  return data.text;
}
