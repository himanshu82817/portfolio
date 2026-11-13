# Portfolio — Himanshu Sehlangia

Personal portfolio of **Himanshu Sehlangia**, backend engineer based in New Delhi.
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
| `npm run build` | Production build into `dist/portfolio/browser`, then `check:dist` |
| `npm run check:dist` | Fails if the build output contains an unpublished case study |
| `npm run build:staging` | The production build plus the draft case studies — what the dev site runs |
| `npm run watch` | Development build, rebuilding on change — contains drafts, never deploy it |
| `npm test` | Unit tests, watch mode |
| `npm run test:ci` | Unit tests once, headless — what CI runs |

Node is pinned in `.nvmrc` (20.19.0). Run `nvm use` before installing.

## Before you deploy — two things to set

The production origin, `https://himanshusehlangia.dev`, is written in four places:
`siteUrl` in [`src/app/core/site.config.ts`](src/app/core/site.config.ts),
`src/index.html` (canonical + `og:*` + JSON-LD), `public/robots.txt` and
`public/sitemap.xml` — change all four together. Canonical URLs *inside* the running
app are derived from `window.location.origin`, so only the static tags carry it.

1. **Your résumé.** `public/resume.pdf` is what the Résumé button downloads; replace the
   file to update it. If `resumeUrl` in `site.config.ts` is set to `null`, the button is
   not rendered at all — deliberately, so there is never a button that 404s.

