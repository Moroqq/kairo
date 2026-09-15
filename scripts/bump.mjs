#!/usr/bin/env node
/**
 * Поднять версию во всех манифестах проекта разом.
 *
 * Версия живёт в четырёх местах: package.json, package-lock.json,
 * src-tauri/tauri.conf.json и src-tauri/Cargo.toml (плюс запись пакета в
 * Cargo.lock). Правка руками означает шанс забыть одно из них — и тогда
 * собирается одно, а публикуется под номером другого. Релизный workflow
 * такой рассинхрон останавливает, но лучше его просто не создавать.
 *
 *   node scripts/bump.mjs 0.5.3     — конкретная версия
 *   node scripts/bump.mjs patch     — 0.5.2 → 0.5.3
 *   node scripts/bump.mjs minor     — 0.5.2 → 0.6.0
 *   node scripts/bump.mjs major     — 0.5.2 → 1.0.0
 */

import { readFileSync, writeFileSync } from 'node:fs';

const SEMVER = /^\d+\.\d+\.\d+$/;

function nextVersion(current, arg) {
  if (SEMVER.test(arg)) return arg;

  const [major, minor, patch] = current.split('.').map(Number);
  if (arg === 'major') return `${major + 1}.0.0`;
  if (arg === 'minor') return `${major}.${minor + 1}.0`;
  if (arg === 'patch') return `${major}.${minor}.${patch + 1}`;

  throw new Error(`не понял «${arg}». Ожидается версия вида 1.2.3 либо major/minor/patch`);
}

/** Замена в JSON через текст, а не через parse/stringify: так сохраняются форматирование и порядок ключей. */
function replaceJsonVersion(path, from, to, occurrences = 1) {
  const text = readFileSync(path, 'utf8');
  let left = occurrences;
  const updated = text.replace(new RegExp(`"version": "${from}"`, 'g'), (match) =>
    left-- > 0 ? `"version": "${to}"` : match,
  );
  if (updated === text) throw new Error(`не нашёл версию ${from} в ${path}`);
  writeFileSync(path, updated);
}

const arg = process.argv[2];
if (!arg) {
  console.error('Укажи версию или шаг: node scripts/bump.mjs 0.5.3 | patch | minor | major');
  process.exit(1);
}

const current = JSON.parse(readFileSync('package.json', 'utf8')).version;
const next = nextVersion(current, arg);

if (next === current) {
  console.error(`Версия уже ${current} — менять нечего.`);
  process.exit(1);
}

// package-lock.json содержит версию дважды: у корня и у пакета "".
replaceJsonVersion('package.json', current, next);
replaceJsonVersion('package-lock.json', current, next, 2);
replaceJsonVersion('src-tauri/tauri.conf.json', current, next);

const cargoToml = readFileSync('src-tauri/Cargo.toml', 'utf8');
writeFileSync(
  'src-tauri/Cargo.toml',
  cargoToml.replace(`version = "${current}"`, `version = "${next}"`),
);

// В Cargo.lock правим только запись самого приложения — не зависимостей.
const cargoLock = readFileSync('src-tauri/Cargo.lock', 'utf8');
writeFileSync(
  'src-tauri/Cargo.lock',
  cargoLock.replace(
    new RegExp(`(\\[\\[package\\]\\]\\nname = "kairo"\\nversion = ")${current}(")`),
    `$1${next}$2`,
  ),
);

console.log(`${current} → ${next}`);
console.log('');
console.log('Дальше:');
console.log(`  git commit -am "chore: версия ${next}"`);
console.log(`  git tag v${next}`);
console.log('  git push origin HEAD:main --tags');
console.log('');
console.log('Пуш тега запустит сборку и публикацию — руками собирать ничего не нужно.');
