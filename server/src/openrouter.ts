const BASE = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai';
const URL = `${BASE.replace(/\/$/, '')}/api/v1/chat/completions`;
const PROXY_SECRET = process.env.OPENROUTER_PROXY_SECRET ?? '';

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
    'HTTP-Referer': 'https://kairogoupyrlife.duckdns.org',
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
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`openrouter ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new Error('openrouter: no text in response');
  return text;
}
