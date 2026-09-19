/**
 * Generates the "deep universe" dark-theme background assets in public/backgrounds/:
 *
 *   stars-far.svg      420x420 tile  — dense field of tiny, dim stars
 *   stars-near.svg     740x740 tile  — fewer, brighter stars, a few with glow / diffraction spikes
 *   stars-twinkle.svg  560x560 tile  — medium stars on their own layer so CSS can fade them
 *
 * The tile sizes are deliberately not multiples of each other, so when the layers are
 * stacked their repeats never line up into a visible grid.
 *
 * Everything comes from a seeded PRNG (mulberry32) rather than Math.random, so re-running
 * the script reproduces byte-identical files — the SVGs stay reviewable in git and only
 * change when a constant here changes.
 *
 * Run from the repo root:  node scripts/generate-starfield.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'backgrounds');

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gaussian = (rand) => {
  const u = 1 - rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

// One decimal keeps the files small; leading zeros are dropped for the same reason.
const n = (v) => {
  const s = (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return s.replace(/^(-?)0\./, '$1.');
};
const op = (v) => (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, '').replace(/^0\./, '.');

const WHITE = '#fff';
const BLUE = '#cdd9ff';
const WARM = '#ffe6c7';
const LAVENDER = '#d9c9ff';

// Roughly the colour mix of a naked-eye sky: mostly white, a cool bias, the odd warm giant.
function starColour(rand) {
  const x = rand();
  if (x < 0.66) return WHITE;
  if (x < 0.85) return BLUE;
  if (x < 0.97) return WARM;
  return LAVENDER;
}

/**
 * Places stars with a small minimum spacing (distance measured across the wrap, so the
 * rule holds at the seams too). Pure uniform noise produces touching pairs that read as
 * blobs once the tile repeats hundreds of times.
 */
function scatter(rand, count, size, minGap, make) {
  const stars = [];
  let guard = 0;
  while (stars.length < count && guard++ < count * 200) {
    const p = { x: rand() * size, y: rand() * size };
    if (stars.every((s) => wrapDistance(s, p, size) >= minGap)) stars.push({ ...p, ...make(rand) });
  }
  return stars;
}

function wrapDistance(a, b, size) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.hypot(Math.min(dx, size - dx), Math.min(dy, size - dy));
}

/** Every copy of a point needed for the tile to repeat seamlessly given its visible reach. */
function wrapped(x, y, reach, size) {
  const xs = [0];
  const ys = [0];
  if (x - reach < 0) xs.push(size);
  if (x + reach > size) xs.push(-size);
  if (y - reach < 0) ys.push(size);
  if (y + reach > size) ys.push(-size);
  return xs.flatMap((dx) => ys.map((dy) => [x + dx, y + dy]));
}

const svgOpen = (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

// Grouping by colour means the fill is written once per group instead of once per star.
function circleGroups(stars, size) {
  const byColour = new Map();
  for (const s of stars) {
    const list = byColour.get(s.colour) ?? [];
    for (const [x, y] of wrapped(s.x, s.y, s.r, size)) {
      list.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(s.r)}" opacity="${op(s.o)}"/>`);
    }
    byColour.set(s.colour, list);
  }
  return [...byColour].map(([c, list]) => `<g fill="${c}">${list.join('')}</g>`).join('');
}

// Skewing toward the low end mimics the magnitude distribution: many faint, few bright.
const skewed = (rand, lo, hi, power = 2) => lo + (hi - lo) * Math.pow(rand(), power);

function starsFar() {
  const size = 420;
  const rand = mulberry32(0x5eed01);
  const stars = scatter(rand, 200, size, 7, (r) => {
    const radius = skewed(r, 0.4, 0.9, 1.8);
    return {
      r: radius,
      o: 0.35 + ((radius - 0.4) / 0.5) * 0.3 + r() * 0.15,
      colour: starColour(r),
    };
  });
  return `${svgOpen(size, size)}${circleGroups(stars, size)}</svg>`;
}

function starsTwinkle() {
  const size = 560;
  const rand = mulberry32(0x5eed03);
  const stars = scatter(rand, 45, size, 26, (r) => {
    const radius = skewed(r, 0.7, 1.3, 1.4);
    return { r: radius, o: 0.6 + r() * 0.35, colour: starColour(r) };
  });
  return `${svgOpen(size, size)}${circleGroups(stars, size)}</svg>`;
}

