import Anthropic from '@anthropic-ai/sdk';
import type { TaskPreview } from '@/types';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_PARSER_KEY as string,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a task parser for a personal operational management system.
Extract task information from the user's input and return ONLY valid JSON — no markdown, no explanation.

Return exactly this structure:
{
  "title": "short action-oriented title (max 60 chars)",
  "description": "expanded details, or empty string",
  "priority": "A|B|C|D",
  "category": "inferred category or empty string",
  "deadline": "ISO8601 datetime or null",
  "summary": "one concise sentence summary"
}

Priority rules:
- A: urgent, critical, immediate, emergency, asap
- B: today, must do, important, high priority
- C: planned, scheduled, normal, this week
- D: maybe, optional, someday, nice to have

Today's date: {TODAY}
Resolve relative dates (tomorrow, next Monday, через 2 дня) to absolute ISO8601 dates.
If no deadline mentioned, return null for deadline.
Respond in the same language as the input for title, description, and category.`;

export async function parseTaskFromText(input: string): Promise<TaskPreview> {
  const today = new Date().toISOString().split('T')[0];
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT.replace('{TODAY}', today),
    messages: [{ role: 'user', content: input }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse response');

  return JSON.parse(jsonMatch[0]) as TaskPreview;
}

export async function parseTaskFromImage(base64Image: string, mimeType: string): Promise<TaskPreview> {
  const today = new Date().toISOString().split('T')[0];
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT.replace('{TODAY}', today),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as 'image/png' | 'image/jpeg' | 'image/webp', data: base64Image },
          },
          {
            type: 'text',
            text: 'Extract the task from this screenshot/image.',
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse response');

  return JSON.parse(jsonMatch[0]) as TaskPreview;
}
