/**
 * Ошибка с кодом ответа: вызывающая сторона по нему решает, имеет ли смысл
 * повторить запрос на другой модели. 429 от общего бесплатного пула — имеет,
 * 400 из-за кривого запроса — нет.
 */
export class OpenRouterError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

const BASE = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai';
const URL = `${BASE.replace(/\/$/, '')}/api/v1/chat/completions`;
const PROXY_SECRET = process.env.OPENROUTER_PROXY_SECRET ?? '';

/** Столько ждём одну vision-модель. Их перебирается несколько — держим короче чата. */
const TIMEOUT_MS = Number(process.env.AI_IMAGE_TIMEOUT_MS ?? 30_000);

type Content =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

export interface ORMessage {
  role: 'system' | 'user' | 'assistant';
  content: Content;
}

export interface ORChatParams {
  model: string;
  messages: ORMessage[];
  maxTokens?: number;
}

export async function openRouterChat(params: ORChatParams): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://kairoupdate.duckdns.org',
    'X-Title': 'Kairo',
  };
  if (PROXY_SECRET) headers['X-Proxy-Secret'] = PROXY_SECRET;

  const res = await fetch(URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 512,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new OpenRouterError(res.status, `openrouter ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new Error('openrouter: no text in response');
  return text;
}
