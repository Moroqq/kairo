import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, type PanInfo } from 'framer-motion';
import { DayView } from './DayView';

/** Высота свёрнутого состояния — заголовок дня + краешек первой задачи. */
export const DAY_SHEET_PEEK = 118;

const SHEET_RATIO = 0.72; // доля высоты контейнера, которую лист занимает в развёрнутом виде
const SPRING = { type: 'spring', duration: 0.3, bounce: 0 } as const;

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

interface Props {
  date: string;
  /** Высота контейнера в px — нужна, чтобы посчитать развёрнутое положение. */
  containerHeight: number;
}

/**
 * Выдвижная панель задач дня: снизу видна шапка + краешек первой строки,
 * потянув пальцем вверх — раскрывается в полный список (DayView).
 * Пока развёрнута — тап по затемнённой области календаря сверху сворачивает её,
 * чтобы можно было выбрать другой день (иначе лист перекрывает сетку).
 *
 * Положение хранится в motion value, а не в `animate={{ y }}`, и вот почему.
 * Свёрнутая позиция считается от высоты контейнера, а та на телефоне меняется
 * уже после монтирования — досчитывается нижняя навигация, приезжает
 * safe-area, схлопывается адресная строка. Пока позиция была декларативной,
 * каждый такой пересчёт framer-motion отыгрывал пружиной: лист заметно
 * съезжал вниз на своё место сразу после открытия раздела (замеры показывали
 * поездку под сотню пикселей).
 *
 * Теперь причина изменения различается явно. Жест и тап по ручке — анимируем,
 * это намерение пользователя. Изменение геометрии — ставим мгновенно, потому
 * что лист никуда не «едет», он просто всё это время должен был быть там.
 */
export function DaySheet({ date, containerHeight }: Props) {
  const [expanded, setExpanded] = useState(false);

  const sheetHeight = Math.max(Math.round(containerHeight * SHEET_RATIO), DAY_SHEET_PEEK + 40);
  const collapsedY  = sheetHeight - DAY_SHEET_PEEK;

  const y = useMotionValue(collapsedY);
  const knownCollapsedY = useRef(collapsedY);

  /** Переключение состояния — единственный путь, на котором анимация уместна. */
  const toggle = useCallback((next: boolean) => {
    setExpanded(next);
    animate(y, next ? 0 : knownCollapsedY.current, SPRING);
  }, [y]);

  // Пересчёт геометрии — без анимации. useLayoutEffect, чтобы новое положение
  // попало в тот же кадр и не мелькнуло старое.
  useLayoutEffect(() => {
    if (knownCollapsedY.current === collapsedY) return;
    knownCollapsedY.current = collapsedY;
    y.set(expanded ? 0 : collapsedY);
  }, [collapsedY, expanded, y]);

  // Новый день выбран — схлопываем. На первом рендере лист и так свёрнут,
  // так что анимация здесь ничего не проигрывает.
  useEffect(() => { toggle(false); }, [date, toggle]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const finalY = clamp(y.get(), 0, collapsedY);
    const mid = collapsedY / 2;
    const shouldExpand = info.velocity.y < -300 || (Math.abs(info.velocity.y) <= 300 && finalY < mid);
    toggle(shouldExpand);
  };

  return (
    <>
      {/* Тап мимо листа, пока он развёрнут — сворачивает, чтобы открылся доступ к календарю */}
      {expanded && (
        <div
          className="absolute left-0 right-0 top-0"
          style={{ bottom: sheetHeight, zIndex: 4 }}
          onClick={() => toggle(false)}
        />
      )}

      <motion.div
        className="absolute left-0 right-0 bottom-0 flex flex-col"
        style={{
          y,
          height: sheetHeight,
          background: 'var(--overlay-bg)',
          borderTop: '1px solid var(--border)',
          borderTopLeftRadius: 'var(--radius)',
          borderTopRightRadius: 'var(--radius)',
          boxShadow: '0 -8px 28px rgba(0,0,0,0.35)',
          zIndex: 5,
          touchAction: 'none',
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: collapsedY }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        {/* Ручка */}
        <div
          onClick={() => toggle(!expanded)}
          className="flex items-center justify-center flex-shrink-0"
          style={{ height: 26, cursor: 'grab' }}
          title={expanded ? 'свернуть' : 'развернуть'}
        >
          <span style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>

        <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
          <DayView date={date} onClose={() => toggle(false)} />
        </div>
      </motion.div>
    </>
  );
}
