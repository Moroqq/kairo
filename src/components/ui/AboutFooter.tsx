/**
 * Подпись команды разработки.
 *
 * Живёт внизу экрана SYNC, под строкой версии: это единственное место в
 * приложении, куда заходят «посмотреть про программу», и логично, чтобы
 * версия и авторство лежали рядом.
 *
 * Цвет намеренно берётся из темы, а не задан жёстко. Логотип белый, и в
 * светлой SNOW он бы просто исчез; поэтому знак рисуется `currentColor`
 * и наследует цвет текста той темы, которая сейчас включена.
 */

const TEAM = 'ObserV';

/** Год в знаке охраны — текущий, чтобы подпись не устаревала сама по себе. */
const YEAR = new Date().getFullYear();

interface Props {
  version: string;
}

export function AboutFooter({ version }: Props) {
  return (
    <div
      className="font-mono"
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
        color: 'var(--text-muted)',
        fontSize: 10,
        letterSpacing: 1,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-secondary)', letterSpacing: 1.5 }}>{TEAM}</span>
      </div>

      <div style={{ fontSize: 10 }}>
        © {YEAR} {TEAM} · все права защищены
      </div>

      <div style={{ color: 'var(--text-dim)' }}>kairo v{version}</div>
    </div>
  );
}