2. **The contact form.** Get a free access key from [web3forms.com](https://web3forms.com)
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

## Environments

| | Production | Dev |
|---|---|---|
| URL | https://himanshusehlangia.dev | https://dev.himanshusehlangia.dev |
| Runs on | nginx on a Compute Engine VM | a container on Cloud Run (scales to zero) |
| Deploys from | pushes to `master` — `.github/workflows/deploy.yml` | pushes to `dev` — `.github/workflows/deploy-dev.yml` |
| Access to GCP | an SSH key in the `GCP_SSH_KEY` secret | keyless: Workload Identity Federation, nothing stored |
| Search engines | indexed | `X-Robots-Tag: noindex` on every response |
| Draft case studies | never compiled in (`check-dist` enforces it) | compiled in for review (`build:staging`) |

To try something on the dev site, push it to the `dev` branch (or run the *Deploy dev*
workflow by hand against any branch). Each deploy is an image tagged with its commit
SHA, so rolling back is redeploying an older tag.

Both environments serve the same production build. The container is described by the
`Dockerfile` and `deploy/cloudrun/nginx.conf`; the VM by `deploy/nginx.conf`. The two
nginx files carry the same rules — change them together.

Everything that exists in Google Cloud for the dev environment — the service, the image
registry and its clean-up policy, the two service accounts and what each may do, the
GitHub trust, the domain mapping and its DNS record — is recorded, with the reasons, in
`deploy/cloudrun/setup-gcp.sh`. It checks before it creates, so it is safe to re-run.

## Architecture

```
src/app/
  core/
    site.config.ts            Single source of truth: name, contact, links, career start
    services/theme.service.ts Owns the `dark` class on <html>
    services/seo.service.ts   Per-route title, description, canonical, OG tags
  shared/backdrop/            Theme backdrop: the dark-mode WebGL black hole, as a still frame
  shared/components/          Navbar, footer
  features/portfolio/         One component per route, plus the case studies
  features/writing/           Blog posts as typed data, with a draft flag per post
public/backgrounds/           Paper, doodle and star tiles behind every page
public-drafts/                Assets of unpublished case studies — development builds only
deploy/                       nginx config for the VM; cloudrun/ holds the dev container's
scripts/generate-starfield.mjs  Regenerates the star tiles, deterministically
scripts/check-dist.mjs          Fails a build that contains an unpublished case study or post
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

**Backdrop.** Light mode is the sketchbook the portrait is drawn on, and dark mode is the
sky those doodles are of. Both are deliberately quiet, because the page is for reading:
nothing in the backdrop moves and nothing in it reacts to the pointer. The static layers
are plain CSS on `<body>` (`.site-backdrop` in `src/styles.css`), so they paint before
Angular boots — a trace of paper grain with doodles only in the left and right margins
(none below the `md` breakpoint), or one sparse layer of stars. `shared/backdrop/` adds
the one thing that needs script: in dark mode a framework-free WebGL black hole
(`black-hole.ts`), drawn as a single still frame behind a veil in the page colour. It
calibrates its resolution against the GPU once the page has settled, and falls back to
the CSS star field wherever WebGL is unavailable or software-rendered.

**Routing.** Every route is lazy-loaded via `loadComponent`. Route `data.seo` drives
the document title and meta description. A `**` route renders a real 404 page.

**Case studies and drafts.** Each case study is one file in
`features/portfolio/case-studies/data/`. An unpublished one is kept out of production
**at build time**, not hidden at runtime — the site is public, so anything in the
bundle is published whether or not a route leads to it.

- `data/published.ts` lists the studies every build compiles. `data/drafts.ts` is an
  empty list. `data/drafts.development.ts` lists the drafts, and `angular.json` swaps it
  in for `drafts.ts` (`fileReplacements`) in the **development** and **staging**
  configurations and the **test** target only. A production build never reads a
  draft's file, so none of its text — `openQuestions` included — exists in the output.
  A new build configuration gets no drafts unless it opts in.
- Draft images live in `public-drafts/`, which only those same configurations copy.
  `public/` ships everywhere.
- **Staging** is how drafts are reviewed on the dev site. It holds only what differs
  from production and is layered on it — `ng build --configuration production,staging`
  (`npm run build:staging`) — so it is the same optimised, map-free build with the
  drafts compiled in. Drafts are listed with a "Draft" badge and banner; the "Still
  needed from you" panel stays development-only, though its text is in the bundle.
  The dev site sends `noindex` but is **public**: anyone with the URL can read a draft
  there. `deploy-dev.yml` selects it with `--build-arg BUILD_SCRIPT=build:staging`; the
  image's default is the checked production build.
- `npm start` is unchanged: drafts are listed, routable, and show the draft banner and
  the "Still needed from you" panel.
- To publish a study: set `published: true` and empty its `openQuestions`; move it from
  `drafts.development.ts` to `published.ts`; move its folder from `public-drafts/` to
  `public/`. A unit test fails if the flag and the barrel disagree.
- `scripts/check-dist.mjs` runs after every `npm run build` and fails it if the output
  contains a draft's name, slug, assets or text. It reports which fields it found, not
  the text itself, because CI logs are public.

Never deploy a development build, and never point a deployed environment at the
development configuration to preview a draft: that publishes the drafts, their notes
panel and the source maps. Preview drafts with `npm start`, or on the dev site.

## Writing

Posts live in `src/app/features/writing/`. Each post is two files: `posts/<slug>.meta.ts`
(title, description, date, tags, `published`) and `posts/<slug>.ts`, exporting
`BODY: Block[]` (headings, paragraphs, lists, code and tables). Inline text supports `code`, **bold**, *emphasis* and
links.

Drafts are kept out of production the same way case studies are, at build time:
`published.ts` lists the posts every build compiles, `drafts.ts` is empty, and
`angular.json` swaps in `drafts.development.ts` for the development and staging
configurations and the test target. Draft posts therefore show on `npm start` and on
the dev site, with a draft banner, and are absent from a production bundle.
`scripts/check-dist.mjs` fails a production build that contains one.

While no post is published, a production build has no Writing link in the navbar and
`/writing` renders the 404 page. To publish a post: set `published: true` in its
`posts/<slug>.meta.ts`, move its entry from `drafts.development.ts` to `published.ts`,
and add its URL to `public/sitemap.xml`. A unit test fails if the flag and the barrel
disagree.

## Testing

Unit tests run in headless Chrome via Karma + Jasmine. They cover the theme service's
persistence and OS-preference behaviour, contact form validation and the honeypot, the
navbar's accessibility contract (accessible names, `aria-current`, decorative icons
hidden), that the backdrop stays still and ignores the pointer, and the derived
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
