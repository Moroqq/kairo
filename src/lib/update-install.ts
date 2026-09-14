import { invoke } from '@tauri-apps/api/core';
import { appCacheDir, join } from '@tauri-apps/api/path';
import { BaseDirectory, open as openFile } from '@tauri-apps/plugin-fs';

/**
 * Скачивание обновления внутрь приложения и запуск установщика.
 *
 * Раньше оба шага отдавались браузеру: приложение открывало ссылку, а дальше
 * человек смотрел на системный диалог загрузки и сам искал файл. Прогресса в
 * приложении не было в принципе, и после ухода в браузер оно не знало о
 * происходящем ничего.
 *
 * Теперь качаем сами. Установку на Android делает наш Kotlin-мостик (команда
 * `install_update` в src-tauri/src/lib.rs): системному установщику нужна
 * content://-ссылка через FileProvider, и ни апдейтер, ни opener этого не
 * умеют. На десктопе та же команда просто открывает файл системой.
 *
 * Всё это — путь «лучше, когда получается». Любой сбой здесь не должен
 * лишать человека обновления, поэтому вызывающая сторона откатывается на
 * старое поведение через браузер.
 */

/** Имя файла в кэше. Расширение берём из ссылки — по нему Android и Windows понимают, что запускать. */
export function fileNameFor(url: string, version: string): string {
  const path = (() => {
    try { return new URL(url).pathname; } catch { return url; }
  })();
  const ext = path.match(/\.(apk|exe|msi|dmg|deb|AppImage)$/i)?.[0] ?? '.bin';
  return `kairo-update-${version}${ext}`;
}

export interface DownloadProgress {
  done: number;
  /** null, если сервер не прислал content-length. */
  total: number | null;
}

/**
 * Качает файл в кэш приложения, отдавая прогресс по ходу.
 * Пишем потоком: сборка весит под двести мегабайт, и держать её целиком
 * в памяти вебвью на телефоне — верный способ получить падение.
 */
export async function downloadUpdate(
  url: string,
  version: string,
  onProgress: (p: DownloadProgress) => void,
): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`загрузка вернула HTTP ${res.status}`);
  if (!res.body) throw new Error('ответ без тела — нечего скачивать');

  const lengthHeader = res.headers.get('content-length');
  const total = lengthHeader ? Number(lengthHeader) || null : null;

  const name = fileNameFor(url, version);
  const file = await openFile(name, {
    write: true,
    create: true,
    truncate: true,
    baseDir: BaseDirectory.AppCache,
  });

  try {
    const reader = res.body.getReader();
    let done = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (chunk.value && chunk.value.byteLength > 0) {
        await file.write(chunk.value);
        done += chunk.value.byteLength;
        onProgress({ done, total });
      }
    }
    if (done === 0) throw new Error('скачалось ноль байт');
  } finally {
    await file.close();
  }

  return join(await appCacheDir(), name);
}

/** Отдаёт скачанный файл системе: установщику пакетов на Android, обработчику по умолчанию на десктопе. */
export async function installDownloaded(path: string): Promise<void> {
  await invoke('install_update', { path });
}
