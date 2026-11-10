/*
 * KBI Schools site builder. Zero dependencies apart from the two font packages.
 * Reads src/, writes dist/. Runs inside GitHub Actions; nobody needs to run it locally.
 *
 * Environment (set automatically by the deploy workflow):
 *   SITE_ORIGIN  e.g. https://kbischool.github.io          (default shown)
 *   BASE_PATH    "" for a user site or custom domain, "/repo-name" for a project site
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const out = join(root, 'dist');

const origin = (process.env.SITE_ORIGIN || 'https://kbischool.github.io').replace(/\/+$/, '');
let base = (process.env.BASE_PATH || '').trim();
base = '/' + base.replace(/^\/+|\/+$/g, '');
base = base === '/' ? '/' : base + '/';
const homeUrl = origin + base;

const fail = (msg) => { console.error('\nBUILD FAILED: ' + msg + '\n'); process.exit(1); };
const read = (p) => readFileSync(p, 'utf8');
const write = (p, data) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, data); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

/* ---- Fonts (self-hosted from the Fontsource packages) ------------------- */
const fontFiles = [
  ['@fontsource-variable/sora', 'sora-latin-wght-normal.woff2'],
  ['@fontsource-variable/inter', 'inter-latin-wght-normal.woff2']
];
for (const [pkg, file] of fontFiles) {
  const from = join(root, 'node_modules', pkg, 'files', file);
  if (!existsSync(from)) fail(`Font file missing: ${pkg}/files/${file}. The workflow step "Install dependencies" must run before the build.`);
  mkdirSync(join(out, 'assets/fonts'), { recursive: true });
  cpSync(from, join(out, 'assets/fonts', file));
}
const fontCss = `@font-face{font-family:"Sora Variable";font-style:normal;font-display:swap;font-weight:100 800;src:url(../fonts/sora-latin-wght-normal.woff2) format("woff2-variations"),url(../fonts/sora-latin-wght-normal.woff2) format("woff2")}
@font-face{font-family:"Inter Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url(../fonts/inter-latin-wght-normal.woff2) format("woff2-variations"),url(../fonts/inter-latin-wght-normal.woff2) format("woff2")}
`;

/* ---- CSS: tokens + components, lightly minified ------------------------- */
const css = (fontCss + read(join(src, 'assets/css/tokens.css')) + read(join(src, 'assets/css/main.css')))
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
write(join(out, 'assets/css/site.css'), css);

/* ---- JS and images ------------------------------------------------------ */
cpSync(join(src, 'assets/js'), join(out, 'assets/js'), { recursive: true });
cpSync(join(src, 'assets/img'), join(out, 'assets/img'), { recursive: true });
if (existsSync(join(src, 'public'))) cpSync(join(src, 'public'), out, { recursive: true });

/* ---- Content hash used for cache busting and the service worker version - */
const hash = createHash('sha1');
const hashTree = (dir) => {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) hashTree(p); else { hash.update(relative(src, p)); hash.update(readFileSync(p)); }
  }
};
hashTree(src);
hash.update(base + origin);
const version = hash.digest('hex').slice(0, 10);

/* ---- Pages --------------------------------------------------------------- */
const layout = read(join(src, 'layout.html'));
const pagesDir = join(src, 'pages');
const pages = readdirSync(pagesDir).filter((f) => f.endsWith('.html')).map((f) => {
  const raw = read(join(pagesDir, f));
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) fail(`${f}: missing front matter block`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { file: f.replace(/\.html$/, ''), meta, body: m[2].trim() };
});
if (!pages.length) fail('No pages found in src/pages');

const sameAs = [
  'https://www.facebook.com/kbischoolsibadan/',
  'https://x.com/kbi_schools',
  'https://www.instagram.com/kbi_schools/',
  'https://www.linkedin.com/company/knowledge-base-international-schools/'
];
const schoolLd = {
  '@context': 'https://schema.org',
  '@type': 'School',
  name: 'Knowledge Base International Schools',
  alternateName: 'KBI Schools',
  url: homeUrl,
  logo: origin + base + 'assets/img/logo.png',
  image: origin + base + 'assets/img/og-image.png',
  foundingDate: '2012',
  slogan: 'Knowledge in Humility',
  email: 'knowledgebaseschools@gmail.com',
  telephone: '+2348126909498',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '15 Okikiolu Haven, Opposite IDC Primary School, Apapa Area',
    addressLocality: 'Moniya, Ibadan',
    addressRegion: 'Oyo State',
    addressCountry: 'NG'
  },
  sameAs
};
const ldTag = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

const tokens = (s, extra = {}) => s
  .replace(/\{\{base\}\}/g, base)
  .replace(/\{\{site\}\}/g, origin)
  .replace(/\{\{year\}\}/g, String(new Date().getFullYear()))
  .replace(/\{\{v\}\}/g, version)
  .replace(/\{\{(\w+)\}\}/g, (all, k) => (k in extra ? extra[k] : all));

