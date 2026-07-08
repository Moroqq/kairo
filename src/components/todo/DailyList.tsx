import { useState } from 'react';
import { Plus } from 'lucide-react';
import { todayISO } from '@/lib/date';
import { useDailies, useAddDaily, useDeleteDaily, useToggleDaily } from '@/hooks/useDailies';
import { DailyRow } from './DailyRow';

/** Дэйлики: простой список привычек — чекбоксы сбрасываются каждый новый день сами собой. */
export function DailyList() {
  const date = todayISO();
  const { data: dailies } = useDailies(date);
  const addDaily    = useAddDaily();
  const deleteDaily = useDeleteDaily();
  const toggleDaily = useToggleDaily();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const list = dailies ?? [];
  const doneCount = list.filter((d) => d.done).length;

  const handleAdd = () => {
    const title = draft.trim();
    if (title) addDaily.mutate(title);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '12px 12px 28px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Заголовок */}
        <div className="flex items-baseline gap-2 mb-4 font-mono">
          <span className="neon-text" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>ДЭЙЛИКИ</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 0.5 }}>
            · {doneCount} из {list.length} сегодня
          </span>
        </div>

        {/* Список */}
        {list.length === 0 && (
          <p className="font-mono text-xs py-10 text-center" style={{ color: 'var(--text-dim)' }}>
            // пока пусто — заведи привычку, которая нужна каждый день
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((daily) => (
            <DailyRow
              key={daily.id}
              daily={daily}
              onToggle={() => toggleDaily.mutate({ id: daily.id, date })}
              onDelete={() => deleteDaily.mutate(daily.id)}
            />
          ))}
        </div>

        {/* Добавить дэйлик */}
        {adding ? (
          <div
            style={{
              marginTop: 12, display: 'flex', alignItems: 'stretch',
              background: 'var(--bg-card)', border: '1px solid var(--accent)',
              borderRadius: 'var(--shape-full)', overflow: 'hidden',
            }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
              onBlur={handleAdd}
              placeholder="название дэйлика…"
              style={{
                flex: 1, minWidth: 0, height: 46, padding: '0 20px',
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, color: 'var(--text-primary)',
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="font-mono"
            style={{
              marginTop: 12, width: '100%', height: 48,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'transparent',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--shape-full)',
              color: 'var(--accent)', fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> добавить дэйлик
          </button>
        )}
      </div>
    </div>
  );
}
