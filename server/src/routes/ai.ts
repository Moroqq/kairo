import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import { openRouterChat, OpenRouterError } from '../openrouter.js';
import { groqTranscribe, groqChat } from '../groq.js';

/**
 * Имена моделей — расходник, а не константа.
 *
 * Провайдеры снимают модели с раздачи молча: в какой-то момент и
 * `llama-3.3-70b-versatile` у Groq, и `nemotron-nano-12b-v2-vl:free` у
 * OpenRouter стали отвечать 404 `model_not_found`. Наружу это выглядело как
 * «ИИ не работает» сразу в трёх местах — текст, картинки и голос (голос
 * ходит через транскрибацию в тот же текстовый разбор).
 *
 * Отсюда два правила ниже: значения переопределяются переменными окружения,
 * чтобы чинить это правкой конфига без пересборки, а для картинок хранится
 * список, а не одно имя, — бесплатные vision-модели живут в общем пуле
 * провайдера и регулярно отдают 429, поэтому нужен не «упасть», а «взять
 * следующую».
 *
 * Актуальный список моделей всегда можно посмотреть у провайдера:
 *   curl -H "authorization: Bearer $GROQ_API_KEY" $GROQ_BASE_URL/openai/v1/models
 */
const TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? 'openai/gpt-oss-120b';

const DEFAULT_IMAGE_MODELS = [
  'minimax/minimax-m3:free',
  'dots-studio/dots-3-note-preview:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
];
const IMAGE_MODELS = (process.env.OPENROUTER_IMAGE_MODELS ?? process.env.OPENROUTER_IMAGE_MODEL ?? '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const IMAGE_MODEL_CHAIN = IMAGE_MODELS.length > 0 ? IMAGE_MODELS : DEFAULT_IMAGE_MODELS;

/**
 * Коды, при которых имеет смысл взять следующую модель: перегруз, лимит,
 * снятая с раздачи модель, недоступный провайдер. На 400 и 401 перебор
 * бесполезен — проблема в запросе или ключе, и повторится на любой модели.
 */
const TRY_NEXT_MODEL = new Set([402, 403, 404, 408, 429, 500, 502, 503, 504]);

const SYSTEM_PROMPT = `You are a task parser for a personal operational management system.
Extract task information from the user's input and return ONLY valid JSON — no markdown, no explanation.

Return exactly this structure:
{
  "title": "short action-oriented title (max 60 chars)",
  "description": "expanded details, or empty string",
  "priority": "A|B|C",
  "category": "inferred category or empty string",
  "deadline": "ISO8601 datetime or null",
  "summary": "one concise sentence summary"
}

Priority rules:
- A: urgent, critical, immediate, emergency, asap
- B: today, must do, important, high priority
- C: planned, scheduled, normal, this week, optional, someday, nice to have

Today's date: {TODAY}
Resolve relative dates (tomorrow, next Monday, через 2 дня) to absolute ISO8601 dates.
If no deadline mentioned, return null for deadline.
Respond in the same language as the input for title, description, and category.`;

function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('no_json_in_response');
  return JSON.parse(match[0]);
}

interface TextBody { text?: string }
interface ImageBody { image?: string; mime?: string }

export function registerAiRoutes(app: FastifyInstance): void {
  app.post<{ Body: TextBody }>('/ai/parse-text', { preHandler: requireAuth }, async (req, reply) => {
    const input = req.body?.text?.trim();
    if (!input) return reply.code(400).send({ error: 'text_required' });

    const today = new Date().toISOString().split('T')[0];
    try {
      const raw = await groqChat({
        model: TEXT_MODEL,
        // Рассуждающие модели (gpt-oss) часть бюджета тратят на размышление
        // до первого видимого токена; 512 не хватало на ответ целиком.
        maxTokens: 1024,
        json: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT.replace('{TODAY}', today) },
          { role: 'user', content: input },
        ],
      });
      return extractJson(raw);
    } catch (err) {
      req.log.error({ err }, 'ai_parse_text_failed');
      return reply.code(502).send({ error: 'ai_failed', detail: String(err) });
    }
  });

  app.post<{ Body: ImageBody }>('/ai/parse-image', { preHandler: requireAuth }, async (req, reply) => {
    const image = req.body?.image;
    const mime = req.body?.mime ?? 'image/png';
    if (!image) return reply.code(400).send({ error: 'image_required' });

    const today = new Date().toISOString().split('T')[0];
    let lastErr: unknown = new Error('no image models configured');

    for (const model of IMAGE_MODEL_CHAIN) {
      try {
        const raw = await openRouterChat({
          model,
          maxTokens: 512,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT.replace('{TODAY}', today) },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:${mime};base64,${image}` } },
                { type: 'text', text: 'Extract the task from this screenshot/image.' },
              ],
            },
          ],
        });
        return extractJson(raw);
      } catch (err) {
        lastErr = err;
        const status = err instanceof OpenRouterError ? err.status : 0;
        // Ошибка не из-за перегруза — следующая модель не спасёт, выходим сразу.
        if (status !== 0 && !TRY_NEXT_MODEL.has(status)) break;
        req.log.warn({ model, err }, 'ai_image_model_unavailable');
      }
    }

    req.log.error({ err: lastErr, tried: IMAGE_MODEL_CHAIN }, 'ai_parse_image_failed');
    return reply.code(502).send({
      error: 'ai_failed',
      detail: String(lastErr),
      tried: IMAGE_MODEL_CHAIN,
    });
  });

  /**
   * Транскрибация аудио через Groq Whisper.
   * multipart/form-data: `audio` (файл) — обязательное поле.
   * Возвращает { text } — расшифрованный текст.
   */
  app.post('/ai/transcribe', {
    preHandler: requireAuth,
    // ограничение размера ~25 МБ (лимит Groq Whisper)
    bodyLimit: 26 * 1024 * 1024,
  }, async (req, reply) => {
    const parts = req.parts();
    let audio: Buffer | null = null;
    let mime = 'audio/webm';
    let filename = 'audio.webm';
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'audio') {
        audio = await part.toBuffer();
        mime = part.mimetype || mime;
        filename = part.filename || filename;
      }
    }
    if (!audio) return reply.code(400).send({ error: 'audio_required' });

    try {
      const text = await groqTranscribe(audio, mime, filename);
      return { text };
    } catch (err) {
      req.log.error({ err }, 'ai_transcribe_failed');
      return reply.code(502).send({ error: 'ai_failed', detail: String(err) });
    }
  });
}
