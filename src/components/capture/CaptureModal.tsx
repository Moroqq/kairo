import { useState } from 'react';
import { Type, Mic, Image } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextCapture } from './TextCapture';
import { VoiceCapture } from './VoiceCapture';
import { ImageCapture } from './ImageCapture';
import { useUIStore } from '@/stores/ui.store';

type Tab = 'text' | 'voice' | 'image';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'text',  label: 'Text',  icon: <Type  size={14} /> },
  { id: 'voice', label: 'Voice', icon: <Mic   size={14} /> },
  { id: 'image', label: 'Image', icon: <Image size={14} /> },
];

export function CaptureModal() {
  const isCaptureOpen = useUIStore((s) => s.isCaptureOpen);
  const closeCapture  = useUIStore((s) => s.closeCapture);
  const [activeTab, setActiveTab] = useState<Tab>('text');

  return (
    <Modal open={isCaptureOpen} onClose={closeCapture} title="New Task" width={540}>
      {/* Tab bar */}
      <div
        className="flex gap-1 px-5 pt-4 pb-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-all"
              style={{
                color:       active ? 'var(--accent)'       : 'var(--text-muted)',
                background:  active ? 'var(--bg-card)'      : 'transparent',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ minHeight: 260 }}>
        {activeTab === 'text'  && <TextCapture />}
        {activeTab === 'voice' && <VoiceCapture />}
        {activeTab === 'image' && <ImageCapture />}
      </div>
    </Modal>
  );
}
