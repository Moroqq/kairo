import { useState } from 'react';
import { Check, Trash2, Plus, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ExpenseView } from '@/types/expense';

export interface ExpenseFormValues {
  name: string;
  amount: number;
  dayOfMonth: number;
  note: string | null;
}

interface Props {
  initial?: ExpenseView;
  onSave: (values: ExpenseFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onTogglePaid?: () => void;
  isPaid?: boolean;
}

export function ExpenseForm({ initial, onSave, onCancel, onDelete, onTogglePaid, isPaid = false }: Props) {
  const [name,    setName]    = useState(initial?.name ?? '');
  const [amount,  setAmount]  = useState(initial ? String(initial.amount) : '');
  const [day,     setDay]     = useState(initial ? String(initial.dayOfMonth) : '1');
  const [note,    setNote]    = useState(initial?.note ?? '');
  const [paid,    setPaid]    = useState(isPaid);

  const amountNum = parseFloat(amount.replace(',', '.'));
  const dayNum    = parseInt(day, 10);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(amountNum) && amountNum > 0 &&
    Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 31;

  const isEdit = !!initial;

  const handleToggle = () => {
    setPaid(p => !p);
    onTogglePaid?.();
  };

  const handleSave = () => {
    if (!valid) return;
    onSave({
      name: name.trim(),
      amount: amountNum,
      dayOfMonth: dayNum,
      note: note.trim() || null,
    });
  };

  return (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      {/* Paid toggle — только в режиме редактирования */}
      {isEdit && (
        <button
          type="button"
          onClick={handleToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 48, padding: '0 14px', cursor: 'pointer',
            background: paid ? 'var(--accent-dim)' : 'var(--bg-input)',
            border: `1px solid ${paid ? 'var(--accent)' : 'var(--border)'}`,
            color: paid ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 14,
            transition: 'background 200ms ease, border-color 200ms ease, color 200ms ease',
          }}
        >
          <span style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${paid ? 'var(--accent)' : 'var(--border-strong)'}`,
            background: paid ? 'var(--accent)' : 'transparent',
            transition: 'background 200ms ease, border-color 200ms ease',
          }}>
            {paid && <Check size={13} color="#000" strokeWidth={3} />}
          </span>
          <span className="font-mono" style={{ fontSize: 13 }}>
            {paid ? 'оплачено · снять отметку' : 'отметить оплаченным'}
          </span>
        </button>
      )}

      <Input
        label="описание"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="напр. подписка claude"
        autoFocus={!isEdit}
        data-selectable
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave(); }}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="сумма, ₽"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          data-selectable
        />
        <Input
          label="день"
          type="number"
          inputMode="numeric"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="1"
          data-selectable
        />
      </div>

      <Input
        label="категория"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="жильё · связь · infra…"
        data-selectable
      />

      <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
        <span style={{ color: 'var(--accent)' }}>›</span>{' '}
        оплата каждый месяц
        {dayNum >= 1 && dayNum <= 31 ? `, ${dayNum}-го числа` : ''}
      </p>

      <div className="flex gap-2 pt-1">
        {isEdit && onDelete && (
          <Button variant="danger" size="md" onClick={onDelete}>
            <Trash2 size={14} /> удалить
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="md" onClick={onCancel}>отмена</Button>
          <Button variant="primary" size="md" onClick={handleSave} disabled={!valid}>
            {isEdit ? <><Save size={14} /> сохранить</> : <><Plus size={14} /> добавить</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
