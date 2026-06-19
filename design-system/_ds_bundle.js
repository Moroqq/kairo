/* @ds-bundle: {"format":3,"namespace":"KairoDesignSystem_6fc2cc","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Textarea","sourcePath":"components/core/Input.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"LoadingDots","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"KanbanColumn","sourcePath":"components/task/KanbanColumn.jsx"},{"name":"PriorityBadge","sourcePath":"components/task/PriorityBadge.jsx"},{"name":"PriorityStripe","sourcePath":"components/task/PriorityBadge.jsx"},{"name":"TaskCard","sourcePath":"components/task/TaskCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"43561e3aa927","components/core/Button.jsx":"99aaf96abb50","components/core/Card.jsx":"2a1672ef32e8","components/core/Input.jsx":"5212dd7acac7","components/feedback/Modal.jsx":"64d50dd7503c","components/feedback/Spinner.jsx":"a2460283b840","components/feedback/Toast.jsx":"7db134b0c627","components/task/KanbanColumn.jsx":"7e3f2dbfa543","components/task/PriorityBadge.jsx":"fba5276fd056","components/task/TaskCard.jsx":"158c09fd9be1","ui_kits/kairo/data.js":"8501bf071f90","ui_kits/kairo/screens.jsx":"b2e60f7ddaa7","ui_kits/kairo/shell.jsx":"15904a5aeff3"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KairoDesignSystem_6fc2cc = window.KairoDesignSystem_6fc2cc || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Compact status pill. Defaults to a neutral elevated chip; pass `color`
 * (and optionally `bg`) for a tinted variant. In terminal themes the border
 * uses a faint tint of the text color.
 */
