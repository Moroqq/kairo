import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import { openRouterChat } from '../openrouter.js';
import { groqTranscribe } from '../groq.js';

const TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL ?? 'nvidia/nemotron-3-ultra-550b-a55b:free';
const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL ?? 'nvidia/nemotron-nano-12b-v2-vl:free';

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
      const raw = await openRouterChat({
        model: TEXT_MODEL,
        maxTokens: 512,
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
    try {
      const raw = await openRouterChat({
        model: IMAGE_MODEL,
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
      req.log.error({ err }, 'ai_parse_image_failed');
      return reply.code(502).send({ error: 'ai_failed', detail: String(err) });
    }
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
