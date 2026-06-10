import { Target, LayoutDashboard, CalendarDays, ScrollText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavEntry {
  to: string;
  label: string;
  cmd: string;
  icon: LucideIcon;
}

/** Единый источник навигации — используется сайдбаром (desktop) и BottomNav (mobile). */
export const NAV: NavEntry[] = [
  { to: '/',         label: 'фокус',   cmd: 'focus', icon: Target           },
  { to: '/board',    label: 'доска',   cmd: 'board', icon: LayoutDashboard  },
  { to: '/calendar', label: 'план',    cmd: 'plan',  icon: CalendarDays     },
  { to: '/log',      label: 'события', cmd: 'logs',  icon: ScrollText       },
];