function Badge({
  color,
  bg,
  style,
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '1px 8px',
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      borderRadius: 'var(--radius-pill)',
      color: color ?? 'var(--text-secondary)',
      background: bg ?? 'var(--bg-elevated)',
      border: `1px solid ${color ?? 'var(--border)'}22`,
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kairo terminal button. Flat surface, 1px translucent-accent border, neon
 * glow on hover/focus. Four variants, three sizes. Hover/active states are
 * driven by the global `.btn-flat` rules in effects.css.
 */
function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon = null,
  disabled,
  children,
  style,
  ...props
}) {
  const sizes = {
    sm: {
      height: 'var(--control-sm)',
      padding: '0 12px',
      fontSize: 11
    },
    md: {
      height: 'var(--control-md)',
      padding: '0 16px',
      fontSize: 11
    },
    lg: {
      height: 'var(--control-lg)',
      padding: '0 24px',
      fontSize: 12
    }
  };
  const variants = {
    primary: {
      background: 'var(--accent-dim)',
      color: 'var(--accent)',
      border: '1px solid var(--accent)',
      textShadow: '0 0 6px var(--accent-glow)',
      boxShadow: '0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)',
      letterSpacing: 1
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
      letterSpacing: 0.5
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid transparent'
    },
    danger: {
      background: 'transparent',
      color: 'var(--danger)',
      border: '1px solid var(--border-danger)',
      textShadow: '0 0 6px rgba(255,0,60,0.5)',
      letterSpacing: 0.5
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    className: "btn-flat",
    "data-variant": variant,
    disabled: disabled || loading,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      fontFamily: 'var(--font-mono)',
      userSelect: 'none',
      cursor: 'pointer',
      opacity: disabled || loading ? 0.4 : 1,
      whiteSpace: 'nowrap',
      ...sizes[size],
      ...variants[variant],
      ...style
    }
  }, props), loading ? /*#__PURE__*/React.createElement("span", {
    className: "dot-pulse",
    style: {
      display: 'inline-flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)) : /*#__PURE__*/React.createElement(React.Fragment, null, icon, children));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Flat terminal surface. With `title`, renders a terminal title bar (●  TITLE
 * ✕) above the body. Use `well` for the recessed/sunken variant. Hover glow
 * is opt-in via `interactive`.
 */
function Card({
  title,
  well = false,
  interactive = false,
  onClose,
  children,
  style,
  bodyStyle,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: interactive ? 'bevel-raised' : '',
    style: {
      background: well ? 'var(--well-bg)' : 'var(--bg-card)',
      border: `1px solid ${well ? 'var(--border-subtle)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      boxShadow: well ? 'inset 0 0 0 1px rgba(0,0,0,0.4)' : 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...style
    }
  }, props), title && /*#__PURE__*/React.createElement("div", {
    className: "titlebar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "neon-text"
  }, "\u25CF"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), onClose && /*#__PURE__*/React.createElement("button", {
    className: "titlebar-btn",
    onClick: onClose,
    title: "Close"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      ...bodyStyle
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Terminal text field. Optional chevron label (`› label`) and an `[error]`
 * line below. Focus ring is the global neon rule in effects.css.
 */
function Input({
  label,
  error,
  style,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, "\u203A"), " ", label), /*#__PURE__*/React.createElement("input", _extends({
    style: {
      height: 'var(--control-sm)',
      padding: '0 8px',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      outline: 'none',
      background: 'var(--bg-input)',
      color: 'var(--text-primary)',
      border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      ...style
    }
  }, props)), error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--danger)',
      textShadow: '0 0 6px rgba(255,0,60,0.5)'
    }
  }, "[error] ", error));
}

/** Multi-line variant of {@link Input}. */
function Textarea({
  label,
  error,
  rows = 3,
  style,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, "\u203A"), " ", label), /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    style: {
      padding: '6px 8px',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      outline: 'none',
      resize: 'none',
      background: 'var(--bg-input)',
      color: 'var(--text-primary)',
      border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      ...style
    }
  }, props)), error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--danger)'
    }
  }, "[error] ", error));
}
Object.assign(__ds_scope, { Input, Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
/**
 * Modal dialog with terminal title bar, neon-bordered panel and a blurred
 * scrim. Closes on Escape and scrim click. Renders nothing when `open` is
 * false. (No animation library — keeps the bundle React-only.)
 */
function Modal({
  open,
  onClose,
  title = 'dialog',
  width = 520,
  children
}) {
  React.useEffect(() => {
    if (!open) return;
    const h = e => {
      if (e.key === 'Escape') onClose && onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(2px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'relative',
      zIndex: 10,
      width,
      maxWidth: '100%',
      maxHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--overlay-bg)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 0 0 1px var(--accent), 0 0 32px var(--accent-glow), 0 8px 40px rgba(0,0,0,0.8)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "titlebar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "neon-text"
  }, "\u25CF"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    className: "titlebar-btn",
    onClick: onClose,
    title: "Close"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      flex: 1
    }
  }, children)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
/** Spinning terminal loader (CSS `spin` keyframe from effects.css). */
function Spinner({
  size = 18,
  color,
  style
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color ?? 'var(--accent)',
    strokeWidth: "2.5",
    strokeLinecap: "round",
    style: {
      animation: 'spin 0.8s linear infinite',
      ...style
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
  }));
}

/** Three-dot pulse with an optional trailing label — used for AI "parsing" states. */
function LoadingDots({
  label = 'разбор…'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot-pulse",
    style: {
      display: 'inline-flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, label));
}
Object.assign(__ds_scope, { Spinner, LoadingDots });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CONFIG = {
  success: {
    color: 'var(--accent)',
    glow: 'var(--accent-glow)',
    tag: '[ок]'
  },
  error: {
    color: 'var(--danger)',
    glow: 'rgba(255,0,60,0.5)',
    tag: '[ошибка]'
  },
  info: {
    color: 'var(--info)',
    glow: 'rgba(0,229,255,0.5)',
    tag: '[инфо]'
  }
};

/**
 * Presentational toast row. The `tag` prefix and glowing border encode type.
 * Pair with your own queue/timeout logic; pass a lucide icon via `icon`.
 */
function Toast({
  type = 'success',
  icon = null,
  onClose,
  children,
  style,
  ...props
}) {
  const cfg = CONFIG[type] ?? CONFIG.success;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      maxWidth: 340,
      background: 'var(--overlay-bg)',
      color: 'var(--text-primary)',
      border: `1px solid ${cfg.color}`,
      borderRadius: 'var(--radius)',
      boxShadow: `0 0 0 1px ${cfg.color}, 0 0 18px ${cfg.glow}`,
      ...style
    }
  }, props), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: cfg.color,
      textShadow: `0 0 6px ${cfg.glow}`,
      display: 'inline-flex'
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      color: cfg.color,
      fontWeight: 600
    }
  }, cfg.tag), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      lineHeight: 1.3
    }
  }, children), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      display: 'inline-flex'
    }
  }, "\u2715"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/task/KanbanColumn.jsx
try { (() => {
/**
 * Kanban column shell — uppercase header with a `[NN]` count and a bordered
 * drop zone. Pass TaskCard children. `over` highlights the zone (drag-over);
 * empty state shows `// пусто`.
 */
function KanbanColumn({
  title,
  count,
  over = false,
  width = 280,
  fullWidth = false,
  children,
  style
}) {
  const childArr = React.Children.toArray(children);
  const n = count ?? childArr.length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flexShrink: fullWidth ? 1 : 0,
      width: fullWidth ? '100%' : width,
      height: '100%',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 8px',
      height: 28,
      background: 'var(--panel-bg)',
      borderTop: '1px solid var(--border)',
      borderLeft: '1px solid var(--border)',
      borderRight: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "neon-text",
    style: {
      fontSize: 10
    }
  }, "\u25B8"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-bright)',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      textShadow: over ? '0 0 8px var(--accent-glow)' : 'none'
    }
  }, title)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, "[", String(n).padStart(2, '0'), "]")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1,
      padding: 8,
      overflowY: 'auto',
      minHeight: 120,
      background: over ? 'var(--accent-dim)' : 'var(--well-bg)',
      border: '1px solid var(--border)',
      borderTopColor: 'var(--border-subtle)',
      boxShadow: over ? 'inset 0 0 20px var(--accent-glow)' : 'none',
      transition: 'box-shadow 160ms'
    }
  }, childArr.length > 0 ? children : /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-dim)'
    }
  }, over ? '> бросьте сюда' : '// пусто'))));
}
Object.assign(__ds_scope, { KanbanColumn });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/task/KanbanColumn.jsx", error: String((e && e.message) || e) }); }

