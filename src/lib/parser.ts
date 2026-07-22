import type { TaskPreview } from '@/types';
import { getCredentials } from '@/lib/account';

const SERVER_URL =
  (import.meta.env.VITE_KAIRO_SERVER_URL as string | undefined) ?? 'http://localhost:8787';

async function callParse<TBody extends object>(path: string, body: TBody): Promise<TaskPreview> {
  const creds = getCredentials();
  if (!creds) throw new Error('no_account');

  const res = await fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creds.deviceToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`parse_failed:${res.status}:${text.slice(0, 200)}`);
  }
  return (await res.json()) as TaskPreview;
}

export function parseTaskFromText(input: string): Promise<TaskPreview> {
  return callParse('/ai/parse-text', { text: input });
}

export function parseTaskFromImage(base64Image: string, mimeType: string): Promise<TaskPreview> {
  return callParse('/ai/parse-image', { image: base64Image, mime: mimeType });
}
