/*
 * Post-build checks on dist/. Fails (exit 1) only for problems that would ship a broken site:
 * missing files, broken internal links or anchors, invalid manifest, bad service worker precache list.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const problems = [];
const warn = [];
const bad = (m) => problems.push(m);
const base = JSON.parse(readFileSync(join(dist, 'site.webmanifest'), 'utf8')).scope;
const stripBase = (p) => (p.startsWith(base) ? p.slice(base.length) : null);
const htmlFiles = readdirSync(dist).filter((f) => f.endsWith('.html'));

const idsByFile = {};
for (const f of htmlFiles) {
  const html = readFileSync(join(dist, f), 'utf8');
  idsByFile[f] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

for (const f of htmlFiles) {
  const html = readFileSync(join(dist, f), 'utf8');
  if (/\{\{[^}]+\}\}/.test(html)) bad(`${f}: unresolved template token ${html.match(/\{\{[^}]+\}\}/)[0]}`);
  if (!/<title>[^<]{5,}<\/title>/.test(html)) bad(`${f}: missing title`);
  if (!/<meta name="description" content="[^"]{40,}/.test(html)) warn.push(`${f}: short or missing meta description`);
  if ((html.match(/<h1[ >]/g) || []).length !== 1) bad(`${f}: expected exactly one h1`);
  if (/\sstyle="/.test(html)) bad(`${f}: inline style attribute (blocked by the Content Security Policy)`);
  if (/\son[a-z]+="/.test(html)) bad(`${f}: inline event handler`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(m[0])) bad(`${f}: image without alt: ${m[0].slice(0, 80)}`);
    if (!/\swidth=/.test(m[0]) || !/\sheight=/.test(m[0])) bad(`${f}: image without width/height: ${m[0].slice(0, 80)}`);
  }
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) bad(`${f}: target=_blank without noopener`);
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#)/.test(u)) continue;
    const [pathPart, hash] = u.split('#');
    const [pathNoQuery] = pathPart.split('?');
    const rel = stripBase(pathNoQuery);
    if (rel === null) { bad(`${f}: link outside base path: ${u}`); continue; }
    const target = rel === '' ? 'index.html' : rel;
    if (!existsSync(join(dist, target))) { bad(`${f}: broken link or asset ${u}`); continue; }
    if (hash && target.endsWith('.html') && !idsByFile[target].has(hash)) bad(`${f}: anchor #${hash} not found in ${target}`);
  }
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!idsByFile[f].has(m[1])) bad(`${f}: in-page anchor #${m[1]} not found`);
}
for (const m of readFileSync(join(dist, 'assets/css/site.css'), 'utf8').matchAll(/url\(([^)]+)\)/g)) {
  const u = m[1].replace(/['"]/g, '');
  if (u.startsWith('data:') || u.startsWith('http')) continue;
  if (!existsSync(join(dist, 'assets/css', u))) bad(`site.css: missing ${u}`);
}

/* manifest */
const mf = JSON.parse(readFileSync(join(dist, 'site.webmanifest'), 'utf8'));
for (const k of ['name', 'short_name', 'id', 'start_url', 'scope', 'display', 'icons', 'theme_color', 'background_color']) if (!mf[k]) bad(`manifest: missing ${k}`);
if (!mf.start_url.startsWith(mf.scope)) bad('manifest: start_url is outside scope');
const iconSizes = new Set();
for (const i of mf.icons || []) {
  const rel = stripBase(i.src);
  if (rel === null || !existsSync(join(dist, rel))) bad(`manifest: icon missing ${i.src}`);
  iconSizes.add(i.sizes + ':' + i.purpose);
}
if (!iconSizes.has('192x192:any') || !iconSizes.has('512x512:any') || !iconSizes.has('512x512:maskable')) bad('manifest: needs 192, 512 and maskable 512 icons');
for (const s of mf.shortcuts || []) if (!existsSync(join(dist, stripBase(s.url.split('#')[0]) || 'index.html'))) bad(`manifest: shortcut target missing ${s.url}`);

/* service worker */
const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
const list = JSON.parse(sw.match(/const URLS = (\[[\s\S]*?\]);/)[1]);
for (const u of list) {
  const rel = stripBase(u.split('?')[0]); 
  if (rel === null) { bad(`sw: precache outside base: ${u}`); continue; }
  if (rel !== '' && !existsSync(join(dist, rel))) bad(`sw: precache file missing ${u}`);
}
if (!list.includes(base + 'offline.html')) bad('sw: offline.html is not precached');
if (!existsSync(join(dist, '404.html'))) bad('404.html missing');

for (const w of warn) console.warn('warning: ' + w);
if (problems.length) { console.error('\nCHECK FAILED:\n- ' + problems.join('\n- ') + '\n'); process.exit(1); }
console.log(`Checks passed: ${htmlFiles.length} pages, manifest, service worker precache of ${list.length} files.`);
