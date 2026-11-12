import { Block } from '../post.model';

export const BODY: Block[] = [
  {
    kind: 'paragraph',
    text: 'LifeBoard is a journal. People write things in it they would not say out loud, so "the database is encrypted at rest by the cloud provider" was never going to be a good enough answer. Disk encryption protects against someone stealing a disk. It does nothing about a leaked backup, a stolen connection string, or a curious person with read access to the cluster. In all three cases the attacker reads plain text.',
  },
  {
    kind: 'paragraph',
    text: 'I wanted a stronger property: **a copy of the database, on its own, is unreadable.** This post is about how the backend gets there, and about the part that took more thought than the cryptography: turning it on for data that already existed, with no downtime and with a way back at every step.',
  },
  { kind: 'heading', level: 2, text: 'The shape: two layers of keys' },
  {
    kind: 'paragraph',
    text: 'The design is standard envelope encryption, with one key per person.',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      'Every user has their own 256-bit **data key**. It encrypts their fields with AES-256-GCM.',
      'Data keys are stored in MongoDB, but only **wrapped**: encrypted by a key in Cloud KMS that never leaves Google.',
      'Only the API\'s service account may use that KMS key. There is no key file and no secret in the environment; the service authenticates with its Cloud Run identity.',
    ],
  },
  {
    kind: 'paragraph',
    text: 'So the database holds ciphertext and locked keys. To read anything you need the database *and* the ability to act as the API\'s service account.',
  },
  {
    kind: 'paragraph',
    text: 'Per-user keys cost a little more than one global key, and they buy two things. A bug that mixes up users cannot quietly serve one person\'s text to another, because it will not decrypt. And deleting one row, the user\'s data key, makes everything they wrote unreadable everywhere, old backups included. That is what makes account deletion a real deletion. (The deletion flow itself is not built yet; the property is there for when it is.)',
  },
  { kind: 'heading', level: 2, text: 'One sealed value' },
  {
    kind: 'paragraph',
    text: 'A sealed field is stored as a single string:',
  },
  {
    kind: 'code',
    language: '',
    code: `e1.<dataKeyVersion>.<iv>.<ciphertext+tag>`,
  },
  {
    kind: 'paragraph',
    text: '`e1` is the format version, the IV is 12 random bytes, and the last part is the ciphertext with its 16-byte GCM tag, both base64url.',
  },
  {
    kind: 'paragraph',
    text: 'Keeping it a string was deliberate. A title is a string, a checklist row is a string, a map value is a string; a sealed value drops into the same slot with no schema type change. The plaintext is the JSON of the value, so numbers and small objects use the same format and come back as the type they went in as.',
  },
  {
    kind: 'code',
    language: 'ts',
    code: `export function seal(key: KeyObject, dekVersion: number, aad: string, value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const body = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return \`e1.\${dekVersion}.\${iv.toString('base64url')}.\${body.toString('base64url')}\`;
}`,
  },
  {
    kind: 'paragraph',
    text: 'Anything that does not match that pattern exactly is treated as legacy readable text. That one rule is what makes the rollout possible, and I will come back to it.',
  },
  { kind: 'heading', level: 2, text: 'Binding a value to where it lives' },
  {
    kind: 'paragraph',
    text: 'GCM lets you attach associated data: bytes that are not encrypted but must match for decryption to succeed. Every sealed value is bound to its owner and its location:',
  },
  {
    kind: 'code',
    language: 'ts',
    code: `const aad = \`\${userId}|\${collection}|\${path}\`;   // e.g. 665f…|board_items|content.title`,
  },
  {
    kind: 'paragraph',
    text: 'Without this, ciphertext is portable. Someone with write access to the database could copy a sealed title from one user\'s card onto another\'s, or move a value from a private field into one the app displays differently, and the API would happily decrypt it. With the binding, both fail authentication.',
  },
  {
    kind: 'paragraph',
    text: 'Two details mattered here:',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      '**Array elements and map values use the path without the index or key.** Reordering a checklist or renaming a tracker does not force re-sealing anything.',
      '**Wrapped data keys are bound too**, to the user and to the name of the KMS key. Dev and prod use different KMS keys, so a data key copied between environments fails to unlock.',
    ],
  },
  { kind: 'heading', level: 2, text: 'Declaring what is sealed, once' },
  {
    kind: 'paragraph',
    text: 'The rule is simple: a string the person typed is sealed. A field stays readable only if the server filters, sorts or indexes on it: dates, positions, ids, ordering keys.',
  },
  {
    kind: 'paragraph',
    text: 'All of it is declared in one file:',
  },
  {
    kind: 'code',
    language: 'ts',
    code: `export const SEALED_FIELDS = {
  board_items: [
    'content.title',
    'content.richText',
    'content.tasks[].text',
    // ...
  ],
  calendarevents: ['title', 'description', 'location', 'attendees[].email'],
  checkins: ['words{}', 'amounts{}'],
  // ...
} as const;`,
  },
  {
    kind: 'paragraph',
    text: '`a[]` means each element of an array, `a[].b` a field of each element, `a{}` each value of a map. Services call `sealDoc` or `sealSet` before writing and `openDoc` after reading; the path syntax handles the traversal. Adding a sealed field is a one-line change, and a reviewer can see the whole encryption surface in one place.',
  },
  {
    kind: 'paragraph',
    text: 'I chose explicit calls over Mongoose middleware. Each service seals *after* its own validation and sanitising, so validation always runs on readable text, and there is no hidden hook to forget about when someone uses the raw driver.',
  },
  { kind: 'heading', level: 2, text: 'Keeping KMS off the request path' },
  {
    kind: 'paragraph',
    text: 'A KMS call on every request would add latency and cost, and would make KMS a hard dependency of every read. Unwrapped data keys are cached in memory instead:',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      'an LRU of 5,000 users per instance, each entry kept for one hour;',
      'concurrent cache misses for the same user share one in-flight KMS call;',
      'raw key bytes are zeroed as soon as they are turned into a `KeyObject`.',
    ],
  },
  {
    kind: 'paragraph',
    text: 'That is one KMS call per user, per instance, per hour.',
  },
  {
    kind: 'paragraph',
    text: 'First-time key creation has a race: two instances can both find no key for a new user and both create one. A unique index on `userId` lets exactly one insert win. The loser catches the duplicate-key error and reads the winner\'s key. Without that, half of a new user\'s first writes would be sealed with a key that was never stored.',
  },
  { kind: 'heading', level: 2, text: 'The rollout' },
  {
    kind: 'paragraph',
    text: 'The cryptography was a few days. Making it safe to turn on was the real work. One environment variable controls it:',
  },
  {
    kind: 'table',
    head: ['`FIELD_ENCRYPTION`', 'Writes', 'Reads'],
    rows: [
      ['`off` (default)', 'stored readable', 'sealed values are opened'],
      ['`write`', 'sealed', 'sealed values are opened'],
      ['`strict`', 'sealed', 'as above, and a readable value in a sealed field is logged'],
    ],
  },
  {
    kind: 'paragraph',
    text: 'Reads open sealed values in **every** mode. That is what makes each step reversible: if something goes wrong after moving to `write`, setting it back to `off` loses nothing, because everything already sealed still opens.',
  },
  {
    kind: 'paragraph',
    text: 'The sequence, each step its own release:',
  },
  {
    kind: 'list',
    ordered: true,
    items: [
      '**Deploy with encryption off.** Nothing changes. The code is live and reading mixed data correctly, because nothing is sealed yet.',
      '**Switch to `write`.** New and edited values are sealed. Old rows remain readable text and keep working.',
      '**Backfill.** A script seals what is already there. It supports a dry run and a single-user run for rehearsal.',
      '**Verify.** A second script scans every sealed field and exits non-zero if anything readable is left.',
      '**Switch to `strict`** and watch the logs. A warning names the collection, field and document id, never the value.',
    ],
  },
  { kind: 'heading', level: 3, text: 'A backfill that cannot lose an edit' },
  {
    kind: 'paragraph',
    text: 'The backfill runs while people are using the app, so it must not overwrite an edit made between its read and its write. Each update\'s filter includes every value it is about to replace:',
  },
  {
    kind: 'code',
    language: 'ts',
    code: `// "seal this title, but only if it is still exactly what I read"
{ updateOne: {
    filter: { _id: doc._id, 'content.title': valueAsRead },
    update: { $set: { 'content.title': sealedValue } },
} }`,
  },
  {
    kind: 'paragraph',
    text: 'If the user edited the row in between, the filter does not match and the update does nothing. The edit itself was sealed on write, or the next run picks the row up. Because already-sealed values are skipped, the script is safe to run as many times as needed.',
  },
  {
    kind: 'paragraph',
    text: 'In production the backfill runs as a Cloud Run Job under the service\'s own identity, so no person ever needs access to the production key.',
  },
  { kind: 'heading', level: 3, text: 'Failing loudly, in the right places' },
  {
    kind: 'list',
    ordered: false,
    items: [
      '**At boot:** asking for `write` or `strict` with no key configured stops the process. So does a typo in the mode. A misspelled setting must not silently mean "store everything readable".',
      '**Local keys refuse production.** There is a local key option for laptops and tests. It refuses to start on Cloud Run or with `NODE_ENV=production`, so a production service that lost its KMS setting fails instead of falling back to a key in an environment variable.',
      '**One bad value does not take down a page.** A value that will not open is logged and returned still sealed. Ciphertext reveals nothing, and one damaged row should not break someone\'s whole board.',
    ],
  },
  { kind: 'heading', level: 2, text: 'What this does not protect against' },
  {
    kind: 'paragraph',
    text: 'Being specific about limits matters more than the feature list.',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      '**It is not end-to-end encryption.** The API decrypts on the server, so a compromised API process, or anyone who can act as its service account, can read data. I chose this trade knowingly: server-side features like search and reminders need readable text, and password recovery must not mean losing your journal.',
      '**Metadata stays readable.** Dates, positions, counts and which day has entries are visible in the database.',
      '**Some edges still leak.** Tracker keys can echo their labels, and link-preview URLs can appear in request logs. These are written down as known gaps.',
      '**Key rotation is half done.** Old KMS key versions keep unlocking data keys, so rotation works, but the job that re-wraps data keys under the newest version is not written.',
    ],
  },
  { kind: 'heading', level: 2, text: 'What I would tell someone doing this' },
  {
    kind: 'list',
    ordered: true,
    items: [
      '**Decide the legacy rule first.** "Anything that is not exactly the sealed format is readable text" is what let old and new rows coexist. Everything else in the rollout follows from it.',
      '**Make reads tolerant and writes configurable.** That asymmetry is what makes every step reversible.',
      '**Bind ciphertext to its context.** It costs one line and closes a class of attacks that encryption alone leaves open.',
      '**Write the verify script before the backfill.** It gives you a definition of done that is an exit code, not a feeling.',
      '**Write down what it does not do.** A privacy claim people can check is worth more than one that sounds stronger.',
    ],
  },
];
