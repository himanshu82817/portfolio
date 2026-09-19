# Portfolio — Himanshu Sehlangia

Personal portfolio of **Himanshu Sehlangia**, Full Stack Engineer based in New Delhi.
Built with Angular 19 (standalone, zone-based) and Tailwind CSS 3, deployed to a GCP
VM by GitHub Actions on every push to `master`.

## Quick start

```bash
npm ci
npm start
```

The dev server runs at `http://localhost:4200/` and reloads on change.

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with HMR |
| `npm run build` | Production build into `dist/portfolio/browser` |
| `npm run watch` | Development build, rebuilding on change |
| `npm test` | Unit tests, watch mode |
| `npm run test:ci` | Unit tests once, headless — what CI runs |

Node is pinned in `.nvmrc` (20.19.0). Run `nvm use` before installing.

## Before you deploy — three things to set

Search the repo for `PLACEHOLDER_DOMAIN` to find every spot that needs the real value.

1. **Your domain.** Set `siteUrl` in [`src/app/core/site.config.ts`](src/app/core/site.config.ts),
   then update the same origin in `src/index.html` (canonical + `og:*` + JSON-LD),
   `public/robots.txt` and `public/sitemap.xml`. Canonical URLs *inside* the running
   app are derived from `window.location.origin`, so only the static tags need this.

2. **Your résumé.** Drop `resume.pdf` into `public/` and set `resumeUrl: '/resume.pdf'`
   in `site.config.ts`. Until that value is set, the download button is not rendered
   at all — deliberately, so there is never a button that 404s.

3. **The contact form.** Get a free access key from [web3forms.com](https://web3forms.com)
   and set `contactFormKey` in `site.config.ts`. The key is a public submission
   token, safe to commit. **Until it is set the form falls back to opening the
   visitor's mail client with the message pre-filled** — so it always does something
   real, it just does less.

## Server configuration (important)

This is a client-side routed SPA. Without a fallback rule, a visitor who refreshes
`/projects` or follows a shared deep link gets a 404 from nginx before Angular ever
loads. [`deploy/nginx.conf`](deploy/nginx.conf) has the `try_files` rule plus caching
and gzip:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/portfolio
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t && sudo systemctl reload nginx
```

The deploy also writes a `404.html` copy of `index.html`, which covers static hosts
that use that convention instead.

> **Known gap:** the deploy copies files into `/var/www/html` but never removes them,
> so hashed bundles from old releases accumulate. There is a commented-out cleanup
> step in `.github/workflows/deploy.yml` — enable it once you have confirmed the
> docroot path, since it deletes the directory contents.

## Architecture

```
src/app/
  core/
    site.config.ts            Single source of truth: name, contact, links, career start
    services/theme.service.ts Owns the `dark` class on <html>
    services/seo.service.ts   Per-route title, description, canonical, OG tags
  shared/backdrop/            Interactive theme backdrop (ink reveal, WebGL black hole)
  shared/components/          Navbar, footer
  features/portfolio/         One component per route
public/backgrounds/           Paper, doodle and star tiles behind every page
scripts/generate-starfield.mjs  Regenerates the star tiles, deterministically
```

**Theming.** Brand colours live once, as RGB channel triples on `:root` in
`src/styles.css`, redefined under `html.dark`. `tailwind.config.js` consumes them via
`rgb(var(--token) / <alpha-value>)`, so `bg-primary/20` still works *and* a token like
`bg-surface-elevated` is automatically theme-aware with no `dark:` variant at the call
site. TypeScript reads the same variables at runtime. Change a colour in one place.

**No theme flash.** A small blocking script in `index.html` applies the stored (or
system) theme before the first paint. `ThemeService` uses identical resolution logic —
**if you change one, change the other.**

**Theme has three states, not two.** An explicit light/dark choice is persisted;
`system` is the default and is deliberately *not* persisted, so a visitor who never
touched the toggle keeps following their OS.

**Backdrop.** Light mode is the sketchbook the portrait is drawn on — crumpled paper
and faint ink doodles — and dark mode is the sky those doodles are of. The static
layers are plain CSS on `<body>` (`.site-backdrop` in `src/styles.css`), so they paint
before Angular boots. `shared/backdrop/` adds what needs script: in light mode the
doodles darken under the pointer and a click leaves an ink splash; in dark mode a
framework-free WebGL black hole (`black-hole.ts`) lenses a procedural star field, with
pointer parallax and a gravitational ripple on click. It is one full-screen fragment
shader that calibrates its resolution against the GPU once the page has settled, draws a
single still frame under `prefers-reduced-motion`, and falls back to the CSS star field
wherever WebGL is unavailable or software-rendered.

**Routing.** Every route is lazy-loaded via `loadComponent`. Route `data.seo` drives
the document title and meta description. A `**` route renders a real 404 page.

## Testing

Unit tests run in headless Chrome via Karma + Jasmine. They cover the theme service's
persistence and OS-preference behaviour, contact form validation and the honeypot, the
navbar's accessibility contract (accessible names, `aria-current`, decorative icons
hidden), the backdrop's click splash and pointer reveal, and the derived
years-of-experience calculation.

```bash
npm run test:ci
```

CI (`.github/workflows/ci.yml`) runs tests and a production build on every pull request
and on `master`. Deployment is a separate workflow gated on the same checks.

## Known follow-ups

- **Social preview image.** `og:image` points at `profile.webp`, which is portrait.
  A dedicated 1200×630 card would render better on LinkedIn and X.
- **Prerendering.** The site is client-rendered, so crawlers that don't execute JS see
  only the `<noscript>` block. Enabling Angular's static prerendering (`outputMode:
  "static"`) would give each route real HTML.
- **Hero image weight.** `profile.webp` is ~320 KB at 1696×2528 for a box that renders
  around 358 px wide. Re-encoding at 720w/1080w with a `srcset` would cut most of it.
- **Root font size.** `html { font-size: 80% }` in `styles.css` means every Tailwind
  rem value renders at 0.8× its documented size. It is intentional and scales with the
  visitor's own browser setting, but it is worth revisiting deliberately rather than
  inheriting.
- **Education section.** Not currently on the site; worth adding to About.

## License

No license granted. The code is public for reference; the design, copy and personal
content are not for reuse.
