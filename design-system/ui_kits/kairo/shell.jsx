/* Kairo UI kit — app shell: matrix rain, titlebar, sidebar, header, status bar. */
const KD = window.KAIRO;
const KIcon = KD.Icon;

function MatrixRain() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }); if (!ctx) return;
    const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789!@#$%^&*+=<>{}[]/\\|';
    const FONT = 14; let cols = 0, drops = [], speeds = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT + 'px "JetBrains Mono", monospace'; ctx.textBaseline = 'top';
      cols = Math.floor(w / FONT);
      drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -50));
      speeds = new Array(cols).fill(0).map(() => 0.5 + Math.random() * 1.2);
    };
    resize(); window.addEventListener('resize', resize);
    let raf = 0, last = 0; const STEP = 1000 / 24;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - last < STEP) return; last = now;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) {
        const x = i * FONT, yHead = drops[i] * FONT;
        const g = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        ctx.fillStyle = '#0A9F2C'; ctx.fillText(g, x, yHead);
        if (Math.random() > 0.975) { ctx.fillStyle = '#E8FFE8'; ctx.shadowColor = '#00FF41'; ctx.shadowBlur = 8; ctx.fillText(g, x, yHead); ctx.shadowBlur = 0; }
        drops[i] += speeds[i];
        if (yHead > h && Math.random() > 0.965) { drops[i] = Math.floor(Math.random() * -20); speeds[i] = 0.5 + Math.random() * 1.2; }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="matrix-canvas" />;
}

function Clock() {  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return <>{now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>;
}

function Sidebar({ route, setRoute }) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <aside className="bevel-raised" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%', width: collapsed ? 44 : 180, background: 'var(--panel-bg)', padding: 6, gap: 4 }}>
      <button onClick={() => setCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px', height: 28, background: 'transparent', border: 'none', cursor: 'pointer' }} title={collapsed ? 'развернуть' : 'свернуть'}>
        <img src="../../assets/kairo-mark.png" width={collapsed ? 20 : 18} height={collapsed ? 20 : 18} alt="Kairo" style={{ display: 'block', filter: 'drop-shadow(0 0 5px var(--accent-glow))', flexShrink: 0 }} />
        {!collapsed && <><span className="neon-text" style={{ flex: 1, textAlign: 'left', fontWeight: 700, letterSpacing: 2, fontSize: 13 }}>KAIRO</span><KIcon name="chevron-left" size={12} color="var(--text-muted)" /></>}
      </button>
      {!collapsed && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {KD.NAV.map(n => {
          const active = route === n.id;
          return (
            <button key={n.id} onClick={() => setRoute(n.id)} title={collapsed ? n.label : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', height: 28, fontSize: 11, cursor: 'pointer', textAlign: 'left',
                background: active ? 'var(--accent-dim)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none', borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, textShadow: active ? '0 0 6px var(--accent-glow)' : 'none', fontFamily: 'var(--font-ui)' }}>
              <KIcon name={n.icon} size={13} />
              {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: 'var(--text-dim)' }}>$ </span>{n.cmd}</span>}
            </button>
          );
        })}
      </nav>
      {!collapsed && <div className="cursor-blink" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', padding: '0 4px' }}><span style={{ color: 'var(--accent)' }}>$</span></div>}
    </aside>
  );
}

function Header({ search, setSearch, onTheme, onCapture }) {
  return (
    <div className="bevel-raised" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--panel-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '0 8px', height: 28, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
        <span className="neon-text" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>поиск&nbsp;»</span>
        <KIcon name="search" size={11} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="поиск задач..." data-selectable
          style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)' }} />
      </div>
      <button className="bevel-raised" onClick={onTheme} title="режим оформления" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-surface)', cursor: 'pointer' }}>
        <KIcon name="palette" size={11} /> тема
      </button>
      <button className="bevel-raised" onClick={onCapture} title="новая задача (N)" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-surface)', cursor: 'pointer' }}>
        <KIcon name="lock" size={11} /> блок
      </button>
    </div>
  );
}

function StatusBar({ stats }) {
  const pad = n => String(n).padStart(3, '0');
  const Sep = () => <span style={{ color: 'var(--text-dim)' }}>│</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', fontSize: 11, background: 'var(--statusbar-bg)', borderTop: '1px solid var(--border-subtle)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="led led-blink" /><span className="neon-text" style={{ letterSpacing: 1 }}>В СЕТИ</span></span>
      <Sep /><span style={{ color: 'var(--text-muted)' }}>всего <span className="font-mono" style={{ color: 'var(--text-bright)' }}>{pad(stats.total)}</span></span>
      <Sep /><span style={{ color: 'var(--text-muted)' }}>активных <span className="font-mono" style={{ color: 'var(--text-bright)' }}>{pad(stats.open)}</span></span>
      <Sep /><span style={{ color: 'var(--text-muted)' }}>выполнено <span className="font-mono" style={{ color: 'var(--text-bright)' }}>{pad(stats.done)}</span></span>
      {stats.overdue > 0 && <><Sep /><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="led led-red led-blink" /><span className="neon-danger" style={{ fontWeight: 700 }}>ПРОСРОЧЕНО {pad(stats.overdue)}</span></span></>}
      <div style={{ flex: 1 }} />
      <span className="font-mono" style={{ color: 'var(--text-muted)' }}><Clock /></span>
    </div>
  );
}

window.KairoShell = { MatrixRain, Sidebar, Header, StatusBar };
