import { useEffect, useState } from 'react';

/**
 * Знак команды ObserV.
 *
 * Логотип — белая фигура на прозрачном фоне. Показывать его картинкой нельзя:
 * в светлой теме SNOW белое на белом исчезает, в NORD спорит с синим. Поэтому
 * картинка works как маска, а цвет даёт `currentColor` — тот же, каким набрано
 * название рядом. Меняется тема — меняется и знак.
 *
 * Файл подхватывается по факту наличия. Пока его нет, компонент не рисует
 * ничего: маска без картинки превратилась бы в залитый прямоугольник, а это
 * заметно хуже, чем просто название без знака.
 */

const SRC = '/observ-logo.png';

interface Props {
  /** Высота знака в px; ширина считается из пропорций картинки. */
  height?: number;
}

export function ObservMark({ height = 14 }: Props) {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive && img.naturalHeight > 0) setRatio(img.naturalWidth / img.naturalHeight);
    };
    img.onerror = () => { /* файла нет — знак просто не появится */ };
    img.src = SRC;
    return () => { alive = false; };
  }, []);

  if (ratio === null) return null;

  const mask = {
    maskImage: `url(${SRC})`,
    WebkitMaskImage: `url(${SRC})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  } as const;

  return (
    <span
      aria-label="ObserV"
      role="img"
      style={{
        display: 'inline-block',
        height,
        width: Math.round(height * ratio),
        background: 'currentColor',
        flexShrink: 0,
        ...mask,
      }}
    />
  );
}