// components/task/PriorityBadge.jsx
try { (() => {
const PRIO = {
  A: {
    color: 'var(--prio-a)',
    label: 'критично'
  },
  B: {
    color: 'var(--prio-b)',
    label: 'высокий'
  },
  C: {
    color: 'var(--prio-c)',
    label: 'обычный'
  },
  D: {
    color: 'var(--prio-d)',
    label: 'низкий'
  }
};

/** Priority pill — letter grade A–D with its semantic color. */
function PriorityBadge({
  priority = 'C',
  showLabel = true,
  style
}) {
  const cfg = PRIO[priority] ?? PRIO.C;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '1px 8px',
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      color: cfg.color,
      background: `${cfg.color}1A`,
      border: `1px solid ${cfg.color}55`,
      borderRadius: 'var(--radius-pill)',
      ...style
    }
  }, priority, showLabel && ` · ${cfg.label}`);
}

/** Left edge stripe used on task cards / rows to flag priority at a glance. */
function PriorityStripe({
  priority = 'C'
}) {
  const cfg = PRIO[priority] ?? PRIO.C;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      background: cfg.color,
      boxShadow: `0 0 6px ${cfg.color}, inset 0 0 2px rgba(255,255,255,0.5)`
    }
  });
}
Object.assign(__ds_scope, { PriorityBadge, PriorityStripe });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/task/PriorityBadge.jsx", error: String((e && e.message) || e) }); }

