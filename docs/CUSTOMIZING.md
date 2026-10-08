# Customizing the site

Edit any file on github.com with the pencil icon, then **Commit changes**.

| To change | Edit |
| --- | --- |
| Brand colours, spacing, motion, dark theme | `assets/premium.css` (tokens at the top) and `:root` in `assets/style.css` |
| Page text | The matching page, for example `about.html` |
| Navigation and footer | Repeated in every `.html` file; change each one |
| Photos | Replace a `<div class="photo-frame">…</div>` with `<img src="assets/img/photo.webp" alt="Describe the photo" width="800" height="600">` and upload the image to `assets/img/` |
| Logo and icons | Upload replacements to `assets/img/` with the same file names |
| Fonts | The Google Fonts `<link>` in each page's `<head>`, and `--font-display` in `premium.css` |
| Page titles and descriptions | `<title>` and `<meta name="description">` at the top of each page |
