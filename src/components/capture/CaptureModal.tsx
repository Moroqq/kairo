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
  { id: 'manual', label: 'вручную', icon: <PenLine size={12} /> },
  { id: 'text',   label: 'AI',      icon: <Type    size={12} /> },
  { id: 'voice',  label: 'голос',   icon: <Mic     size={12} /> },
  { id: 'image',  label: 'фото',    icon: <Image   size={12} /> },
];

export function CaptureModal() {
  const isCaptureOpen = useUIStore((s) => s.isCaptureOpen);
  const closeCapture  = useUIStore((s) => s.closeCapture);
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  return (
    <Modal open={isCaptureOpen} onClose={closeCapture} title="новая задача — захват" width={520}>
      {/* Win9x property-sheet tabs */}
      <div className="flex items-end gap-0.5 px-1 pt-1" style={{ marginBottom: -1 }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 h-6 text-xs font-medium ${
                active ? 'bevel-raised' : 'bevel-raised'
              }`}
              style={{
                background: 'var(--bg-surface)',
                color: active ? '#000' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                marginBottom: active ? -2 : 0,
                zIndex: active ? 2 : 1,
                borderBottomColor: active ? 'var(--bg-surface)' : 'var(--edge-dark)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content panel */}
      <div
        className="bevel-raised"
        style={{ background: 'var(--bg-surface)', minHeight: 260 }}
      >
        {activeTab === 'manual' && <ManualCapture />}
        {activeTab === 'text'   && <TextCapture />}
        {activeTab === 'voice'  && <VoiceCapture />}
        {activeTab === 'image'  && <ImageCapture />}
      </div>
    </Modal>
  );
}
