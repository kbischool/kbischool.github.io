# Customizing the site

Edit files on github.com with the pencil icon, then **Commit changes**. The site rebuilds automatically.

| To change | Edit |
| --- | --- |
| Brand colours (both light and dark) | `src/assets/css/tokens.css`, the colour lines at the top |
| Spacing, type sizes, radius, shadows | `src/assets/css/tokens.css` |
| Page text | The matching file in `src/pages/` |
| Navigation and footer (every page at once) | `src/layout.html` |
| Page titles and descriptions | The block between the `---` lines at the top of each page file |
| Phone, email, address | Search for the number in `src/layout.html` and `src/pages/contact.html`, plus the school details in `scripts/build.mjs` |
| Fonts | Fonts are installed from the `@fontsource-variable` packages listed in `package.json`; see `scripts/build.mjs` |
| Logo and icons | Upload replacements into `src/assets/img/` with the same file names |

## Replace a placeholder icon with a real photo (Facilities)

1. Upload your photo (under 200 KB; use a `.webp` or `.jpg`) to `src/assets/img/`.
2. In `src/pages/facilities.html`, find the card and replace its `<div class="tile-art" ...>...</div>` line with:

```html
<img class="tile-photo" src="{{base}}assets/img/your-photo.webp" width="800" height="450" alt="Describe the photo" loading="lazy">
```


## Install icons

`favicon-192.png`, `favicon-512.png` and `maskable-512.png` in `src/assets/img/` are the install icons. The maskable one keeps the crest inside the safe centre so Android can crop it into a circle or square. Keep the same names and sizes when replacing them.

## Add a news item

Copy one `<article class="card news-card reveal">...</article>` block in `src/pages/news.html`, then change the date, heading and text.
