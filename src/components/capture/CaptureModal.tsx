import { useState } from 'react';
import { PenLine, Type, Mic, Image } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ManualCapture } from './ManualCapture';
import { TextCapture } from './TextCapture';
import { VoiceCapture } from './VoiceCapture';
import { ImageCapture } from './ImageCapture';
import { useUIStore } from '@/stores/ui.store';

type Tab = 'manual' | 'text' | 'voice' | 'image';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'manual', label: 'вручную', icon: <PenLine size={15} /> },
  { id: 'text',   label: 'AI',      icon: <Type    size={15} /> },
  { id: 'voice',  label: 'голос',   icon: <Mic     size={15} /> },
  { id: 'image',  label: 'фото',    icon: <Image   size={15} /> },
];

export function CaptureModal() {
  const isCaptureOpen = useUIStore((s) => s.isCaptureOpen);
  const closeCapture  = useUIStore((s) => s.closeCapture);
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  return (
    <Modal open={isCaptureOpen} onClose={closeCapture} title="новая задача — захват" width={520}>
      {/* Win9x property-sheet tabs */}
      {/* Tabs — touch-friendly, min 44px height */}
      <div className="flex items-stretch gap-0 px-1 pt-2" style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: 0 }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 font-mono select-none"
              style={{
                minHeight: 44,
                fontSize: 13,
                letterSpacing: 0.5,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 400,
                textShadow: active ? '0 0 6px var(--accent-glow)' : 'none',
                cursor: 'pointer',
                transition: 'color 150ms, border-color 150ms',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content panel */}
      <div style={{ background: 'var(--bg-surface)', minHeight: 320 }}>
        {activeTab === 'manual' && <ManualCapture />}
        {activeTab === 'text'   && <TextCapture />}
        {activeTab === 'voice'  && <VoiceCapture />}
        {activeTab === 'image'  && <ImageCapture />}
      </div>
    </Modal>
  );
}
