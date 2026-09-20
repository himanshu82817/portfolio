/**
 * Fails when a build contains anything from an unpublished case study.
 *
 * Drafts are kept out of production at build time: data/drafts.ts is empty, and only
 * the development configuration swaps in data/drafts.development.ts (see
 * `fileReplacements` in angular.json). This script is the proof that the mechanism
 * still works. It reads the real case-study data, takes every study that is not
 * `published`, and looks through the build output for:
 *
 *   - its name and slug, in any letter case
 *   - its cover and gallery files
 *   - its text, every string of it — `openQuestions` included
 *
 * It is driven by the data files themselves rather than by the barrels, so a draft
 * listed in data/published.ts by mistake is caught here too.
 *
 * `npm run build` runs this as its postbuild step, so CI, the production deploy and
 * a default build of the Docker image all refuse a build that would put a draft on a
 * public server. A development build is supposed to contain drafts and will always
 * fail this check — which is the point: a development build must never be deployed.
 * So will `npm run build:staging`, the one build that ships drafts on purpose (to the
 * noindex dev site, for review); it deliberately has no postbuild step.
 *
 * Findings are reported as "<data file> → <field>", never by quoting the text. The
 * repository's CI logs are public; the check must not publish what it is guarding.
 *
 * Run from the repo root:  node scripts/check-dist.mjs [dist directory]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'src', 'app', 'features', 'portfolio', 'case-studies', 'data');
const DIST_DIR = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, 'dist', 'portfolio', 'browser');

// These list case studies rather than define one, and import the files that do.
const BARRELS = new Set(['drafts.ts', 'drafts.development.ts', 'published.ts']);

// Shorter strings than this are technology names and labels ("NestJS 11", "REST"),
// which a published page may legitimately share with a draft. Prose is far longer.
const MIN_TEXT = 32;
// Open questions are internal notes, so they are held to a much lower bar.
const MIN_OPEN_QUESTION = 12;

// A minifier is free to re-quote and re-escape a string, so text is compared in
// runs of characters that come out of any JavaScript, HTML or JSON printer unchanged.
const ESCAPABLE = /[^\x20-\x7e]|['"`\\$<>&]/;

function fail(message) {
  console.error(`check-dist: ${message}`);
  process.exit(1);
}

/** Every case study defined in data/, read by evaluating the file — so concatenated strings are whole. */
async function loadStudies() {
  if (!existsSync(DATA_DIR)) fail(`${relative(ROOT, DATA_DIR)} does not exist. Update DATA_DIR in this script.`);

  const studies = [];
  for (const file of readdirSync(DATA_DIR).filter(name => name.endsWith('.ts') && !BARRELS.has(name))) {
    const { outputText } = ts.transpileModule(readFileSync(join(DATA_DIR, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });

    let exports;
    try {
      exports = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
    } catch (error) {
      // A data file that imports a value can't be evaluated on its own. Stop rather
      // than skip it: an unread draft is an unchecked draft.
      fail(`could not evaluate data/${file} (${error.message}). This check cannot vouch for the build.`);
    }

    for (const value of Object.values(exports)) {
      if (value && typeof value === 'object' && typeof value.slug === 'string' && 'published' in value) {
        studies.push({ file, study: value });
      }
    }
  }

  // Zero studies means the data moved, not that there is nothing to leak.
  if (!studies.length) fail(`found no case studies in ${relative(ROOT, DATA_DIR)}. This check cannot vouch for the build.`);
  return studies;
}

/** Every string in a value, with the path that leads to it: ["openQuestions[0]", "Does the…"]. */
function* strings(value, path = '') {
  if (typeof value === 'string') yield [path, value];
  else if (Array.isArray(value)) for (const [i, item] of value.entries()) yield* strings(item, `${path}[${i}]`);
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) yield* strings(item, path ? `${path}.${key}` : key);
  }
}

/** What must not appear in the build for one unpublished study. */
function needlesFor(study) {
  const identifiers = [['name', study.name.toLowerCase()], ['slug', study.slug.toLowerCase()]];

  const text = [];
  for (const [path, value] of strings(study)) {
    const min = path.startsWith('openQuestions') ? MIN_OPEN_QUESTION : MIN_TEXT;
    for (const fragment of value.split(ESCAPABLE)) {
      if (fragment.trim().length >= min) text.push([path, fragment.trim()]);
    }
  }

  const assets = [study.cover?.src, ...(study.gallery ?? []).map(image => image.src)].filter(Boolean);
  return { identifiers, text, assets };
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

if (!existsSync(DIST_DIR)) fail(`${relative(ROOT, DIST_DIR)} does not exist. Run the build first.`);

const drafts = (await loadStudies()).filter(({ study }) => study.published !== true);
const files = [...walk(DIST_DIR)].map(path => {
  const content = readFileSync(path, 'utf8');
  return { name: relative(DIST_DIR, path).replaceAll('\\', '/'), content, lower: content.toLowerCase() };
});

// "<built file> ← data/<file>" → the fields of that study found in that file.
const findings = new Map();
const found = (built, file, field) => {
  const key = `${built} ← data/${file}`;
  findings.set(key, (findings.get(key) ?? new Set()).add(field));
};
let checked = 0;

for (const { file, study } of drafts) {
  const { identifiers, text, assets } = needlesFor(study);
  checked += identifiers.length + text.length + assets.length;

  for (const asset of assets) {
    if (existsSync(join(DIST_DIR, asset))) found(asset.replace(/^\//, ''), file, 'the file itself');
  }
  for (const built of files) {
    for (const [field, needle] of identifiers) {
      if (built.name.toLowerCase().includes(needle) || built.lower.includes(needle)) found(built.name, file, field);
    }
    for (const [field, needle] of text) {
      if (built.content.includes(needle)) found(built.name, file, field);
    }
  }
}

if (findings.size) {
  const lines = [...findings].sort().map(([key, fields]) => {
    const list = [...fields];
    const notes = list.filter(field => field.startsWith('openQuestions'));
    const named = list.filter(field => !field.includes('.') && !field.includes('['));
    const rest = list.length - notes.length - named.length;
    const parts = [...named];
    if (notes.length) parts.push(`${notes.length} of its openQuestions`);
    if (rest) parts.push(`${rest} other text fields`);
    return `  ${key}: ${parts.join(', ')}`;
  });
  fail(
    `${relative(ROOT, DIST_DIR)} contains unpublished case-study content — do not deploy it.\n` +
      `${lines.join('\n')}\n` +
      'A production build must not include any study with `published: false`. Drafts belong in\n' +
      'data/drafts.development.ts and their assets in public-drafts/. If this is a development\n' +
      'build, this is expected: development builds are for `ng serve`, never for a server.'
  );
}

console.log(
  `check-dist: OK — ${files.length} files in ${relative(ROOT, DIST_DIR)}, ` +
    `${drafts.length} unpublished case ${drafts.length === 1 ? 'study' : 'studies'}, ` +
    `${checked} strings and assets checked, none present.`
);
