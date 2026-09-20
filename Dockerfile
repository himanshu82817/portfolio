# syntax=docker/dockerfile:1

# Container for Cloud Run — the dev environment at dev.himanshusehlangia.dev.
# Production still ships the same build output to the VM; see
# .github/workflows/deploy.yml. Self-contained on purpose: `docker build .` is
# all a machine needs, so a deploy never depends on what the runner had built.

# --- build -------------------------------------------------------------------
# The same Node line as .nvmrc, so CI, the VM build and this image agree.
FROM node:20.19-alpine AS build
WORKDIR /app

# Dependencies first: this layer is reused until package-lock.json changes.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Which npm script builds the site. The default is the production build, which
# ends by running scripts/check-dist.mjs and so refuses to produce an image that
# contains an unpublished case study. The dev environment passes build:staging
# instead — the one deliberate exception; see deploy-dev.yml.
ARG BUILD_SCRIPT=build
RUN npm run "$BUILD_SCRIPT"

# --- serve -------------------------------------------------------------------
# The unprivileged image runs nginx as a non-root user and listens on 8080,
# which is also Cloud Run's default container port. It follows nginx's stable
# line rather than pinning a minor: a pinned minor stops being rebuilt once the
# next stable ships, and this is the internet-facing half of the image, rebuilt
# on every deploy precisely so that it picks up security fixes.
FROM nginxinc/nginx-unprivileged:stable-alpine AS serve

COPY deploy/cloudrun/headers.conf /etc/nginx/snippets/headers.conf
COPY deploy/cloudrun/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/portfolio/browser /usr/share/nginx/html

EXPOSE 8080
