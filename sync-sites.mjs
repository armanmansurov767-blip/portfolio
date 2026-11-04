// Копирует три сайта-работы в portfolio/sites, чтобы портфолио открывалось одной папкой.
// Запуск из папки portfolio:  node sync-sites.mjs
import { cpSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const halden = resolve(here, '..', 'Haiden');
const listva = resolve(here, '..', 'Listva');
const vela = resolve(here, '..', 'Vela 14');
const out = join(here, 'sites');

const htmlIn = (dir) => readdirSync(dir).filter((f) => f.endsWith('.html'));

const sites = {
  listva: { from: listva, items: [...htmlIn(listva), 'assets'] },
  halden: { from: halden, items: [...htmlIn(halden), 'assets'] },
  vela: { from: vela, items: ['index.html', 'styles.css', 'js'] },
};

for (const [name, { from, items }] of Object.entries(sites)) {
  const to = join(out, name);
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  for (const item of items) cpSync(join(from, item), join(to, item), { recursive: true });
  console.log(`${name}: ${items.length} → sites/${name}`);
}
