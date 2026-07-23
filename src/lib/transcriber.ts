import { getCredentials } from '@/lib/account';

const SERVER_URL =
  (import.meta.env.VITE_KAIRO_SERVER_URL as string | undefined) ?? 'http://localhost:8787';

/**
 * Транскрибация аудио через наш VPS (Fastify → Deno-прокси → Groq Whisper).
 * Требует привязанного облачного аккаунта (device-токен для Bearer-auth).
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const creds = getCredentials();
  if (!creds) throw new Error('no_account');

  const form = new FormData();
  form.append('audio', audioBlob, 'audio.webm');

  const res = await fetch(`${SERVER_URL}/ai/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${creds.deviceToken}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`transcribe_failed:${res.status}:${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { text: string };
  return data.text;
}