function starsNear() {
  const size = 740;
  const rand = mulberry32(0x5eed02);
  const stars = scatter(rand, 60, size, 40, (r) => {
    const radius = skewed(r, 0.8, 1.6, 1.6);
    return { r: radius, o: 0.7 + r() * 0.3, colour: starColour(r) };
  });

  // The brightest stars earn the effects, so glow and spikes always sit on a large core.
  // Spiked stars are the most recognisable marks in the layer, so there are only three,
  // spread as far apart as the tile allows and graded in strength: three equal sparkles
  // form a triangle the eye picks out repeating every 740px; one bright and two weaker
  // ones read as an ordinary sky. Each also gets its own spike rotation — axis-aligned
  // crosses at identical angles read as a stamp repeated across the viewport, whereas
  // tilted ones read as stars. Lengths are kept short for the same reason: a 740px tile
  // repeats ~2.6 times across a desktop viewport, and a long bright cross makes that row
  // legible.
  const byBrightness = [...stars].sort((a, b) => b.r - a.r);
  const SPIKE_STRENGTH = [1, 0.7, 0.5];
  const spiked = [];
  for (const s of byBrightness) {
    if (spiked.length < SPIKE_STRENGTH.length && spiked.every((e) => wrapDistance(e, s, size) >= 330)) spiked.push(s);
  }
  const effects = [...spiked];
  for (const s of byBrightness) {
    if (effects.length < 8 && effects.every((e) => wrapDistance(e, s, size) >= 190)) effects.push(s);
  }
  effects.forEach((s, i) => {
    s.glow = 2.5 + s.r * 2 + rand();
    if (i < spiked.length) {
      const k = SPIKE_STRENGTH[i];
      s.spike = (7 + s.r * 3 + rand() * 1.5) * (0.5 + 0.5 * k);
      s.spikeAlpha = k;
      s.spikeAngle = rand() * Math.PI * 0.5;
      s.r = Math.max(s.r, 1.1 + 0.3 * k);
      s.o = 0.8 + 0.2 * k;
    }
  });

  const glowId = { [WHITE]: 'gw', [BLUE]: 'gb', [WARM]: 'gy', [LAVENDER]: 'gl' };
  const used = new Set();
  const glows = [];
  const spikes = [];
  const cores = new Map();

  for (const s of stars) {
    const reach = Math.max(s.r, s.glow ?? 0, s.spike ?? 0);
    for (const [x, y] of wrapped(s.x, s.y, reach, size)) {
      if (s.glow) {
        used.add(s.colour);
        glows.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(s.glow)}" fill="url(#${glowId[s.colour]})"/>`);
      }
      if (s.spike) {
        // Two thin diamonds rather than stroked lines: a filled shape has a real bounding
        // box, so the radial gradient can fade the tips (a zero-height line would not paint).
        // The pair keeps 4-fold symmetry under rotation, so the bounding box stays square
        // and the gradient stays centred on the core whatever the angle.
        const L = s.spike;
        const w = s.spikeAlpha < 1 ? 0.45 : 0.55;
        const alpha = s.spikeAlpha < 1 ? ` fill-opacity="${op(s.spikeAlpha)}"` : '';
        const cos = Math.cos(s.spikeAngle);
        const sin = Math.sin(s.spikeAngle);
        const at = (u, v) => `${n(x + u * cos - v * sin)} ${n(y + u * sin + v * cos)}`;
        spikes.push(
          `<path d="M${at(-L, 0)}L${at(0, -w)}L${at(L, 0)}L${at(0, w)}Z` +
            `M${at(0, -L)}L${at(w, 0)}L${at(0, L)}L${at(-w, 0)}Z"${alpha}/>`,
        );
      }
      const list = cores.get(s.colour) ?? [];
      list.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(s.r)}" opacity="${op(s.o)}"/>`);
      cores.set(s.colour, list);
    }
  }

  const defs =
    [...used]
      .map(
        (c) =>
          `<radialGradient id="${glowId[c]}"><stop offset="0" stop-color="${c}" stop-opacity=".5"/>` +
          `<stop offset=".25" stop-color="${c}" stop-opacity=".13"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`,
      )
      .join('') +
    `<radialGradient id="sp"><stop offset="0" stop-color="#fff" stop-opacity=".7"/>` +
    `<stop offset=".3" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

  const coreGroups = [...cores].map(([c, list]) => `<g fill="${c}">${list.join('')}</g>`).join('');
  return (
    `${svgOpen(size, size)}<defs>${defs}</defs>${glows.join('')}` +
    `<g fill="url(#sp)">${spikes.join('')}</g>${coreGroups}</svg>`
  );
}

mkdirSync(OUT_DIR, { recursive: true });

const outputs = [
  ['stars-far.svg', starsFar(), 20_000],
  ['stars-near.svg', starsNear(), 20_000],
  ['stars-twinkle.svg', starsTwinkle(), 20_000],
];

for (const [name, svg, budget] of outputs) {
  const bytes = Buffer.byteLength(svg);
  if (bytes > budget) throw new Error(`${name} is ${bytes} bytes, over its ${budget} byte budget`);
  writeFileSync(join(OUT_DIR, name), svg);
  console.log(`${name.padEnd(18)} ${String(bytes).padStart(6)} bytes`);
}
