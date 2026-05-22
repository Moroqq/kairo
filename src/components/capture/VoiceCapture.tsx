import { useState } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { LoadingDots } from '@/components/ui/Spinner';
import { ParsedPreview } from './ParsedPreview';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { parseVoice } from '@/services/parser.service';
import { useCreateTask } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';
import { useUIStore } from '@/stores/ui.store';
import type { TaskPreview } from '@/types';

export function VoiceCapture() {
  const [preview,    setPreview]    = useState<TaskPreview | null>(null);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast }    = useToast();
  const createTask   = useCreateTask();
  const closeCapture = useUIStore((s) => s.closeCapture);
  const { state, volume, startRecording, stopRecording, error } = useAudioRecorder();

  const handleStop = async () => {
    const blob = await stopRecording();
    if (!blob) { toast('No audio recorded', 'error'); return; }
    setProcessing(true);
    try {
      const { transcript: t, preview: p } = await parseVoice(blob);
      setTranscript(t);
      setPreview(p);
    } catch {
      toast('Voice parsing failed', 'error');
    } finally {
      setProcessing(false);
    }
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
        source_type: 'voice',
      });
      toast('Task created from voice');
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
        onBack={() => { setPreview(null); setTranscript(''); }}
        loading={createTask.isPending}
      />
    );
  }

  const isRecording = state === 'recording';

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Waveform visualizer */}
      <div className="flex items-end justify-center gap-1 h-12">
        {Array.from({ length: 20 }).map((_, i) => {
          const baseHeight  = 4;
          const maxExtra    = isRecording ? volume * 40 : 0;
          const variance    = isRecording ? Math.sin(Date.now() / 200 + i) * maxExtra * 0.5 : 0;
          const height      = baseHeight + maxExtra * 0.5 + variance;
          return (
            <motion.div
              key={i}
              animate={{ height: Math.max(4, height) }}
              transition={{ duration: 0.1 }}
              className="rounded-full w-1.5"
              style={{ background: isRecording ? 'var(--accent)' : 'var(--border)' }}
            />
          );
        })}
      </div>

      {/* Status text */}
      <div className="text-center">
        {state === 'idle' && !processing && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Press and hold to record
          </p>
        )}
        {isRecording && (
          <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Recording…</p>
        )}
        {processing && <LoadingDots />}
        {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>

      {/* Transcript preview */}
      {transcript && (
        <div
          className="w-full rounded-lg p-3 text-sm italic"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          "{transcript}"
        </div>
      )}

      {/* Record button */}
      {!processing && (
        <button
          onMouseDown={startRecording}
          onMouseUp={handleStop}
          onTouchStart={startRecording}
          onTouchEnd={handleStop}
          className="relative flex items-center justify-center rounded-full transition-all"
          style={{
            width:   72,
            height:  72,
            background: isRecording ? 'var(--danger)' : 'var(--accent)',
            boxShadow:  isRecording
              ? `0 0 0 ${8 + volume * 12}px rgba(239,68,68,0.2)`
              : '0 4px 24px rgba(0,240,202,0.3)',
          }}
        >
          {isRecording
            ? <Square  size={24} fill="white" style={{ color: 'white' }} />
            : <Mic     size={24} style={{ color: '#000' }} />
          }
        </button>
      )}

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Hold the button while speaking · Release to process
      </p>
    </div>
  );
}
