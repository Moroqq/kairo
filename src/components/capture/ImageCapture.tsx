import { useState, useCallback } from 'react';
import { Image, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingDots } from '@/components/ui/Spinner';
import { ParsedPreview } from './ParsedPreview';
import { parseImage } from '@/services/parser.service';
import { useCreateTask } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';
import { useUIStore } from '@/stores/ui.store';
import type { TaskPreview } from '@/types';

export function ImageCapture() {
  const [preview,   setPreview]   = useState<TaskPreview | null>(null);
  const [imgUrl,    setImgUrl]    = useState<string | null>(null);
  const [parsing,   setParsing]   = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const { toast }   = useToast();
  const createTask  = useCreateTask();
  const closeCapture = useUIStore((s) => s.closeCapture);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast('Only image files are supported', 'error'); return; }
    setImgUrl(URL.createObjectURL(file));
    setParsing(true);
    try {
      const result = await parseImage(file);
      setPreview(result);
    } catch {
      toast('Image parsing failed', 'error');
    } finally {
      setParsing(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items)
      .find((i) => i.type.startsWith('image/'))
      ?.getAsFile();
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirm = async (p: TaskPreview) => {
    try {
      await createTask.mutateAsync({
        title:       p.title,
        description: p.description,
        priority:    p.priority,
        category:    p.category,
        deadline:    p.deadline,
        ai_summary:  p.summary,
        source_type: 'image',
      });
      toast('Task created from image');
      closeCapture();
    } catch {
      toast('Failed to create task', 'error');
    }
  };

  if (preview) {
    return (
      <ParsedPreview
        preview={preview}
        onConfirm={handleConfirm}
        onBack={() => { setPreview(null); setImgUrl(null); }}
        loading={createTask.isPending}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5" onPaste={handlePaste}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="flex flex-col items-center justify-center gap-3 rounded-card transition-all cursor-pointer"
        style={{
          height:     200,
          border:     `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          background: dragOver ? 'var(--accent-dim)' : 'var(--bg-card)',
        }}
      >
        {imgUrl && !parsing ? (
          <div className="relative">
            <img src={imgUrl} alt="preview" className="max-h-40 max-w-full rounded-lg object-contain" />
            <button
              onClick={() => setImgUrl(null)}
              className="absolute -top-2 -right-2 rounded-full p-0.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <X size={12} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        ) : parsing ? (
          <LoadingDots />
        ) : (
          <>
            <div
              className="p-4 rounded-full"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Image size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Drop image or paste screenshot
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Ctrl+V · Drag & drop · or choose file
              </p>
            </div>
          </>
        )}
      </div>

      {/* File picker */}
      <label className="flex items-center justify-center gap-2 cursor-pointer">
        <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        <Button variant="secondary" size="sm" className="gap-1.5 pointer-events-none">
          <Upload size={13} /> Choose file
        </Button>
      </label>
    </div>
  );
}
