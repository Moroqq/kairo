/**
 * Разбор манифеста апдейтера.
 *
 * Вынесено из UpdateBanner отдельным модулем, потому что здесь вся логика,
 * которая решает, обновимся мы или покажем ошибку, — и её хочется проверять
 * тестами, а не запуском приложения на четырёх платформах.
 */

export interface ManifestPlatform {
  url?: string;
  /** Подпись minisign. Пустая строка = релиз не подписан. */
  signature?: string;
}

export interface UpdateManifest {
  version?: string;
  notes?: string;
  pub_date?: string;
  platforms?: Record<string, ManifestPlatform | undefined>;
}

export interface PlatformEntry {
  key: string;
  url: string;
  signature: string;
}

/** Сравнение семверов X.Y.Z. Возвращает true если a > b. */
export function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0, y = pb[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/**
 * Ключи платформы в порядке предпочтения.
 *
 * Десктопный список начинается с `windows-x86_64` — под этим ключом мы
 * публикуем обычный установщик, который человек может просто запустить.
 * Варианты с суффиксами (`-nsis`, `-msi`) ищет сам плагин апдейтера, и они
 * указывают на архивы, пригодные только ему; для ручного пути они хуже,
 * поэтому стоят ниже.
 */
export function platformKeys(android: boolean): string[] {
  return android
    ? ['android-aarch64', 'android-arm64', 'android-arm64-v8a', 'android-armv7', 'android-arm', 'android']
    : [
        'windows-x86_64', 'windows-x86_64-nsis', 'windows-x86_64-msi',
        'darwin-aarch64', 'darwin-x86_64', 'darwin-universal',
        'linux-x86_64', 'linux-x86_64-appimage',
      ];
}

/**
 * Достаёт запись под текущую платформу.
 *
 * Берём только ключи своей платформы и честно возвращаем null, если их нет.
 * Когда-то последним вариантом стоял `Object.values(p).find(...)`, и на
 * десктопе можно было получить ссылку на APK и «обновиться» в никуда.
 */
export function pickPlatformEntry(
  platforms: Record<string, ManifestPlatform | undefined>,
  android: boolean,
): PlatformEntry | null {
  for (const key of platformKeys(android)) {
    const url = platforms[key]?.url;
    if (url) return { key, url, signature: platforms[key]?.signature ?? '' };
  }
  return null;
}

/**
 * Каким путём ставить обновление.
 *
 * `plugin` — установка внутри приложения с проверкой подписи и перезапуском.
 * Красивее, но работает только на десктопе и только если релиз подписан:
 * без валидной подписи плагин скачает файл и откажется его ставить.
 *
 * `browser` — открыть ссылку системным браузером, дальше человек запускает
 * установщик сам. Так уже работает Android, и это единственный путь, когда
 * приватного ключа для подписи нет.
 *
 * Раньше плагин дёргался всегда и первым. На десктопе без записи в манифесте
 * он падал с «None of the fallback platforms were found», и эта ошибка
 * показывалась пользователю впереди настоящей причины.
 */
export function chooseDelivery(entry: PlatformEntry, android: boolean): 'plugin' | 'browser' {
  if (android) return 'browser';
  return entry.signature.trim().length > 0 ? 'plugin' : 'browser';
}

/** Текст для случая «манифест есть, а сборки под нас в нём нет». */
export function describeMissingPlatform(
  manifest: UpdateManifest,
  android: boolean,
): string {
  const have = Object.keys(manifest.platforms ?? {});
  const listed = have.length > 0 ? have.join(', ') : 'ни одной';
  return `в манифесте ${manifest.version ?? '?'} нет сборки под эту платформу (${android ? 'android' : 'desktop'}). Опубликованы: ${listed}`;
}
