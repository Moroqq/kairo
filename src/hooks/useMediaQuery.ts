import { useEffect, useState } from 'react';

/** Подписка на media-query. SSR-безопасно (стартует с false). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Узкий экран (мобильный). Брейкпоинт согласован с Tailwind `md` (768px). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
