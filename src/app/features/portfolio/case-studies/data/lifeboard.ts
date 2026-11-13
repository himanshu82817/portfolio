import { CaseStudy } from '../case-study.model';

/**
 * Written from a read of LifeBoard-Web and LifeBoard-Server, then fact-checked
 * claim by claim against the code (Sep 2026). Encryption, reminders and trackers
 * were re-checked against the server's main branch in Nov 2026, when this was
 * published.
 *
 * Deliberately left out: deployment hostnames, credential locations, the OAuth
 * token hand-off detail, and anything describing past or open weaknesses.
 */
export const LIFEBOARD: CaseStudy = {
  slug: 'lifeboard',
  name: 'LifeBoard',
  tagline:
    'A personal life archive: an infinite canvas for every day, and a Life Map that ' +
    'zooms from a single day out to a whole life.',
  kind: 'Personal product',
  engagement: 'personal',
  status: { label: 'In development', tone: 'building' },
  period: 'Dec 2025 – present',
  role: 'Co-builder · led backend design',
  platforms: ['Web (installable PWA)', 'REST API'],
  cover: {
    src: '/case-studies/lifeboard/cover.svg',
    alt: 'Abstract illustration of notes pinned on an infinite canvas above an activity heatmap',
  },
  published: true,

  summary: [
    'LifeBoard is a product I co-build. It treats a person’s notes, tasks, photos and check-ins ' +
      'as an archive worth trusting: every day gets its own infinite canvas, and a Life Map ' +
      'zooms out from that day through weeks, years and decades to a grid of a whole life.',
    'It’s two applications. The web client is an Angular 21 PWA built on signals, with a ' +
      'sync engine that paints from IndexedDB first and batches edits into bulk writes. The ' +
      'API is a NestJS 11 modular monolith on MongoDB, containerised for Google Cloud Run, ' +
      'with images in Google Cloud Storage.',
    'Most of what’s interesting sits where product and engineering meet: a canvas that has ' +
      'to feel instant but never lose a keystroke, and personal data that has to stay ' +
      'correct across devices, time zones and flaky connections.',
  ],
  problem: [
    'Most journaling tools are lists. LifeBoard gives each surface its own question: the ' +
      'board asks what did I do that day, the Tasks view asks what’s being asked of me and ' +
      'by when, and the Life Map asks whether I showed up, and what happened.',
    'That makes durability the first requirement. Life chapters once lived only in browser ' +
      'storage, where clearing a cache could erase the most personal data in the product. ' +
      'Moving that data to the server without making the canvas feel any slower shaped most ' +
      'of the architecture.',
  ],
  ownership: {
    statement:
      'Co-built with one collaborator. I led the backend design, and the architecture ' +
      'decisions on this page are ones I made or shared.',
  },

  architecture: {
    overview: [
      'The client loads each collection once, keeps it in signal stores and indexes it ' +
        'locally, so the board, dashboard, Tasks and Life Map all read the same in-memory ' +
        'data. It paints from an IndexedDB snapshot before the network answers, then ' +
        'revalidates with a conditional request that returns a bodiless 304 when nothing ' +
        'has changed.',
      'Edits are optimistic. Drags, resizes and keystrokes mark items dirty, and a write ' +
        'buffer flushes them as one bulk PATCH after two seconds of quiet, or ten at most. ' +
        'The buffer is mirrored to localStorage per account, so a closed tab or a crash ' +
        'replays unsaved work on the next visit.',
      'On the server, every domain collection is scoped by user, calendar days are stored as ' +
        'civil dates rather than UTC instants, and races between devices are settled by ' +
        'unique indexes rather than locks. Images are uploaded once through the API, checked, ' +
        'de-duplicated and written to object storage under unguessable keys.',
    ],
    diagram: {
      caption: 'LifeBoard: a cache-first Angular client over a NestJS API on Google Cloud',
      nodes: [
        { id: 'web', label: 'LifeBoard Web', sublabel: 'Angular 21 PWA', tier: 'client', ownership: 'built' },
        { id: 'sw', label: 'Service worker', sublabel: 'App shell cache', tier: 'client', ownership: 'built' },
        { id: 'local', label: 'Local cache', sublabel: 'IndexedDB + buffer', tier: 'client', ownership: 'built' },
        { id: 'api', label: 'NestJS API', sublabel: 'Throttle → JWT guard', tier: 'edge', ownership: 'built' },
        { id: 'auth', label: 'Auth & sessions', sublabel: 'OTP · OAuth · JWT', tier: 'service' },
        { id: 'domain', label: 'Board & Life Map', sublabel: 'Cards, chapters, tracks', tier: 'service', ownership: 'built' },
        { id: 'media', label: 'Media service', sublabel: 'Type check · dedupe', tier: 'service', ownership: 'built' },
        { id: 'mongo', label: 'MongoDB', sublabel: 'Per-user indexes', tier: 'data' },
        { id: 'gcs', label: 'Cloud Storage', sublabel: 'Unguessable keys', tier: 'data' },
        { id: 'google', label: 'Google OAuth', tier: 'external' },
      ],
      edges: [
        { from: 'sw', to: 'web', label: 'app shell' },
        { from: 'web', to: 'local', label: 'paint first' },
        { from: 'web', to: 'api', label: 'REST · ETag' },
        { from: 'api', to: 'auth' },
        { from: 'api', to: 'domain' },
        { from: 'api', to: 'media', label: 'multipart' },
        { from: 'domain', to: 'mongo', label: 'bulkWrite' },
        { from: 'media', to: 'gcs', label: 'put' },
        { from: 'auth', to: 'google', label: 'OAuth' },
      ],
    },
    components: [
      {
        name: 'LifeBoard Web',
        tech: 'Angular 21 · signals · Tailwind CSS 4',
        responsibility:
          'The day canvas, dashboard, Tasks agenda and Life Map, as standalone OnPush ' +
          'components over root-provided signal stores. No NgRx.',
        ownership: 'built',
      },
      {
        name: 'Sync engine',
        tech: 'Signal store · IndexedDB · localStorage',
        responsibility:
          'Paints from cache, revalidates with ETags, batches edits into bulk PATCHes capped ' +
          'by size and count, isolates rejected items, and replays unsaved writes after a crash.',
        ownership: 'built',
      },
      {
        name: 'Infinite canvas',
        tech: 'CSS transforms · Angular CDK drag-drop',
        responsibility:
          'Pan, pointer-anchored zoom, zoom-correct drag, rotation-aware resize and rotation ' +
          'snapping, across four card types declared in a single registry.',
        ownership: 'built',
      },
      {
        name: 'Life Map',
        tech: 'Seven zoom levels · heat and story lenses',
        responsibility:
          'Day-to-Life views computed from one date, with a points-based heat ramp, ' +
          'lane-packed chapter rails, and a life-in-months grid anchored to date of birth.',
        ownership: 'built',
      },
      {
        name: 'LifeBoard API',
        tech: 'NestJS 11 · Mongoose 9 · Docker',
        responsibility:
          'Feature modules for board items, chapters, tracks, check-ins, focus sessions and ' +
          'media, behind a rate limiter and a JWT guard, with one uniform error envelope.',
        ownership: 'built',
      },
      {
        name: 'Media service',
        tech: 'Google Cloud Storage · SHA-256 · mark-and-sweep',
        responsibility:
          'Checks an upload’s real file type, de-duplicates it per user, enforces a storage ' +
          'quota, and reclaims orphaned objects with a sweep that has a 24-hour grace period.',
        ownership: 'built',
      },
      {
        name: 'Auth & sessions',
        tech: 'JWT · Google OAuth · email OTP',
        responsibility:
          'Email signup with a one-time code, sign-in by email or username, Google sign-in, ' +
          'and multi-device sessions with rotating refresh tokens.',
      },
    ],
    flows: [
      {
        name: 'Editing a card until it reaches MongoDB',
        steps: [
          'A card is dragged. The live preview follows the pointer 1:1 at any zoom level.',
          'On release, the screen distance is divided by the zoom to get a world distance, and the new position is written to the signal store.',
          'The item is marked dirty, and a flush is scheduled for two seconds of quiet, or ten seconds at most.',
          'The flush drops any payload identical to the last one synced, then caps the batch by bytes and by item count.',
          'One PATCH reaches the API, which runs a single bulkWrite that sets only the fields each item carries.',
          'On success the local buffer is cleared. If the server rejects the batch, it’s halved until the one bad item is found and set aside.',
        ],
      },
      {
        name: 'Opening the board cold',
        steps: [
          'An app initializer restores the session, painting the cached profile immediately.',
          'The route guard lets the page through only for an unexpired token or a refreshable session, before its code is downloaded.',
          'The sync engine reads this account’s IndexedDB snapshot, giving it at most 150ms before going to the network anyway.',
          'If a cached board is on screen, the GET carries its ETag: a 304 keeps what’s shown, a 200 replaces it.',
          'Unsaved writes left in the buffer from the last visit are replayed, then the cache is rewritten.',
        ],
      },
      {
        name: 'Uploading an image',
        steps: [
          'The browser downscales the image and extracts its dominant colours locally.',
          'The API identifies the real format from the file’s first bytes and hashes it.',
          'If this user already stored those bytes, the existing record is returned with no quota charge.',
          'Otherwise the quota is checked and the object is written under a random, unguessable key.',
          'The card stores the image URL. A clean-up sweep later deletes any object nothing references.',
        ],
      },
    ],
  },

  decisions: [
    {
      title: 'Load whole collections once, and revalidate with a weak ETag',
      context:
        'The week strip, heatmap, Life Map and Tasks agenda all read the same items across ' +
        'many dates.',
      choice:
        'Each collection is fetched whole and indexed by day on the client. The server tags ' +
        'the board list with a weak ETag built from the item count plus the newest update ' +
        'time, and answers a matching request with a bodiless 304.',
      why:
        'A date-range query per view would have the Life Map calling the server every time it ' +
        'moves. The ETag makes an unchanged board cost a count and one indexed lookup rather ' +
        'than a full read, and count plus newest update still catches deletes.',
      alternatives: ['Date-range queries per view or zoom level', 'Hashing the full response'],
      tradeoff:
        'The first load, and any change, ships the whole set, so payload grows with account ' +
        'history. Correctness depends on every write touching the update time or the count.',
    },
    {
      title: 'Batch micro-edits into one bulk PATCH',
      context:
        'Every drag end, resize, rotation and keystroke would otherwise fire its own request.',
      choice:
        'A dirty set per item, flushed after two seconds of quiet but never later than ten, as ' +
        'one PATCH chunked by size and by item count. Writes identical to the last synced ' +
        'payload are dropped.',
      why:
        'It keeps the canvas instant and the server quiet. Capping by item count as well as ' +
        'bytes matters: a byte cap alone can still exceed the server’s batch limit on a long ' +
        'queue, and that batch would then fail on every retry, forever.',
      alternatives: ['One request per mutation', 'Save on blur or close'],
      tradeoff:
        'Edits reach the server up to ten seconds later, and the client carries real state: ' +
        'in-flight batches, temporary-id aliases and payload diffs.',
    },
    {
      title: 'Isolate a rejected edit by halving the batch',
      context:
        'The API rejects any undeclared field, so a single malformed item failed its whole ' +
        'batch. The batch was kept and retried, so one bad card stopped every other edit on ' +
        'that account from ever saving.',
      choice:
        'On a payload error, the batch is split in half and retried until the one failing item ' +
        'is isolated. That item is set aside in a visible “could not be saved” state; ' +
        'everything else goes through.',
      why:
        'Halving finds the culprit in log₂(batch) attempts, and it turns silent, total data ' +
        'loss into one clearly-marked card the user can fix.',
      alternatives: [
        'Treat any client error as terminal and drop the batch',
        'Validate every payload on the client',
      ],
      tradeoff: 'A rejected card waits until the user edits it again.',
    },
    {
      title: 'Proxy uploads through the API, with unguessable keys',
      context:
        'Images had to move out of database documents into object storage, while each user’s ' +
        'archive stays private and still loads in a plain <img>.',
      choice:
        'Multipart uploads go through the API, which writes to Cloud Storage under a key with ' +
        '144 random bits. The bucket allows reading an object but never listing them.',
      why:
        'The quota check, format check and checksum all need the bytes. Signed direct uploads ' +
        'need a second “commit” call the client can skip, which strands objects. At around ' +
        '1MB per image, proxying costs little.',
      alternatives: [
        'Signed direct-to-bucket upload URLs',
        'Expiring signed read URLs',
        'Content-addressed keys',
      ],
      tradeoff:
        'Uploads spend API CPU and bandwidth, and anyone holding an image URL can load it until ' +
        'the object is deleted.',
    },
    {
      title: 'Reclaim storage by mark-and-sweep, not reference counting',
      context:
        'An upload creates its object before the card referencing it is saved, and the client ' +
        'debounces, retries and works offline.',
      choice:
        'A sweep collects every referenced key, then deletes unreferenced objects older than 24 ' +
        'hours and recomputes each user’s storage total. It refuses to run if media exists but ' +
        'nothing appears to reference it.',
      why:
        'A reference count has to stay correct through every debounced, retried, offline ' +
        'write, and any drift either strands bytes or deletes a photo someone still uses. A ' +
        'sweep only has to be correct at the moment it runs.',
      alternatives: ['Reference counts maintained on every write'],
      tradeoff:
        'Orphans persist until the next run, each run scans every card that holds an image, ' +
        'and the storage total can drift between runs.',
    },
    {
      title: 'Civil dates for calendar values; instants for what happened',
      context:
        'Board days, reminders, check-ins and card spans all have to survive a change of time ' +
        'zone.',
      choice:
        'Days are stored as YYYY-MM-DD strings, and reminders as a local time with no zone. ' +
        'Events that happened at a moment, like a finished focus session, are stored as real ' +
        'instants.',
      why:
        'A reminder for “the 18th at 9am” should mean 9am wherever the person is. A focus ' +
        'session happened at a moment, and travelling mustn’t move it.',
      alternatives: ['Store everything as UTC instants'],
      tradeoff:
        'Anything that fires at a local time needs the account’s time zone, converted safely ' +
        'across daylight-saving changes.',
    },
    {
      title: 'Open the board at 100%, and fit to content only on request',
      context:
        'An earlier pass fitted the camera to the day’s content automatically, on every load ' +
        'and every date change.',
      choice:
        'Each day opens at 100% zoom with the origin centred. Fitting to content is a button.',
      why:
        'Auto-fit produced a camera with opinions: paging through a week zoomed in and out, and ' +
        'a canvas is only useful if you remember where you put things.',
      alternatives: ['Auto-fit on every load', 'Remembering the camera per day'],
      tradeoff:
        'A day laid out on a large screen can open partly off-screen on a phone until fit is ' +
        'pressed.',
    },
    {
      title: 'Seal what people write, with one key per person',
      context:
        'A journal holds things people would not say out loud. Disk encryption does nothing ' +
        'about a leaked backup or a stolen connection string.',
      choice:
        'Envelope encryption. Each person has their own AES-256 data key, stored wrapped by a ' +
        'Cloud KMS key that only the API’s service account may use. Every sealed value is ' +
        'bound to its owner, collection and field, and one file declares every sealed field.',
      why:
        'A copy of the database on its own is unreadable, ciphertext copied onto another ' +
        'record fails to decrypt, and deleting one key row makes everything a person wrote ' +
        'unreadable, backups included. Reads accept both formats, so the rollout moves ' +
        'through off, write and strict with an idempotent backfill and every step reversible.',
      alternatives: [
        'Provider disk encryption only',
        'One global application key',
        'End-to-end encryption in the browser',
      ],
      tradeoff:
        'It is not end-to-end: the API decrypts on the server, so the server stays trusted. ' +
        'Dates, positions and ids stay readable because the server filters and sorts on them.',
    },
    {
      title: 'Drive reminders from outside the process',
      context:
        'On Cloud Run an in-process timer is not a clock: CPU is throttled between requests ' +
        'and an idle service scales to zero, so reminders fire only while people are already ' +
        'in the app.',
      choice:
        'Cloud Scheduler calls a sweep endpoint every minute. The endpoint admits one service ' +
        'account by OIDC token, finishes the sweep before it responds, and records each ' +
        'firing under a unique index before pushing it.',
      why:
        'A request is the one thing that wakes an instance and holds its CPU. The unique ' +
        'index makes each reminder fire once when instances race, without a lock, and ' +
        'shutdown waits for a sweep in flight so a deploy does not drop a push.',
      alternatives: [
        'An in-process interval',
        'One scheduled task per reminder',
        'Always-on CPU with a minimum instance',
      ],
      tradeoff:
        'Delivery is at most once: a hard crash between recording and pushing loses that ' +
        'push. Resolution is one minute.',
    },
  ],

  features: [
    {
      group: 'Board',
      items: [
        {
          name: 'Infinite canvas',
          detail:
            'Pointer-anchored wheel and pinch zoom, panning, zoom-correct drag, rotation-aware ' +
            'resize and rotation snapping.',
        },
        {
          name: 'Four card types from one registry',
          detail:
            'Notes, task lists, images and quotes, each declared once with its label, icon, ' +
            'default size and starting content.',
        },
        {
          name: 'Rich notes with links and video',
          detail:
            'Inline formatting on the canvas, sanitised links, and YouTube or file video that ' +
            'loads nothing from a third party until pressed.',
        },
        {
          name: 'Delete with undo',
          detail: 'Deletes are immediate, with a six-second undo shared across the app.',
        },
      ],
    },
    {
      group: 'Life Map',
      items: [
        {
          name: 'Seven zoom levels',
          detail:
            'Day, Week, Month, Year, Decade, Century and Life, with full keyboard navigation. ' +
            'Every day links straight into its board.',
        },
        {
          name: 'Heat and Story lenses',
          detail:
            'Heat shows how much was recorded, priced in points. Story shows named chapters ' +
            'and moments as rails. Both are offered from Month up to Century.',
        },
        {
          name: 'Life in months',
          detail:
            'A memento-mori grid anchored to date of birth, which shows nothing rather than ' +
            'guessing when that date is missing.',
        },
        {
          name: 'Check-ins and focus sessions',
          detail: 'Daily mood and energy check-ins, plus a focus timer kept alive by heartbeats.',
        },
      ],
    },
    {
      group: 'Tasks',
      items: [
        {
          name: 'Task lists on the canvas',
          detail:
            'Keyboard editing, reordering, progress and deadline chips measured against the ' +
            'real current date.',
        },
        {
          name: 'Agenda',
          detail:
            'The same task items filed into overdue, today, tomorrow, this week, later, ' +
            'someday, needs a date, and done.',
        },
      ],
    },
    {
      group: 'Sync & accounts',
      items: [
        {
          name: 'Cache-first, crash-safe sync',
          detail:
            'Paints from IndexedDB before the network answers, keeps unsaved writes across ' +
            'crashes, and replays them on the next load, retrying failed flushes with backoff.',
        },
        {
          name: 'Installable PWA',
          detail:
            'A service worker prefetches the app shell in production builds. Fonts and icons ' +
            'still load from a CDN, so it isn’t fully offline yet.',
        },
        {
          name: 'Sign-in',
          detail:
            'Email signup with a one-time code, Google sign-in, and sessions that renew ' +
            'across tabs and devices.',
        },
      ],
    },
    {
      group: 'Reminders, tracking & privacy',
      items: [
        {
          name: 'Reminders and web push',
          detail:
            'Reminders that fire in each user’s own time zone, recorded exactly once and ' +
            'delivered as web push, with Snooze and Done on the notification itself.',
        },
        {
          name: 'Custom trackers and multi-day cards',
          detail: 'User-defined trackers with totals, and cards that span several days.',
        },
        {
          name: 'Field encryption',
          detail:
            'Everything a person types is sealed with their own key before it reaches the ' +
            'database.',
        },
      ],
    },
  ],

  challenges: [
    {
      title: 'Drag, resize and rotate on a scaled, rotated canvas',
      problem:
        'The canvas is one translate-and-scale surface. Drags committed screen distances as ' +
        'world distances, so cards landed in the wrong place whenever zoom wasn’t 100%, and the ' +
        'live preview lagged the pointer. Resizing a rotated card along screen axes stretched ' +
        'it the wrong way.',
      approach:
        'Drag distances are divided by zoom when committed, and the live preview is scaled to ' +
        'match. Resize converts the pointer movement into the card’s own rotated frame and ' +
        'moves its centre by half the growth, so the opposite corner stays put. Every zoom path ' +
        'keeps the point under the cursor fixed.',
      outcome:
        'Cards track the pointer 1:1 at any zoom and rotation, and resize at 0° reduces exactly ' +
        'to the unrotated behaviour.',
    },
    {
      title: 'A save pipeline that can’t wedge or lose work',
      problem:
        'Several failure modes stacked up: an editor draft created a duplicate card, a batch ' +
        'could exceed the server’s item limit and fail forever, one invalid item blocked every ' +
        'save for an account, and an empty state before the first load could discard ' +
        'unreplayed edits.',
      approach:
        'Temporary ids map to server ids, batches are capped by bytes and by count, no-op writes ' +
        'are dropped, rejected batches are bisected down to one item, and failures back off. ' +
        'Separate loaded, hydrated and suspended flags decide when the buffer may be cleared, ' +
        'and buffers are keyed per account.',
      outcome:
        'Unsaved work survives crashes and account switches, and a single bad card surfaces as ' +
        'a visible, fixable state instead of silent loss.',
    },
    {
      title: 'Video inside a draggable, zoomable card',
      problem:
        'A pointer over an iframe sends no events to the page, so a resize or rotation in ' +
        'progress never saw its mouse-up and the card became permanently stuck. Rebuilding the ' +
        'embed URL on each edit also restarted playback.',
      approach:
        'The player mounts only on an explicit press and turns inert during any gesture. One ' +
        'board-level owner allows a single player at a time, and the embed URL is compared by ' +
        'value so it keeps its identity across edits.',
      outcome:
        'Playback survives a full refresh from the server on the same element, and a board of ' +
        'videos loads no players until one is pressed.',
    },
    {
      title: 'Fields silently disappearing on bulk edits',
      problem:
        'New card fields passed validation and then vanished after a reload. Setting a whole ' +
        'subdocument in a bulk write is cast against the schema, which drops undeclared keys ' +
        'without an error, and it also re-wrote the image on every keystroke.',
      approach:
        'Updates were rewritten as per-field dotted paths, so an absent field means “leave it ' +
        'alone” and null means “clear it”, and the read path passes content through whole.',
      outcome:
        'New content fields round-trip, images stop being re-written on every edit, and the ' +
        'trap is documented where it lives.',
    },
    {
      title: 'Moving images out of the database without breaking old cards',
      problem:
        'Every image was a base64 string inside its card, so each board load shipped every ' +
        'photo. Existing cards had to keep rendering and saving throughout the move.',
      approach:
        'Validators accept both formats during the transition. Uploads and the migration share ' +
        'one storage path, so both get the same checks and accounting. The migration is ' +
        'idempotent and resumable, and every script has a dry run.',
      outcome:
        'New images go to object storage behind a per-user quota, old cards still render, and ' +
        'the migration and clean-up can be rehearsed per user before running for real.',
    },
    {
      title: 'Civil dates and time zones',
      problem:
        'Parsing “YYYY-MM-DD” as a Date yields UTC midnight, so users west of UTC opened the ' +
        'previous day’s board. Legacy deadline text parsed to the wrong century, and a board ' +
        'left open overnight kept saying “due today”.',
      approach:
        'Bare dates are parsed strictly into local dates, deadlines are measured against a ' +
        'shared “today” signal refreshed when the tab becomes visible, and completion records ' +
        'the local day at the moment a task is ticked.',
      outcome:
        'Board URLs became shareable day links, and week-boundary tests cover daylight-saving ' +
        'weeks.',
    },
  ],

  metrics: [
    { value: '7', label: 'Life Map zoom levels, from one day to a whole life', kind: 'count' },
    { value: '432', label: 'Unit tests in the web client', kind: 'count', note: 'Vitest, committed.' },
    {
      value: '4.86:1',
      label: 'Worst-case secondary text contrast on task cards, across all 12 colours',
      kind: 'measured',
      note: 'In both light and dark themes.',
    },
  ],

  stack: [
    { group: 'Frontend', items: ['Angular 21', 'Signals', 'Angular CDK', 'Tailwind CSS 4', 'RxJS'] },
    { group: 'Client storage', items: ['Service worker', 'IndexedDB', 'localStorage'] },
    { group: 'Backend', items: ['NestJS 11', 'MongoDB', 'Mongoose 9', 'Passport', 'Web Push'] },
    { group: 'Cloud', items: ['Google Cloud Run', 'Cloud Storage', 'Cloud KMS', 'Cloud Scheduler', 'Docker'] },
    { group: 'Testing', items: ['Vitest', 'Jest'] },
  ],
  links: [{ label: 'lifeboardos.com', url: 'https://lifeboardos.com', kind: 'live' }],
  gallery: [],

  // Published Nov 2026. Questions that were still open at that point, kept
  // here so they are not lost:
  //  - Is there a public LifeBoard URL you’re happy to link? A dev deployment exists, but I haven’t named it.
  //  - Reminders, web push, custom trackers and multi-day cards are uncommitted work. Keep them under “In progress”, or leave them out?
  //  - Any real usage to share, like testers or active users? There are no numbers in the repos, so the page shows none.
  //  - In a sentence, what made you build LifeBoard? That would sharpen “The problem”.
  //  - The original auth module was mostly written by a collaborator, so the page describes it as a feature, not as your implementation. Add a credit line, or leave it?
  //  - The repos include AI-assistant configuration and a generated audit. Do you want AI-assisted development mentioned, and how?
  //  - A screenshot of the board and the Life Map would help most. Can you add two?
  openQuestions: [],

  seo: {
    title: 'LifeBoard — case study',
    description:
      'How LifeBoard, a cache-first life archive built with Angular 21 and NestJS, keeps an ' +
      'infinite canvas instant without ever losing an edit.',
  },
};
