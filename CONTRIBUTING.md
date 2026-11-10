# Contributing

Content changes (text, dates, staff names) are edited in `src/pages/*.html`. Open a pull request; the **Pull request check** workflow builds the site, validates links, anchors, the manifest and the service worker, and uploads the built site as a downloadable artifact.

## Local development (developers only)

Site owners never need this; GitHub Actions builds everything.

```
npm ci
npm test            # builds into dist/ and runs the checks
npx serve dist      # or any static server, then open http://localhost:3000
```

To test as a project site under a subpath: `BASE_PATH=/repo-name npm test`.

## Rules of the codebase

- No inline `style=` attributes or inline scripts (the Content Security Policy blocks them). Use classes in `main.css`.
- Colours come from `tokens.css`. Check contrast for both themes if you add a pair.
- Every image needs `alt`, `width` and `height`.
- Use `{{base}}` in front of internal links so the site works under any base path.
