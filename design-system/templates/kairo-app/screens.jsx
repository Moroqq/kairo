/* Kairo UI kit — screens: board, focus, sheet + capture / theme modals. */
const DS = window.KairoDesignSystem_6fc2cc;
const { TaskCard, KanbanColumn, PriorityBadge, Modal, Input, Button } = DS;
const K = window.KAIRO;

function BoardScreen({ tasks, search, onAdvance }) {
  const q = search.trim().toLowerCase();
  const visible = tasks.filter(t => !q || t.title.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
  return (
    <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, height: '100%', padding: 8, minWidth: 'max-content' }}>
        {K.COLUMNS.map(col => {
          const colTasks = visible.filter(t => t.col === col.id);
          return (
            <KanbanColumn key={col.id} title={col.title} count={colTasks.length}>
              {colTasks.map(t => (
                <TaskCard key={t.id} title={t.title} category={t.category} deadline={t.deadline}
                  deadlineState={t.deadlineState} comments={t.comments} createdLabel={t.created} urgent={t.urgent}
                  onAdvance={col.id !== 'done' ? () => onAdvance(t.id) : undefined}
                  advanceIcon={<K.Icon name="chevron-right" size={12} />} />
              ))}
            </KanbanColumn>
          );
        })}
      </div>
    </div>
  );
}

function FocusScreen({ items, onToggle }) {
  const open = items.filter(i => !i.done);
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <K.Icon name="target" size={16} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-bright)' }}>фокус на сегодня</span>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{open.length} активных</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(i => (
            <div key={i.id} className="row-hover" onClick={() => onToggle(i.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', opacity: i.done ? 0.45 : 1 }}>
              <span style={{ width: 16, height: 16, flexShrink: 0, border: `1px solid ${i.done ? 'var(--accent)' : 'var(--border-strong)'}`, background: i.done ? 'var(--accent)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                {i.done && <K.Icon name="check" size={11} color="#000" />}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', textDecoration: i.done ? 'line-through' : 'none' }}>{i.title}</span>
              <PriorityBadge priority={i.prio} showLabel={false} />
              {i.deadline && <span className="font-mono" style={{ fontSize: 10, color: i.deadlineState === 'overdue' ? 'var(--danger)' : i.deadlineState === 'urgent' ? 'var(--warning)' : 'var(--text-muted)' }}>{i.deadline}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LINE = 28;
function SheetScreen({ items, onToggle, onAdd }) {
  const [draft, setDraft] = React.useState('');
  const done = items.filter(i => i.done).length;
  const add = () => { const t = draft.trim(); if (t) { onAdd(t); setDraft(''); } };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '12px 8px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 560, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-elevated)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, padding: '14px 16px 6px 56px', borderBottom: '2px solid var(--border)' }}>
          <span className="font-hand" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-bright)', lineHeight: 1.1 }}>пятница, 18 июня</span>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', paddingBottom: 6 }}>{done}/{items.length}</span>
        </div>
        <div style={{ position: 'relative', padding: '8px 12px 8px 56px', minHeight: LINE * 6,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE - 1}px, var(--border-subtle) ${LINE - 1}px, var(--border-subtle) ${LINE}px)`, backgroundOrigin: 'content-box' }}>
          <span style={{ position: 'absolute', left: 44, top: 0, bottom: 0, width: 1, background: 'var(--border-danger)', opacity: 0.5, pointerEvents: 'none' }} />
          {items.map(i => (
            <div key={i.id} onClick={() => onToggle(i.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: LINE, cursor: 'pointer' }}>
              <span style={{ width: 12, flexShrink: 0, color: i.done ? 'var(--accent)' : 'var(--text-dim)', fontSize: 13 }}>{i.done ? '✓' : '·'}</span>
              <span className="font-hand" style={{ fontSize: 13, color: i.done ? 'var(--text-dim)' : 'var(--text-primary)', textDecoration: i.done ? 'line-through' : 'none' }}>{i.title}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: LINE }}>
            <span style={{ width: 12, flexShrink: 0, color: 'var(--text-dim)', fontSize: 14 }}>+</span>
            <input className="font-hand" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="дописать…" data-selectable
              style={{ flex: 1, minWidth: 0, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ icon, label }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-dim)' }}>
      <K.Icon name={icon} size={32} color="var(--text-muted)" />
      <span className="font-mono" style={{ fontSize: 12 }}>// {label} — раздел в разработке</span>
    </div>
  );
}

function CaptureModal({ open, onClose, onCreate }) {
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState('');
  const [prio, setPrio] = React.useState('C');
  const submit = () => { if (title.trim()) { onCreate({ title: title.trim(), category: cat.trim() || undefined, prio }); setTitle(''); setCat(''); setPrio('C'); onClose(); } };
  return (
    <Modal open={open} onClose={onClose} title="новая задача" width={440}>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="название" placeholder="что нужно сделать…" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <Input label="категория" placeholder="bug · web · дела…" value={cat} onChange={e => setCat(e.target.value)} />
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}><span style={{ color: 'var(--accent)' }}>›</span> приоритет</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['A', 'B', 'C', 'D'].map(p => (
              <button key={p} onClick={() => setPrio(p)} style={{ cursor: 'pointer', background: 'transparent', border: 'none', opacity: prio === p ? 1 : 0.4, transition: 'opacity 120ms' }}>
                <PriorityBadge priority={p} showLabel={false} />
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <Button onClick={onClose}>отмена</Button>
          <Button variant="primary" icon={<K.Icon name="plus" size={12} />} onClick={submit}>создать</Button>
        </div>
      </div>
    </Modal>
  );
}

function ThemePicker({ open, onClose, theme, setTheme }) {
  return (
    <Modal open={open} onClose={onClose} title="режим оформления" width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12 }}>
        {K.THEMES.map(t => {
          const active = t.id === theme;
          return (
            <button key={t.id || 'matrix'} onClick={() => setTheme(t.id)} className="row-hover"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', minHeight: 52, textAlign: 'left', cursor: 'pointer', background: 'transparent',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`, boxShadow: active ? '0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)' : 'none' }}>
              <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {t.preview.map((c, i) => <span key={i} style={{ width: 14, height: 14, background: c, border: '1px solid rgba(128,128,128,0.4)' }} />)}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, padding: '6px 0' }}>
                <span className="font-mono" style={{ fontWeight: 700, fontSize: 12, letterSpacing: 2, color: 'var(--text-primary)' }}>{t.name}</span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.tagline}</span>
              </span>
              {active && <K.Icon name="check" size={15} color="var(--accent)" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

window.KairoScreens = { BoardScreen, FocusScreen, SheetScreen, Placeholder, CaptureModal, ThemePicker };
