/* Kairo UI kit — fake data, nav, themes + helpers. Exposed on window. */

// Lucide icon helper: <Icon name="target" size={14} />. Builds the SVG
// directly in React from lucide's icon data (window.lucide.icons), so there's
// no out-of-band DOM mutation to conflict with React reconciliation.
function _toPascal(name) {
  return String(name).split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}
function Icon({ name, size = 14, color, style }) {
  const lib = (window.lucide && window.lucide.icons) || {};
  const node = lib[_toPascal(name)] || lib[name];
  const children = Array.isArray(node) ? node : [];
  return React.createElement(
    'svg',
    {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: color || 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      style: { display: 'inline-flex', flexShrink: 0, ...style },
    },
    children.map((c, i) => React.createElement(c[0], { key: i, ...c[1] }))
  );
}

const NAV = [
  { id: 'focus', to: 'focus', label: 'фокус',  cmd: 'focus', icon: 'target' },
  { id: 'board', to: 'board', label: 'доска',  cmd: 'board', icon: 'layout-dashboard' },
  { id: 'plan',  to: 'plan',  label: 'план',   cmd: 'plan',  icon: 'calendar-days' },
  { id: 'todo',  to: 'todo',  label: 'листок', cmd: 'todo',  icon: 'notebook-pen' },
  { id: 'weeks', to: 'weeks', label: 'итоги',  cmd: 'weeks', icon: 'bar-chart-3' },
  { id: 'spend', to: 'spend', label: 'траты',  cmd: 'spend', icon: 'wallet' },
  { id: 'log',   to: 'log',   label: 'события',cmd: 'logs',  icon: 'scroll-text' },
];

const THEMES = [
  { id: '',         name: 'MATRIX',      tagline: 'терминал · хакер · зелёный код',  preview: ['#000000', '#00FF41', '#D6F5D6'] },
  { id: 'command',  name: 'COMMAND',     tagline: 'тёмно-синий · бизнес · Linear',   preview: ['#0B1220', '#4DA3FF', '#E6EDF7'] },
  { id: 'obsidian', name: 'OBSIDIAN',    tagline: 'графит · фиолетовый · премиум',   preview: ['#0C0C10', '#A78BFA', '#E8E6F0'] },
  { id: 'paper',    name: 'PAPER',       tagline: 'светлая · чистая · для дня',       preview: ['#F6F6F3', '#2563EB', '#1A1A1A'] },
  { id: 'nord',     name: 'NORD',        tagline: 'скандинавия · спокойный контраст',preview: ['#2E3440', '#88C0D0', '#ECEFF4'] },
  { id: 'samurai',  name: 'SAMURAI',     tagline: 'чёрный · алый · золото · бусидо',  preview: ['#0A0606', '#E5484D', '#E8B54A'] },
  { id: 'claude',   name: 'CLAUDE',      tagline: 'тёплый крем · глина · сан-сериф',  preview: ['#F5F4EE', '#D97757', '#3D3D3A'], soft: true },
  { id: 'clay',     name: 'CLAUDE NOIR', tagline: 'тёмная тема Claude · графит',      preview: ['#262624', '#D97757', '#ECEAE3'], soft: true },
];

const COLUMNS = [
  { id: 'todo',       title: 'ОЧЕРЕДЬ' },
  { id: 'inprogress', title: 'АКТИВНЫЕ' },
  { id: 'blocked',    title: 'БЛОК' },
  { id: 'done',       title: 'ВЫПОЛНЕНО' },
];

let _id = 100;
const TASKS = [
  { id: 1,  col: 'todo',       title: 'починить экспорт CSV в отчётах', category: 'bug',     prio: 'A', deadline: 'сегодня 18:00', deadlineState: 'urgent',  comments: 2, created: '2ч назад' },
  { id: 2,  col: 'todo',       title: 'свёрстать страницу тарифов',      category: 'web',     prio: 'C', created: 'вчера', comments: 0 },
  { id: 3,  col: 'todo',       title: 'ответить инвестору по питчу',     category: 'дела',    prio: 'B', deadline: 'завтра', comments: 1, created: '3ч назад' },
  { id: 4,  col: 'inprogress', title: 'миграция supabase на v2',         category: 'infra',   prio: 'A', deadline: 'просрочено', deadlineState: 'overdue', urgent: true, comments: 5, created: '3д назад' },
  { id: 5,  col: 'inprogress', title: 'ревью PR #214 — auth flow',       category: 'review',  prio: 'C', created: '40м назад', comments: 3 },
  { id: 6,  col: 'blocked',    title: 'подписать договор с подрядчиком',  category: 'дела',    prio: 'B', deadline: 'ждём ответ', comments: 4, created: 'нед. назад' },
  { id: 7,  col: 'done',       title: 'настроить CI на vercel',          category: 'infra',   prio: 'C', created: 'вчера' },
  { id: 8,  col: 'done',       title: 'обновить иконку приложения',      category: 'design',  prio: 'D', created: '2д назад' },
];

const FOCUS = [
  { id: 'f1', title: 'миграция supabase на v2', prio: 'A', deadline: 'просрочено', deadlineState: 'overdue', done: false },
  { id: 'f2', title: 'починить экспорт CSV',      prio: 'A', deadline: 'сегодня 18:00', deadlineState: 'urgent', done: false },
  { id: 'f3', title: 'ответить инвестору',        prio: 'B', deadline: 'завтра', done: false },
];

const SHEET = [
  { id: 's1', title: 'купить кофе и фильтры',          done: true },
  { id: 's2', title: 'созвон с командой в 14:00',      done: true },
  { id: 's3', title: 'дочитать главу про индексы БД',  done: false },
  { id: 's4', title: 'забрать посылку с почты',        done: false },
  { id: 's5', title: 'выгулять задачи из inbox',       done: false },
];

window.KAIRO = { Icon, NAV, THEMES, COLUMNS, TASKS, FOCUS, SHEET, nextId: () => ++_id };
