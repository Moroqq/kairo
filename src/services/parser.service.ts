import { parseTaskFromText, parseTaskFromImage } from '@/lib/parser';
import { transcribeAudio } from '@/lib/transcriber';
import type { TaskPreview } from '@/types';

export async function parseText(text: string): Promise<TaskPreview> {
  if (!text.trim()) throw new Error('Input is empty');
  return parseTaskFromText(text.trim());
}

export async function parseVoice(audioBlob: Blob): Promise<{ transcript: string; preview: TaskPreview }> {
  const transcript = await transcribeAudio(audioBlob);
  if (!transcript.trim()) throw new Error('Transcription returned empty result');
  const preview = await parseTaskFromText(transcript.trim());
  return { transcript, preview };
}

export async function parseImage(file: File): Promise<TaskPreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const [header, base64] = dataUrl.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const preview = await parseTaskFromImage(base64, mimeType);
        resolve(preview);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
