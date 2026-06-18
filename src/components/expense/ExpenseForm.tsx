import { useState } from 'react';
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
}

/** Форма создания/редактирования регулярной траты. */
export function ExpenseForm({ initial, onSave, onCancel }: Props) {
  const [name,   setName]   = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [day,    setDay]    = useState(initial ? String(initial.dayOfMonth) : '1');
  const [note,   setNote]   = useState(initial?.note ?? '');

  const amountNum = parseFloat(amount.replace(',', '.'));
  const dayNum    = parseInt(day, 10);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(amountNum) && amountNum > 0 &&
    Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 31;

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
      <Input
        label="название"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="напр. Telegram Premium"
        autoFocus
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
          placeholder="300"
          data-selectable
        />
        <Input
          label="день оплаты"
          type="number"
          inputMode="numeric"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="1"
          data-selectable
        />
      </div>

      <Input
        label="заметка"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="необязательно"
        data-selectable
      />

      <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
        <span style={{ color: 'var(--accent)' }}>›</span> оплата каждый месяц, {dayNum >= 1 && dayNum <= 31 ? `${dayNum}-го числа` : '— число —'}
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onCancel}>отмена</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={!valid}>
          {initial ? 'сохранить' : 'добавить'}
        </Button>
      </div>
    </div>
  );
}