// components/task/TaskCard.jsx
try { (() => {
/**
 * Task card — the core board/list unit. Title row, category chip, comment
 * count, deadline (turns amber when urgent, red + glow when overdue) and a
 * created-relative footer. Hover lifts the neon border; `urgent` adds the
 * deadline pulse. Pass a lucide chevron via `advanceIcon` for the advance
 * button, or omit `onAdvance` to hide it.
 */
function TaskCard({
  title,
  category,
  deadline,
  deadlineState = 'none',
  comments = 0,
  createdLabel,
  urgent = false,
  onClick,
  onAdvance,
  advanceIcon = '›',
  style
}) {
  const dl = {
    none: 'var(--text-muted)',
    urgent: 'var(--warning)',
    overdue: 'var(--danger)'
  }[deadlineState] || 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    className: `row-hover${urgent ? ' deadline-pulse' : ''}`,
    onClick: onClick,
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = 'var(--accent)';
      e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), 0 0 14px var(--accent-glow)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.boxShadow = 'none';
    },
    style: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '8px 10px',
      cursor: 'default',
      transition: 'border-color 140ms ease-out, box-shadow 140ms ease-out',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 11,
      lineHeight: 1.35,
      color: 'var(--text-primary)',
      fontWeight: 500
    }
  }, title), onAdvance && /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onAdvance();
    },
    title: "\u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u044D\u0442\u0430\u043F",
    style: {
      flexShrink: 0,
      width: 22,
      height: 18,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--accent)',
      background: 'transparent',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      lineHeight: 1
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--accent-dim)';
      e.currentTarget.style.borderColor = 'var(--accent)';
      e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), 0 0 10px var(--accent-glow)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.boxShadow = 'none';
    }
  }, advanceIcon)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 0
    }
  }, category && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      padding: '0 5px',
      color: 'var(--accent)',
      border: '1px solid var(--border)',
      maxWidth: 120,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, category), comments > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--text-muted)'
    }
  }, "\u275D ", comments)), deadline && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      flexShrink: 0,
      color: dl,
      fontWeight: deadlineState === 'overdue' ? 600 : 400,
      textShadow: deadlineState === 'overdue' ? '0 0 6px rgba(255,0,60,0.6)' : 'none'
    }
  }, "\u23F1 ", deadline)), createdLabel && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      color: 'var(--text-dim)'
    }
  }, "\u0441\u043E\u0437\u0434\u0430\u043D\u043E ", createdLabel));
}
Object.assign(__ds_scope, { TaskCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/task/TaskCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kairo/data.js
try { (() => {
/* Kairo UI kit — fake data, nav, themes + helpers. Exposed on window. */

// Lucide icon helper: <Icon name="target" size={14} />. Builds the SVG
// directly in React from lucide's icon data (window.lucide.icons), so there's
// no out-of-band DOM mutation to conflict with React reconciliation.
function _toPascal(name) {
  return String(name).split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}
function Icon({
  name,
  size = 14,
  color,
  style
}) {
  const lib = window.lucide && window.lucide.icons || {};
  const node = lib[_toPascal(name)] || lib[name];
  const children = Array.isArray(node) ? node : [];
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color || 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: {
      display: 'inline-flex',
      flexShrink: 0,
      ...style
    }
  }, children.map((c, i) => React.createElement(c[0], {
    key: i,
    ...c[1]
  })));
}
const NAV = [{
  id: 'focus',
  to: 'focus',
  label: 'фокус',
  cmd: 'focus',
  icon: 'target'
}, {
  id: 'board',
  to: 'board',
  label: 'доска',
  cmd: 'board',
  icon: 'layout-dashboard'
}, {
  id: 'plan',
  to: 'plan',
  label: 'план',
  cmd: 'plan',
  icon: 'calendar-days'
}, {
  id: 'todo',
  to: 'todo',
  label: 'листок',
  cmd: 'todo',
  icon: 'notebook-pen'
}, {
  id: 'weeks',
  to: 'weeks',
  label: 'итоги',
  cmd: 'weeks',
  icon: 'bar-chart-3'
}, {
  id: 'spend',
  to: 'spend',
  label: 'траты',
  cmd: 'spend',
  icon: 'wallet'
}, {
  id: 'log',
  to: 'log',
  label: 'события',
  cmd: 'logs',
  icon: 'scroll-text'
}];
const THEMES = [{
  id: '',
  name: 'MATRIX',
  tagline: 'терминал · хакер · зелёный код',
  preview: ['#000000', '#00FF41', '#D6F5D6']
}, {
  id: 'command',
  name: 'COMMAND',
  tagline: 'тёмно-синий · бизнес · Linear',
  preview: ['#0B1220', '#4DA3FF', '#E6EDF7']
}, {
  id: 'obsidian',
  name: 'OBSIDIAN',
  tagline: 'графит · фиолетовый · премиум',
  preview: ['#0C0C10', '#A78BFA', '#E8E6F0']
}, {
  id: 'paper',
  name: 'PAPER',
  tagline: 'светлая · чистая · для дня',
  preview: ['#F6F6F3', '#2563EB', '#1A1A1A']
}, {
  id: 'nord',
  name: 'NORD',
  tagline: 'скандинавия · спокойный контраст',
  preview: ['#2E3440', '#88C0D0', '#ECEFF4']
}, {
  id: 'samurai',
  name: 'SAMURAI',
  tagline: 'чёрный · алый · золото · бусидо',
  preview: ['#0A0606', '#E5484D', '#E8B54A']
}, {
  id: 'claude',
  name: 'CLAUDE',
  tagline: 'тёплый крем · глина · сан-сериф',
  preview: ['#F5F4EE', '#D97757', '#3D3D3A'],
  soft: true
}, {
  id: 'clay',
  name: 'CLAUDE NOIR',
  tagline: 'тёмная тема Claude · графит',
  preview: ['#262624', '#D97757', '#ECEAE3'],
  soft: true
}];
const COLUMNS = [{
  id: 'todo',
  title: 'ОЧЕРЕДЬ'
}, {
  id: 'inprogress',
  title: 'АКТИВНЫЕ'
}, {
  id: 'blocked',
  title: 'БЛОК'
}, {
  id: 'done',
  title: 'ВЫПОЛНЕНО'
}];
let _id = 100;
const TASKS = [{
  id: 1,
  col: 'todo',
  title: 'починить экспорт CSV в отчётах',
  category: 'bug',
  prio: 'A',
  deadline: 'сегодня 18:00',
  deadlineState: 'urgent',
  comments: 2,
  created: '2ч назад'
}, {
  id: 2,
  col: 'todo',
  title: 'свёрстать страницу тарифов',
  category: 'web',
  prio: 'C',
  created: 'вчера',
  comments: 0
}, {
  id: 3,
  col: 'todo',
  title: 'ответить инвестору по питчу',
  category: 'дела',
  prio: 'B',
  deadline: 'завтра',
  comments: 1,
  created: '3ч назад'
}, {
  id: 4,
  col: 'inprogress',
  title: 'миграция supabase на v2',
  category: 'infra',
  prio: 'A',
  deadline: 'просрочено',
  deadlineState: 'overdue',
  urgent: true,
  comments: 5,
  created: '3д назад'
}, {
  id: 5,
  col: 'inprogress',
  title: 'ревью PR #214 — auth flow',
  category: 'review',
  prio: 'C',
  created: '40м назад',
  comments: 3
}, {
  id: 6,
  col: 'blocked',
  title: 'подписать договор с подрядчиком',
  category: 'дела',
  prio: 'B',
  deadline: 'ждём ответ',
  comments: 4,
  created: 'нед. назад'
}, {
  id: 7,
  col: 'done',
  title: 'настроить CI на vercel',
  category: 'infra',
  prio: 'C',
  created: 'вчера'
}, {
  id: 8,
  col: 'done',
  title: 'обновить иконку приложения',
  category: 'design',
  prio: 'D',
  created: '2д назад'
}];
const FOCUS = [{
  id: 'f1',
  title: 'миграция supabase на v2',
  prio: 'A',
  deadline: 'просрочено',
  deadlineState: 'overdue',
  done: false
}, {
  id: 'f2',
  title: 'починить экспорт CSV',
  prio: 'A',
  deadline: 'сегодня 18:00',
  deadlineState: 'urgent',
  done: false
}, {
  id: 'f3',
  title: 'ответить инвестору',
  prio: 'B',
  deadline: 'завтра',
  done: false
}];
const SHEET = [{
  id: 's1',
  title: 'купить кофе и фильтры',
  done: true
}, {
  id: 's2',
  title: 'созвон с командой в 14:00',
  done: true
}, {
  id: 's3',
  title: 'дочитать главу про индексы БД',
  done: false
}, {
  id: 's4',
  title: 'забрать посылку с почты',
  done: false
}, {
  id: 's5',
  title: 'выгулять задачи из inbox',
  done: false
}];
window.KAIRO = {
  Icon,
  NAV,
  THEMES,
  COLUMNS,
  TASKS,
  FOCUS,
  SHEET,
  nextId: () => ++_id
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kairo/data.js", error: String((e && e.message) || e) }); }

// ui_kits/kairo/screens.jsx
try { (() => {
/* Kairo UI kit — screens: board, focus, sheet + capture / theme modals. */
const DS = window.KairoDesignSystem_6fc2cc;
const {
  TaskCard,
  KanbanColumn,
  PriorityBadge,
  Modal,
  Input,
  Button
} = DS;
const K = window.KAIRO;
function BoardScreen({
  tasks,
  search,
  onAdvance
}) {
  const q = search.trim().toLowerCase();
  const visible = tasks.filter(t => !q || t.title.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowX: 'auto',
      overflowY: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      height: '100%',
      padding: 8,
      minWidth: 'max-content'
    }
  }, K.COLUMNS.map(col => {
    const colTasks = visible.filter(t => t.col === col.id);
    return /*#__PURE__*/React.createElement(KanbanColumn, {
      key: col.id,
      title: col.title,
      count: colTasks.length
    }, colTasks.map(t => /*#__PURE__*/React.createElement(TaskCard, {
      key: t.id,
      title: t.title,
      category: t.category,
      deadline: t.deadline,
      deadlineState: t.deadlineState,
      comments: t.comments,
      createdLabel: t.created,
      urgent: t.urgent,
      onAdvance: col.id !== 'done' ? () => onAdvance(t.id) : undefined,
      advanceIcon: /*#__PURE__*/React.createElement(K.Icon, {
        name: "chevron-right",
        size: 12
      })
    })));
  })));
}
function FocusScreen({
  items,
  onToggle
}) {
  const open = items.filter(i => !i.done);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 16,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(K.Icon, {
    name: "target",
    size: 16,
    color: "var(--accent)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-bright)'
    }
  }, "\u0444\u043E\u043A\u0443\u0441 \u043D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      fontSize: 10,
      color: 'var(--text-muted)'
    }
  }, open.length, " \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, items.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    className: "row-hover",
    onClick: () => onToggle(i.id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      cursor: 'pointer',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      opacity: i.done ? 0.45 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      flexShrink: 0,
      border: `1px solid ${i.done ? 'var(--accent)' : 'var(--border-strong)'}`,
      background: i.done ? 'var(--accent)' : 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#000'
    }
  }, i.done && /*#__PURE__*/React.createElement(K.Icon, {
    name: "check",
    size: 11,
    color: "#000"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12,
      color: 'var(--text-primary)',
      textDecoration: i.done ? 'line-through' : 'none'
    }
  }, i.title), /*#__PURE__*/React.createElement(PriorityBadge, {
    priority: i.prio,
    showLabel: false
  }), i.deadline && /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      fontSize: 10,
      color: i.deadlineState === 'overdue' ? 'var(--danger)' : i.deadlineState === 'urgent' ? 'var(--warning)' : 'var(--text-muted)'
    }
  }, i.deadline))))));
}
const LINE = 28;
function SheetScreen({
  items,
  onToggle,
  onAdd
}) {
  const [draft, setDraft] = React.useState('');
  const done = items.filter(i => i.done).length;
  const add = () => {
    const t = draft.trim();
    if (t) {
      onAdd(t);
      setDraft('');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      padding: '12px 8px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: 560,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-elevated)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 8,
      padding: '14px 16px 6px 56px',
      borderBottom: '2px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-hand",
    style: {
      fontSize: 17,
      fontWeight: 600,
      color: 'var(--text-bright)',
      lineHeight: 1.1
    }
  }, "\u043F\u044F\u0442\u043D\u0438\u0446\u0430, 18 \u0438\u044E\u043D\u044F"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      paddingBottom: 6
    }
  }, done, "/", items.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '8px 12px 8px 56px',
      minHeight: LINE * 6,
      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE - 1}px, var(--border-subtle) ${LINE - 1}px, var(--border-subtle) ${LINE}px)`,
      backgroundOrigin: 'content-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 44,
      top: 0,
      bottom: 0,
      width: 1,
      background: 'var(--border-danger)',
      opacity: 0.5,
      pointerEvents: 'none'
    }
  }), items.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    onClick: () => onToggle(i.id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: LINE,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      flexShrink: 0,
      color: i.done ? 'var(--accent)' : 'var(--text-dim)',
      fontSize: 13
    }
  }, i.done ? '✓' : '·'), /*#__PURE__*/React.createElement("span", {
    className: "font-hand",
    style: {
      fontSize: 13,
      color: i.done ? 'var(--text-dim)' : 'var(--text-primary)',
      textDecoration: i.done ? 'line-through' : 'none'
    }
  }, i.title))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: LINE
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      flexShrink: 0,
      color: 'var(--text-dim)',
      fontSize: 14
    }
  }, "+"), /*#__PURE__*/React.createElement("input", {
    className: "font-hand",
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') add();
    },
    placeholder: "\u0434\u043E\u043F\u0438\u0441\u0430\u0442\u044C\u2026",
    "data-selectable": true,
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontSize: 13,
      color: 'var(--text-primary)'
    }
  })))));
}
function Placeholder({
  icon,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--text-dim)'
    }
  }, /*#__PURE__*/React.createElement(K.Icon, {
    name: icon,
    size: 32,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      fontSize: 12
    }
  }, "// ", label, " \u2014 \u0440\u0430\u0437\u0434\u0435\u043B \u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435"));
}
function CaptureModal({
  open,
  onClose,
  onCreate
}) {
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState('');
  const [prio, setPrio] = React.useState('C');
  const submit = () => {
    if (title.trim()) {
      onCreate({
        title: title.trim(),
        category: cat.trim() || undefined,
        prio
      });
      setTitle('');
      setCat('');
      setPrio('C');
      onClose();
    }
  };
  return /*#__PURE__*/React.createElement(Modal, {
    open: open,
    onClose: onClose,
    title: "\u043D\u043E\u0432\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430",
    width: 440
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    placeholder: "\u0447\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0441\u0434\u0435\u043B\u0430\u0442\u044C\u2026",
    value: title,
    onChange: e => setTitle(e.target.value),
    autoFocus: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F",
    placeholder: "bug \xB7 web \xB7 \u0434\u0435\u043B\u0430\u2026",
    value: cat,
    onChange: e => setCat(e.target.value)
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, "\u203A"), " \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, ['A', 'B', 'C', 'D'].map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => setPrio(p),
    style: {
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      opacity: prio === p ? 1 : 0.4,
      transition: 'opacity 120ms'
    }
  }, /*#__PURE__*/React.createElement(PriorityBadge, {
    priority: p,
    showLabel: false
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onClose
  }, "\u043E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: /*#__PURE__*/React.createElement(K.Icon, {
      name: "plus",
      size: 12
    }),
    onClick: submit
  }, "\u0441\u043E\u0437\u0434\u0430\u0442\u044C"))));
}
function ThemePicker({
  open,
  onClose,
  theme,
  setTheme
}) {
  return /*#__PURE__*/React.createElement(Modal, {
    open: open,
    onClose: onClose,
    title: "\u0440\u0435\u0436\u0438\u043C \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u044F",
    width: 420
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: 12
    }
  }, K.THEMES.map(t => {
    const active = t.id === theme;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id || 'matrix',
      onClick: () => setTheme(t.id),
      className: "row-hover",
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 12px',
        minHeight: 52,
        textAlign: 'left',
        cursor: 'pointer',
        background: 'transparent',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
        boxShadow: active ? '0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        gap: 4,
        flexShrink: 0
      }
    }, t.preview.map((c, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        width: 14,
        height: 14,
        background: c,
        border: '1px solid rgba(128,128,128,0.4)'
      }
    }))), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        padding: '6px 0'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-mono",
      style: {
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 2,
        color: 'var(--text-primary)'
      }
    }, t.name), /*#__PURE__*/React.createElement("span", {
      className: "font-mono",
      style: {
        fontSize: 10,
        color: 'var(--text-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, t.tagline)), active && /*#__PURE__*/React.createElement(K.Icon, {
      name: "check",
      size: 15,
      color: "var(--accent)"
    }));
  })));
}
window.KairoScreens = {
  BoardScreen,
  FocusScreen,
  SheetScreen,
  Placeholder,
  CaptureModal,
  ThemePicker
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kairo/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/kairo/shell.jsx
try { (() => {
/* Kairo UI kit — app shell: matrix rain, titlebar, sidebar, header, status bar. */
const KD = window.KAIRO;
const KIcon = KD.Icon;
function MatrixRain() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {
      alpha: true
    });
    if (!ctx) return;
    const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789!@#$%^&*+=<>{}[]/\\|';
    const FONT = 14;
    let cols = 0,
      drops = [],
      speeds = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT + 'px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      cols = Math.floor(w / FONT);
      drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -50));
      speeds = new Array(cols).fill(0).map(() => 0.5 + Math.random() * 1.2);
    };
    resize();
    window.addEventListener('resize', resize);
    let raf = 0,
      last = 0;
    const STEP = 1000 / 24;
    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (now - last < STEP) return;
      last = now;
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) {
        const x = i * FONT,
          yHead = drops[i] * FONT;
        const g = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        ctx.fillStyle = '#0A9F2C';
        ctx.fillText(g, x, yHead);
        if (Math.random() > 0.975) {
          ctx.fillStyle = '#E8FFE8';
          ctx.shadowColor = '#00FF41';
          ctx.shadowBlur = 8;
          ctx.fillText(g, x, yHead);
          ctx.shadowBlur = 0;
        }
        drops[i] += speeds[i];
        if (yHead > h && Math.random() > 0.965) {
          drops[i] = Math.floor(Math.random() * -20);
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
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "matrix-canvas"
  });
}
function Clock() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return /*#__PURE__*/React.createElement(React.Fragment, null, now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));
}
function Sidebar({
  route,
  setRoute
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  return /*#__PURE__*/React.createElement("aside", {
    className: "bevel-raised",
    style: {
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100%',
      width: collapsed ? 44 : 180,
      background: 'var(--panel-bg)',
      padding: 6,
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCollapsed(c => !c),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 6px',
      height: 28,
      background: 'transparent',
      border: 'none',
      cursor: 'pointer'
    },
    title: collapsed ? 'развернуть' : 'свернуть'
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/kairo-mark.png",
    width: collapsed ? 20 : 18,
    height: collapsed ? 20 : 18,
    alt: "Kairo",
    style: {
      display: 'block',
      filter: 'drop-shadow(0 0 5px var(--accent-glow))',
      flexShrink: 0
    }
  }), !collapsed && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "neon-text",
    style: {
      flex: 1,
      textAlign: 'left',
      fontWeight: 700,
      letterSpacing: 2,
      fontSize: 13
    }
  }, "KAIRO"), /*#__PURE__*/React.createElement(KIcon, {
    name: "chevron-left",
    size: 12,
    color: "var(--text-muted)"
  }))), !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-subtle)',
      margin: '2px 0'
    }
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      flex: 1
    }
  }, KD.NAV.map(n => {
    const active = route === n.id;
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => setRoute(n.id),
      title: collapsed ? n.label : undefined,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 8px',
        height: 28,
        fontSize: 11,
        cursor: 'pointer',
        textAlign: 'left',
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: 'none',
        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        textShadow: active ? '0 0 6px var(--accent-glow)' : 'none',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement(KIcon, {
      name: n.icon,
      size: 13
    }), !collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-dim)'
      }
    }, "$ "), n.cmd));
  })), !collapsed && /*#__PURE__*/React.createElement("div", {
    className: "cursor-blink",
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-dim)',
      padding: '0 4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, "$")));
}
function Header({
  search,
  setSearch,
  onTheme,
  onCapture
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bevel-raised",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 8px',
      background: 'var(--panel-bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      padding: '0 8px',
      height: 28,
      background: 'var(--bg-input)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "neon-text",
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11
    }
  }, "\u043F\u043E\u0438\u0441\u043A\xA0\xBB"), /*#__PURE__*/React.createElement(KIcon, {
    name: "search",
    size: 11,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "\u043F\u043E\u0438\u0441\u043A \u0437\u0430\u0434\u0430\u0447...",
    "data-selectable": true,
    style: {
      flex: 1,
      height: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-primary)'
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "bevel-raised",
    onClick: onTheme,
    title: "\u0440\u0435\u0436\u0438\u043C \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u044F",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 28,
      padding: '0 10px',
      fontSize: 11,
      color: 'var(--text-secondary)',
      background: 'var(--bg-surface)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(KIcon, {
    name: "palette",
    size: 11
  }), " \u0442\u0435\u043C\u0430"), /*#__PURE__*/React.createElement("button", {
    className: "bevel-raised",
    onClick: onCapture,
    title: "\u043D\u043E\u0432\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430 (N)",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 28,
      padding: '0 10px',
      fontSize: 11,
      color: 'var(--text-secondary)',
      background: 'var(--bg-surface)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(KIcon, {
    name: "lock",
    size: 11
  }), " \u0431\u043B\u043E\u043A"));
}
function StatusBar({
  stats
}) {
  const pad = n => String(n).padStart(3, '0');
  const Sep = () => /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-dim)'
    }
  }, "\u2502");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 8px',
      fontSize: 11,
      background: 'var(--statusbar-bg)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "led led-blink"
  }), /*#__PURE__*/React.createElement("span", {
    className: "neon-text",
    style: {
      letterSpacing: 1
    }
  }, "\u0412 \u0421\u0415\u0422\u0418")), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "\u0432\u0441\u0435\u0433\u043E ", /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      color: 'var(--text-bright)'
    }
  }, pad(stats.total))), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "\u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 ", /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      color: 'var(--text-bright)'
    }
  }, pad(stats.open))), /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "\u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E ", /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      color: 'var(--text-bright)'
    }
  }, pad(stats.done))), stats.overdue > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Sep, null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "led led-red led-blink"
  }), /*#__PURE__*/React.createElement("span", {
    className: "neon-danger",
    style: {
      fontWeight: 700
    }
  }, "\u041F\u0420\u041E\u0421\u0420\u041E\u0427\u0415\u041D\u041E ", pad(stats.overdue)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-mono",
    style: {
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Clock, null)));
}
window.KairoShell = {
  MatrixRain,
  Sidebar,
  Header,
  StatusBar
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/kairo/shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.LoadingDots = __ds_scope.LoadingDots;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.KanbanColumn = __ds_scope.KanbanColumn;

__ds_ns.PriorityBadge = __ds_scope.PriorityBadge;

__ds_ns.PriorityStripe = __ds_scope.PriorityStripe;

__ds_ns.TaskCard = __ds_scope.TaskCard;

})();
