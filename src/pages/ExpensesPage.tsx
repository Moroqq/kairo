import { useState } from 'react';
import { Plus, Pencil, Trash2, CalendarClock } from 'lucide-react';
import { fromISODate } from '@/lib/date';
import { Modal } from '@/components/ui/Modal';
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { formatMoney } from '@/services/expense.service';
import { ExpenseForm, type ExpenseFormValues } from '@/components/expense/ExpenseForm';
import type { ExpenseView } from '@/types/expense';

type Editing = { mode: 'add' } | { mode: 'edit'; item: ExpenseView } | null;

/** Цвет счётчика «дней до оплаты»: ≤3 — опасно, ≤7 — скоро, иначе спокойно. */
function daysColor(d: number): string {
  if (d <= 3) return 'var(--danger)';
  if (d <= 7) return 'var(--warning)';
  return 'var(--text-secondary)';
}

function daysLabel(d: number): string {
  if (d === 0) return 'сегодня';
  if (d === 1) return 'завтра';
  return `${d} дн.`;
}

export function ExpensesPage() {
  const { data } = useExpenses();
  const addExpense    = useAddExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [editing, setEditing] = useState<Editing>(null);

  const views = data?.views ?? [];
  const total = data?.total ?? 0;

  const handleSave = (values: ExpenseFormValues) => {
    if (editing?.mode === 'edit') {
      updateExpense.mutate({ id: editing.item.id, updates: values });
    } else {
      addExpense.mutate(values);
    }
    setEditing(null);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 font-mono">
          <span className="neon-text" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
            ТРАТЫ
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>
            <span style={{ color: 'var(--accent)' }}>›</span> регулярные платежи
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setEditing({ mode: 'add' })}
            className="bevel-raised flex items-center gap-1 px-2.5 text-xs"
            style={{ minHeight: 36, background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            title="добавить трату"
          >
            <Plus size={13} className="neon-text" /> трата
          </button>
        </div>

        {/* Total */}
        <div
          className="flex items-baseline justify-between px-3 py-2.5 mb-3"
          style={{
            border: '1px solid var(--border-strong)',
            background: 'linear-gradient(90deg, var(--accent-dim) 0%, transparent 70%)',
          }}
        >
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: 1, color: 'var(--text-muted)' }}>
            В МЕСЯЦ
          </span>
          <span className="font-mono neon-text" style={{ fontSize: 20, fontWeight: 700 }}>
            {formatMoney(total)}
          </span>
        </div>

        {/* Empty state */}
        {views.length === 0 && (
          <p className="font-mono text-xs py-10 text-center" style={{ color: 'var(--text-dim)' }}>
            // трат пока нет — добавь первую
          </p>
        )}

        {/* List (sorted by days-until) */}
        <div className="flex flex-col gap-1.5">
          {views.map((e) => {
            const date = fromISODate(e.nextPaymentISO);
            const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
            return (
              <div
                key={e.id}
                className="row-hover flex items-center gap-3 px-3"
                style={{
                  minHeight: 52,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--well-bg)',
                  borderLeft: `3px solid ${daysColor(e.daysUntil)}`,
                }}
              >
                {/* Name + note */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {e.name}
                  </span>
                  <span className="font-mono flex items-center gap-1" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    <CalendarClock size={10} /> {dateStr} · {e.dayOfMonth}-го
                  </span>
                </div>

                {/* Amount */}
                <span className="font-mono flex-shrink-0" style={{ fontSize: 13, color: 'var(--text-bright)', fontWeight: 600 }}>
                  {formatMoney(e.amount)}
                </span>

                {/* Days until */}
                <span
                  className="font-mono flex-shrink-0 text-right"
                  style={{ fontSize: 11, minWidth: 56, color: daysColor(e.daysUntil), fontWeight: e.daysUntil <= 7 ? 700 : 400 }}
                >
                  {daysLabel(e.daysUntil)}
                </span>

                {/* Actions */}
                <div className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing({ mode: 'edit', item: e })}
                    className="flex items-center justify-center"
                    style={{ width: 36, height: 36, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="изменить"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExpense.mutate(e.id)}
                    className="flex items-center justify-center"
                    style={{ width: 36, height: 36, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="удалить"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit modal */}
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
          />
        )}
      </Modal>
    </div>
  );
}