const sitemapEntries = [];
for (const p of pages) {
  const { meta } = p;
  const isHome = p.file === 'index';
  const url = isHome ? homeUrl : `${homeUrl}${p.file}.html`;
  const noindex = meta.noindex === 'true';
  let content = tokens(p.body);

  if (meta.hero === 'page') {
    const crumb = `<ol class="breadcrumb" aria-label="Breadcrumb"><li><a href="${base}">Home</a></li><li aria-current="page">${meta.crumb || meta.h1}</li></ol>`;
    const sub = meta.subnav
      ? `<nav class="subnav" aria-label="On this page">${meta.subnav.split(';').map((s) => { const [id, label] = s.split('|').map((x) => x.trim()); return `<a href="#${id}">${label}</a>`; }).join('')}</nav>`
      : '';
    content = `<section class="page-hero"><div class="container">${crumb}<h1>${meta.h1}</h1><p class="lede">${meta.lede}</p>${sub}</div></section>\n` + content;
  }

  const lds = [];
  if (isHome || p.file === 'contact') lds.push(ldTag(schoolLd));
  if (!isHome && meta.hero === 'page') {
    lds.push(ldTag({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: (meta.crumb || meta.h1).replace(/&amp;/g, '&'), item: url }
      ]
    }));
  }

  const current = (k) => (meta.nav === k ? ' aria-current="page"' : '');
  let html = layout
    .replace(/\{\{current:(\w+)\}\}/g, (a, k) => current(k))
    .replace(/\{\{group:(\w+)\}\}/g, (a, k) => (meta.nav === k ? ' is-current' : ''));
  html = tokens(html, {
    title: esc(meta.title), description: esc(meta.description), canonical: url,
    robots: noindex ? '<meta name="robots" content="noindex">' : '',
    jsonld: lds.join('\n'), content
  });
  html = html.replace(/\{\{content\}\}/g, () => content); // content may itself contain tokens already resolved
  write(join(out, `${p.file}.html`), html);
  if (!noindex && p.file !== '404') sitemapEntries.push(url);
}

/* ---- sitemap, robots ------------------------------------------------------ */
const today = new Date().toISOString().slice(0, 10);
write(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map((u) => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}${base}sitemap.xml\n`);

/* ---- Web app manifest ------------------------------------------------------ */
const shots = [];
for (const [file, sizes, form] of [['screenshot-wide.png', '1280x720', 'wide'], ['screenshot-narrow.png', '720x1280', 'narrow']]) {
  if (existsSync(join(src, 'assets/img', file))) shots.push({ src: `${base}assets/img/${file}`, sizes, type: 'image/png', form_factor: form, label: 'KBI Schools home page' });
}
const manifest = {
  id: base,
  name: 'Knowledge Base International Schools',
  short_name: 'KBI Schools',
  description: 'Crèche to Senior Secondary education in Moniya, Ibadan, with STEM, Coding and Robotics. Admissions, news, results and contacts.',
  start_url: base,
  scope: base,
  display: 'standalone',
  orientation: 'any',
  background_color: '#f6fbfd',
  theme_color: '#f6fbfd',
  lang: 'en-NG',
  dir: 'ltr',
  categories: ['education'],
  icons: [
    { src: `${base}assets/img/favicon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${base}assets/img/favicon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: `${base}assets/img/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ],
  shortcuts: [
    { name: 'Apply for admission', short_name: 'Apply', url: `${base}admission.html#apply`, icons: [{ src: `${base}assets/img/favicon-192.png`, sizes: '192x192', type: 'image/png' }] },
    { name: 'News and events', short_name: 'News', url: `${base}news.html`, icons: [{ src: `${base}assets/img/favicon-192.png`, sizes: '192x192', type: 'image/png' }] },
    { name: 'Portals and ICT', short_name: 'Portals', url: `${base}ict.html#portals`, icons: [{ src: `${base}assets/img/favicon-192.png`, sizes: '192x192', type: 'image/png' }] },
    { name: 'Contact the school', short_name: 'Contact', url: `${base}contact.html`, icons: [{ src: `${base}assets/img/favicon-192.png`, sizes: '192x192', type: 'image/png' }] }
  ]
};
if (shots.length) manifest.screenshots = shots;
write(join(out, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

/* ---- Service worker ---------------------------------------------------------- */
const precache = new Set([base]);
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const rel = relative(out, p).split('\\').join('/');
    if (rel === 'sw.js' || rel === 'robots.txt' || rel === 'sitemap.xml' || rel === '404.html' || /screenshot-/.test(rel) || /og-image|logo-square|logo\.png|favicon-(16|48|180|192|512)|maskable/.test(rel)) continue;
    precache.add(base + rel + (/^assets\/(css|js)\//.test(rel) ? `?v=${version}` : ''));
  }
};
walk(out);
write(join(out, 'sw.js'), read(join(src, 'sw.template.js'))
  .replace('__VERSION__', version).replace('__BASE__', base)
  .replace('__PRECACHE__', JSON.stringify([...precache].sort(), null, 2)));

console.log(`Built ${pages.length} pages, ${precache.size} precached files. base=${base} origin=${origin} version=${version}`);
