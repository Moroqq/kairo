import { useEffect, useRef } from 'react';

/**
 * Matrix code rain — canvas-based, ~24fps. Rendered behind UI (.matrix-canvas).
 */
export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const GLYPHS =
      'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' +
      '0123456789' +
      '!@#$%^&*+=<>{}[]/\\|';

    const FONT_SIZE = 14;
    let cols = 0;
    let drops: number[] = [];
    let speeds: number[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_SIZE}px "JetBrains Mono", "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      cols   = Math.floor(w / FONT_SIZE);
      drops  = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -50));
      speeds = new Array(cols).fill(0).map(() => 0.5 + Math.random() * 1.2);
    };

    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = 0;
    const STEP = 1000 / 24;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < STEP) return;
      last = now;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Полупрозрачная заливка — «след» от падающих символов
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < cols; i++) {
        const x = i * FONT_SIZE;
        const yHead = drops[i] * FONT_SIZE;
        const glyph = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));

        ctx.fillStyle = '#0A9F2C';
        ctx.fillText(glyph, x, yHead);

        // Голова — яркий белый-зелёный с glow
        if (Math.random() > 0.975) {
          ctx.fillStyle = '#E8FFE8';
          ctx.shadowColor = '#00FF41';
          ctx.shadowBlur = 8;
          ctx.fillText(glyph, x, yHead);
          ctx.shadowBlur = 0;
        }

        drops[i] += speeds[i];

        if (yHead > h && Math.random() > 0.965) {
          drops[i]  = Math.floor(Math.random() * -20);
          speeds[i] = 0.5 + Math.random() * 1.2;
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="matrix-canvas" />;
}
