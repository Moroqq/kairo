import {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /**
   * Текущая дата в формате `YYYY-MM-DD` (или пустая строка).
   * Совместимо с тем, что отдаёт нативный `<input type="date">`.
   */
  value: string;
  /**
   * Возвращает `YYYY-MM-DD` либо пустую строку при невалидном вводе.
   */
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

/**
 * Поле ввода дедлайна без года.
 * Юзер вводит `дд.мм` (можно без точки — поставится автоматически), год определяется:
 *   если дата `dd.mm` ещё не наступила в этом году → используется текущий год,
 *   иначе → следующий.
 *
 * Под полем показывается «расшифровка» — день, месяц и (опционально) год,
 * если он не совпадает с текущим. Это даёт юзеру явный фидбек, не загромождая ввод.
 */
export function DayMonthInput({
  value,
  onChange,
  label,
  error,
  className = '',
  style,
  ...rest
}: Props) {
  // Внешний value (YYYY-MM-DD) → отображаемый «дд.мм»
  const display = useMemo(() => {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return '';
    return `${m[3]}.${m[2]}`;
  }, [value]);

  const [raw, setRaw] = useState(display);

  // Если value поменялся снаружи (напр. форма очистилась) — синкаем отображение
  useEffect(() => {
    setRaw(display);
  }, [display]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Оставляем только цифры и точки
    let v = e.target.value.replace(/[^\d.]/g, '');

    // Авто-вставка точки после двух цифр
    if (/^\d{3,4}$/.test(v)) {
      v = v.slice(0, 2) + '.' + v.slice(2);
    }
    // Ограничение длины: ДД.ММ = 5 символов
    if (v.length > 5) v = v.slice(0, 5);

    setRaw(v);

    // Пустой ввод — очищаем сохранённую дату
    if (v === '') {
      onChange('');
      return;
    }

    // Парсим «Д.М», «ДД.М», «Д.ММ», «ДД.ММ»
    const m = v.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (!m) {
      // Промежуточное состояние (юзер ещё печатает) — не трогаем onChange
      return;
    }

    const day   = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (!isValidDayMonth(day, month)) return;

    const iso = resolveYearAndFormat(day, month);
    if (iso) onChange(iso);
  };

  // Подсказка под полем: «→ 5 мая» или «→ 5 мая (2027)» если год не текущий
  const hint = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const dayMonth = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const yr  = d.getFullYear();
    const nowYr = new Date().getFullYear();
    return yr === nowYr ? `→ ${dayMonth}` : `→ ${dayMonth} (${yr})`;
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> {label}
        </label>
      )}
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={raw}
        onChange={handleChange}
        placeholder="дд.мм"
        maxLength={5}
        className={`h-7 px-2 text-xs outline-none font-mono ${className}`}
        style={{
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
          letterSpacing: 1,
          ...style,
        }}
      />
      {hint && (
        <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
          {hint}
        </span>
      )}
      {error && (
        <p className="text-xs font-mono" style={{ color: 'var(--danger)' }}>
          [ошибка] {error}
        </p>
      )}
    </div>
  );
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function isValidDayMonth(day: number, month: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Проверка дней в месяце с учётом високосного года
  const daysIn = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysIn[month - 1];
}

/** Дата `dd.mm` → ближайшая будущая (включая сегодня) → ISO `YYYY-MM-DD`. */
function resolveYearAndFormat(day: number, month: number): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let year = today.getFullYear();
  let candidate = new Date(year, month - 1, day);

  // Если уже прошло в этом году — берём следующий
  if (candidate.getTime() < today.getTime()) {
    year += 1;
    candidate = new Date(year, month - 1, day);
  }
  // Безопасность: убеждаемся, что Date не перекрутился (напр. 31 февраля)
  if (candidate.getDate() !== day || candidate.getMonth() !== month - 1) return null;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
