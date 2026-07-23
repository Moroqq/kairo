// Тонкая обёртка над Groq Whisper через Deno-прокси на пути /groq/*.
// Groq (как и OpenRouter) блокируется Cloudflare с российских IP;
// проксируем всё исходящее.

const BASE = process.env.GROQ_BASE_URL ?? 'https://api.groq.com';
const URL_TRANSCRIBE = `${BASE.replace(/\/$/, '')}/openai/v1/audio/transcriptions`;
const PROXY_SECRET = process.env.OPENROUTER_PROXY_SECRET ?? ''; // тот же секрет прокси

const MODEL = process.env.GROQ_STT_MODEL ?? 'whisper-large-v3-turbo';

export async function groqTranscribe(audio: Buffer, mime: string, filename: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const form = new FormData();
  form.append('file', new Blob([audio], { type: mime }), filename);
  form.append('model', MODEL);
  form.append('response_format', 'json');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (PROXY_SECRET) headers['X-Proxy-Secret'] = PROXY_SECRET;

  const res = await fetch(URL_TRANSCRIBE, { method: 'POST', headers, body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`groq ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = (await res.json()) as { text?: string };
  if (typeof data.text !== 'string') throw new Error('groq: no text in response');
  return data.text;
}
