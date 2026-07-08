import { useEffect, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
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
 */
export function DaySheet({ date, containerHeight }: Props) {
  const [expanded, setExpanded] = useState(false);

  const sheetHeight = Math.max(Math.round(containerHeight * SHEET_RATIO), DAY_SHEET_PEEK + 40);
  const collapsedY  = sheetHeight - DAY_SHEET_PEEK;

  // Новый день выбран — схлопываем.
  useEffect(() => { setExpanded(false); }, [date]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const startY = expanded ? 0 : collapsedY;
    const finalY = clamp(startY + info.offset.y, 0, collapsedY);
    const mid = collapsedY / 2;
    const shouldExpand = info.velocity.y < -300 || (Math.abs(info.velocity.y) <= 300 && finalY < mid);
    setExpanded(shouldExpand);
  };

  return (
    <>
      {/* Тап мимо листа, пока он развёрнут — сворачивает, чтобы открылся доступ к календарю */}
      {expanded && (
        <div
          className="absolute left-0 right-0 top-0"
          style={{ bottom: sheetHeight, zIndex: 4 }}
          onClick={() => setExpanded(false)}
        />
      )}

      <motion.div
        className="absolute left-0 right-0 bottom-0 flex flex-col"
        style={{
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
        animate={{ y: expanded ? 0 : collapsedY }}
        transition={SPRING}
        onDragEnd={onDragEnd}
      >
        {/* Ручка */}
        <div
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center flex-shrink-0"
          style={{ height: 26, cursor: 'grab' }}
          title={expanded ? 'свернуть' : 'развернуть'}
        >
          <span style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>

        <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
          <DayView date={date} onClose={() => setExpanded(false)} />
        </div>
      </motion.div>
    </>
  );
}
