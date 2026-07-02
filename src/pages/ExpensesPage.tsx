import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense, useTogglePaid } from '@/hooks/useExpenses';
import { formatMoney } from '@/services/expense.service';
import { ExpenseForm, type ExpenseFormValues } from '@/components/expense/ExpenseForm';
import type { ExpenseView } from '@/types/expense';

type Editing = { mode: 'add' } | { mode: 'edit'; item: ExpenseView } | null;

function daysColor(d: number): string {
  if (d <= 1) return 'var(--danger)';
  if (d <= 5) return 'var(--warning)';
  return 'var(--text-muted)';
}

export function ExpensesPage() {
  const { data }      = useExpenses();
  const addExpense    = useAddExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const togglePaid    = useTogglePaid();

  const [editing, setEditing] = useState<Editing>(null);

  const views     = data?.views ?? [];
  const active    = views.filter(e => !e.paid);
  const remaining = active.reduce((s, e) => s + e.amount, 0);
  const next      = [...active].sort((a, b) => a.daysUntil - b.daysUntil)[0];
  const list      = [...views].sort((a, b) => {
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    return a.daysUntil - b.daysUntil;
  });

  const handleSave = useCallback((values: ExpenseFormValues) => {
    if (editing?.mode === 'edit') {
      updateExpense.mutate({ id: editing.item.id, updates: values });
    } else {
      addExpense.mutate(values);
    }
    setEditing(null);
  }, [editing, addExpense, updateExpense]);

  const handleDelete = useCallback((id: string) => {
    deleteExpense.mutate(id);
    setEditing(null);
  }, [deleteExpense]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '12px 12px 28px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* ── Заголовок ── */}
        <div className="flex items-baseline gap-2 mb-4 font-mono">
          <span className="neon-text" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>ТРАТЫ</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 0.5 }}>
            · {active.length} из {views.length} активны
          </span>
        </div>

        {/* ── Две сводные карточки ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 14 }}>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              осталось в месяц
            </div>
            <div className="neon-text font-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, letterSpacing: -0.5 }}>
              {formatMoney(remaining)}
            </div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 14 }}>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              ближайший
            </div>
            {next ? (
              <>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {next.name}
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--warning)', marginTop: 3 }}>
                  через {next.daysUntil} дн · {formatMoney(next.amount)}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, color: 'var(--accent)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} /> всё оплачено
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                  // на этот месяц
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Список ── */}
        {views.length === 0 && (
          <p className="font-mono text-xs py-10 text-center" style={{ color: 'var(--text-dim)' }}>
            // трат пока нет — добавь первую
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(e => {
            const dc = daysColor(e.daysUntil);
            return (
              <motion.div
                key={e.id}
                layout
                animate={{ opacity: e.paid ? 0.6 : 1 }}
                transition={{ duration: 0.32, ease: 'easeInOut', layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
                style={{
                  display: 'flex', alignItems: 'stretch',
                  background: 'var(--bg-card)',
                  border: `1px solid ${e.paid ? 'var(--border-subtle)' : 'var(--border)'}`,
                  overflow: 'hidden',
                  transition: 'border-color 320ms ease',
                }}
              >
                {/* Чекбокс оплаты */}
                <button
                  type="button"
                  onClick={() => togglePaid.mutate(e.id)}
                  aria-label={e.paid ? 'снять отметку' : 'отметить оплаченным'}
                  style={{
                    width: 46, flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none',
                    borderRight: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${e.paid ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: e.paid ? 'var(--accent)' : 'transparent',
                    boxShadow: e.paid ? '0 0 10px var(--accent-glow)' : 'none',
                    transition: 'background 260ms ease, border-color 260ms ease, box-shadow 260ms ease',
                  }}>
                    {e.paid && (
                      <Check
                        size={13}
                        color="#000"
                        strokeWidth={3}
                        style={{ animation: 'km-pop 240ms ease-out' }}
                      />
                    )}
                  </span>
                </button>

                {/* Тело строки → открывает редактор */}
                <button
                  type="button"
                  onClick={() => setEditing({ mode: 'edit', item: e })}
                  style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {/* Блок с числом */}
                  <span style={{ width: 34, flexShrink: 0, textAlign: 'center' }}>
                    <span className="font-mono" style={{
                      display: 'block', fontSize: 18, fontWeight: 700,
                      color: e.paid ? 'var(--text-muted)' : 'var(--text-bright)',
                      fontVariantNumeric: 'tabular-nums',
                      transition: 'color 320ms ease',
                    }}>{e.dayOfMonth}</span>
                    <span className="font-mono" style={{ display: 'block', fontSize: 10, color: 'var(--text-dim)' }}>числа</span>
                  </span>

                  {/* Название + мета */}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontSize: 15,
                      color: 'var(--text-primary)',
                      opacity: e.paid ? 0.55 : 1,
                      textDecorationLine: 'line-through',
                      textDecorationColor: e.paid ? 'var(--text-muted)' : 'transparent',
                      transition: 'opacity 320ms ease, text-decoration-color 320ms ease',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{e.name}</span>
                    <span className="font-mono" style={{
                      display: 'block', fontSize: 12,
                      color: e.paid ? 'var(--success)' : dc,
                      marginTop: 2,
                      transition: 'color 320ms ease',
                    }}>
                      {e.paid ? 'оплачено' : `через ${e.daysUntil} дн`}
                      {e.note ? ` · #${e.note}` : ''}
                    </span>
                  </span>

                  {/* Сумма */}
                  <span className="font-mono" style={{
                    fontSize: 15, fontWeight: 600, flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                    color: e.paid ? 'var(--text-muted)' : 'var(--text-bright)',
                    opacity: e.paid ? 0.75 : 1,
                    textDecorationLine: 'line-through',
                    textDecorationColor: e.paid ? 'var(--text-muted)' : 'transparent',
                    transition: 'color 320ms ease, opacity 320ms ease, text-decoration-color 320ms ease',
                  }}>{formatMoney(e.amount)}</span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* ── Добавить трату ── */}
        <button
          type="button"
          onClick={() => setEditing({ mode: 'add' })}
          className="font-mono"
          style={{
            marginTop: 12, width: '100%', height: 48,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'transparent',
            border: '1px dashed var(--border-strong)',
            color: 'var(--accent)', fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> добавить трату
        </button>
      </div>

      {/* ── Модальный редактор ── */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'изменить трату' : 'новая трата'}
        width={420}
      >
        {editing && (
          <ExpenseForm
            initial={editing.mode === 'edit' ? editing.item : undefined}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            onDelete={editing.mode === 'edit' ? () => handleDelete(editing.item.id) : undefined}
            onTogglePaid={editing.mode === 'edit' ? () => togglePaid.mutate(editing.item.id) : undefined}
            isPaid={editing.mode === 'edit' ? editing.item.paid : false}
          />
        )}
      </Modal>
    </div>
  );
}
