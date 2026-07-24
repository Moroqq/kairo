// Тонкая обёртка над Groq Whisper через Deno-прокси.
// Груз шлём через ffmpeg-транскод в WAV: MediaRecorder на Android может
// отдавать экзотические контейнеры (matroska/webm-opus без правильного
// mux), а Groq хочет чистый распознаваемый формат. WAV — беспроигрышный.

import { spawn } from 'node:child_process';

const BASE = process.env.GROQ_BASE_URL ?? 'https://api.groq.com';
const URL_TRANSCRIBE = `${BASE.replace(/\/$/, '')}/openai/v1/audio/transcriptions`;
const PROXY_SECRET = process.env.OPENROUTER_PROXY_SECRET ?? '';
const MODEL = process.env.GROQ_STT_MODEL ?? 'whisper-large-v3-turbo';

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

  const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
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
