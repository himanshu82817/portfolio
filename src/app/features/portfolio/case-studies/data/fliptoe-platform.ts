import { CaseStudy } from '../case-study.model';

/**
 * DRAFT. Written from a read of Fliptoe-Backend, streaming-server and the Fliptoe
 * app, then fact-checked claim by claim against the code (Sep 2026). Client work —
 * unpublished until reviewed.
 *
 * Deliberately left out: all prices, rates, levels, thresholds and exchange rates;
 * hostnames and infrastructure identifiers; client and colleague names; and every
 * detail of past or open vulnerabilities. Security work is described only as design.
 *
 * Authorship of the Go server was checked with git blame: every media, ingest and
 * hub file was created by the owner, who also owns all of their current lines.
 */
export const FLIPTOE_PLATFORM: CaseStudy = {
  slug: 'fliptoe',
  name: 'Fliptoe',
  tagline:
    'The backend and realtime systems behind a social video-calling app: paid one-to-one ' +
    'calls, live streams and virtual gifts, with settlement made idempotent across two services.',
  kind: 'Contract · Platform engineering',
  engagement: 'contract',
  status: { label: 'Ongoing', tone: 'building' },
  period: 'Feb 2026 – present',
  role: 'Lead backend & realtime engineer',
  platforms: ['Node.js API', 'Go realtime server', 'React Native app'],
  cover: {
    src: '/case-studies/fliptoe/cover.svg',
    alt: 'Abstract illustration of a video call on a phone, connected through a realtime hub to a ledger and a live stream',
  },
  published: false,

  confidentiality:
    'Client work. The code is private, and pricing, infrastructure and client details are ' +
    'left out. What’s described here is the architecture and the engineering decisions I made.',

  summary: [
    'Fliptoe is a social video app built around creators. People follow and chat with ' +
      'creators, pay by the second for one-to-one video calls, send virtual gifts, watch live ' +
      'broadcasts, and can be matched into random calls.',
    'I joined in February 2026 on an existing Node.js backend and am now its sole engineer. ' +
      'I also built the Go realtime server that runs beside it, and worked on the React Native ' +
      'app alongside another developer. The product and business rules are the client’s; the ' +
      'technical decisions below are mine.',
    'The platform is two services sharing one MongoDB. A Go hub carries the realtime traffic: ' +
      'chat, presence, call signalling, live rooms, in-call gifts and random matching. The Node ' +
      'API is the system of record for identity, wallets and the ledger, and the settlements ' +
      'that move money go through it.',
  ],
  problem: [
    'Nearly every interesting feature touches money. A call is billed by the second when it ' +
      'ends, but it can end through a hangup, a rejection, a network failure, a low-balance ' +
      'cut-off or a dropped socket, often several at once. A gift has to be paid for before ' +
      'either person sees it. And the realtime server that sees these events isn’t the service ' +
      'that owns the balances.',
    'On top of that, one goroutine routes every message for every connected user, so a single ' +
      'slow database read, or a single stalled phone, can freeze the whole server.',
  ],
  ownership: {
    statement:
      'Contract. I’m the sole engineer on the Node backend, which predates me, and I built the ' +
      'Go realtime server. On the mobile app I worked alongside another developer. Business and ' +
      'pricing decisions belong to the client.',
  },

  architecture: {
    overview: [
      'The app keeps a WebSocket open to the Go hub for live events, and calls REST endpoints on ' +
        'both services: Node for accounts, content and wallets, Go for chat history and ' +
        'presence. Call media is peer-to-peer WebRTC; live broadcasts come in over RTMP and go ' +
        'out as HLS.',
      'The Go hub is an actor: one goroutine owns all realtime state, and everything else talks ' +
        'to it over channels. Database reads run off that goroutine and hand back ' +
        'continuations, so routing never waits on MongoDB.',
      'When a call ends or a gift is sent during one, the hub asks Node to settle it over an ' +
        'authenticated internal API. Node applies each balance change as a single conditional ' +
        'update that also records the settlement’s ID, so a retried or duplicated report can ' +
        'never charge twice, without needing multi-document transactions.',
    ],
    diagram: {
      caption:
        'Fliptoe: a Go realtime hub and a Node system of record, sharing one MongoDB',
      nodes: [
        { id: 'app', label: 'Fliptoe app', sublabel: 'React Native', tier: 'client', ownership: 'contributed' },
        { id: 'api', label: 'Node API', sublabel: 'Express 5 · TypeScript', tier: 'service', ownership: 'owner' },
        { id: 'ledger', label: 'Settlement ledger', sublabel: 'Idempotent writes', tier: 'service', ownership: 'built' },
        { id: 'jobs', label: 'Weekly jobs', sublabel: 'Levels · leaderboard', tier: 'service', ownership: 'built' },
        { id: 'hub', label: 'Realtime hub', sublabel: 'Go · actor model', tier: 'service', ownership: 'built' },
        { id: 'ingest', label: 'Live ingest', sublabel: 'RTMP → FFmpeg → HLS', tier: 'service', ownership: 'built' },
        { id: 'mongo', label: 'MongoDB', sublabel: 'Shared by both services', tier: 'data' },
        { id: 'hls', label: 'HLS segments', sublabel: 'Per-stream playlists', tier: 'data' },
        { id: 'fcm', label: 'Firebase', sublabel: 'Identity · push', tier: 'external' },
        { id: 'turn', label: 'STUN / TURN', sublabel: 'Call media relay', tier: 'external' },
      ],
      edges: [
        { from: 'app', to: 'api', label: 'REST' },
        { from: 'app', to: 'hub', label: 'WS + REST' },
        { from: 'app', to: 'ingest', label: 'RTMP' },
        { from: 'app', to: 'turn', label: 'WebRTC' },
        { from: 'api', to: 'ledger' },
        { from: 'hub', to: 'api', label: 'settle' },
        { from: 'ledger', to: 'mongo', label: 'atomic' },
        { from: 'jobs', to: 'mongo', label: 'aggregate' },
        { from: 'hub', to: 'mongo', label: 'chat' },
        { from: 'ingest', to: 'hls', label: 'segments' },
        { from: 'api', to: 'fcm', label: 'push' },
      ],
    },
    components: [
      {
        name: 'Realtime hub',
        tech: 'Go · WebSockets · actor model',
        responsibility:
          'Owns chat, presence, call signalling, live rooms, in-call gifts and random matching on ' +
          'a single goroutine, with bounded off-loop reads and non-blocking sends.',
        ownership: 'built',
      },
      {
        name: 'Live ingest',
        tech: 'Go · RTMP · FFmpeg · HLS',
        responsibility:
          'Accepts RTMP from phones and WebM from browsers, packages HLS by copying the video ' +
          'rather than re-encoding it, and cleans up each stream’s processes and files.',
        ownership: 'built',
      },
      {
        name: 'Node API',
        tech: 'Express 5 · TypeScript · MongoDB',
        responsibility:
          'System of record for identity, sessions, the social graph, content, notifications ' +
          'and support. Every deploy is gated on a type-check and the test suite.',
        ownership: 'owner',
      },
      {
        name: 'Settlement & ledger',
        tech: 'Idempotent conditional updates',
        responsibility:
          'Where value moves: per-second call settlement, all-or-nothing gift settlement, and ' +
          'an append-only ledger behind both.',
        ownership: 'built',
      },
      {
        name: 'Levels & leaderboard',
        tech: 'Weekly MongoDB aggregation',
        responsibility:
          'Scores creators from ledger earnings, then writes each one’s level, call price and ' +
          'leaderboard position in batches.',
        ownership: 'built',
      },
      {
        name: 'Mobile app',
        tech: 'React Native 0.82 · Redux Toolkit',
        responsibility:
          'One RTK Query client per service, a WebSocket provider for realtime events, and ' +
          'peer-to-peer WebRTC calls with a relay fallback.',
        ownership: 'contributed',
      },
    ],
    flows: [
      {
        name: 'A paid call, settled idempotently',
        steps: [
          'The caller’s offer reaches the hub. It resolves the conversation and checks the caller can afford to start, reading from MongoDB off the routing goroutine.',
          'The receiver rings. On answer, the hub records the active call with a billing ID minted once, at that moment.',
          'Warning and cut-off timers are armed from the caller’s balance, so a call ends when the balance runs out.',
          'Whichever teardown path fires first, whether hangup, rejection, network failure, cut-off or disconnect, goes through one settle function with that billing ID.',
          'The hub asks Node to settle, retrying transient failures with backoff.',
          'Node claims the settlement by billing ID, debits and credits in single conditional updates, and writes the ledger. A retry of a finished settlement replays its stored result.',
        ],
      },
      {
        name: 'Sending a gift during a call',
        steps: [
          'The gift arrives over the WebSocket. The payer comes from the authenticated connection, never from the message.',
          'The hub limits unsettled gifts per sender, mints a transaction ID, and calls Node off the routing goroutine.',
          'Node deducts the full price or nothing, idempotently by that transaction ID.',
          'The receiver is credited and the ledger rows are written.',
          'Only once Node confirms does the hub show the gift to both people.',
        ],
      },
    ],
  },

  decisions: [
    {
      title: 'Node owns money; the realtime server asks it to settle',
      context:
        'Calls and in-call gifts are observed by the Go hub, which already has its own database ' +
        'connection, but they move balances.',
      choice:
        'Go never changes a wallet. It calls Node’s internal endpoints to settle calls and ' +
        'gifts, authenticated with a dedicated service-to-service secret, kept separate from the ' +
        'key that signs user tokens.',
      why:
        'Gifts can be sent in calls, on profiles and on posts. With one settlement function, ' +
        'none of those paths can drift apart on pricing, the platform share or the ledger.',
      alternatives: [
        'Go writing wallet documents directly',
        'Duplicating settlement logic in both services',
      ],
      tradeoff:
        'An extra network hop on the gift path, and both services must be configured ' +
        'consistently for settlement to work at all.',
    },
    {
      title: 'Put idempotency in the write itself, not in transactions',
      context:
        'A settlement touches two wallets, two ledger rows and a settlement record. The hub ' +
        'retries, several teardown paths can report the same call, and the process can die ' +
        'between any two writes.',
      choice:
        'Each balance change is one conditional update that applies the increment and records ' +
        'the settlement ID in the same document write. Settlements are claimed by a unique ' +
        'billing ID, and ledger rows sit under a partial unique index.',
      why:
        'The deployment isn’t guaranteed to be a replica set, so the atomic unit had to be the ' +
        'document. When the write itself refuses a repeat, a retry, a duplicate report and a ' +
        'crash-then-resume can’t charge twice.',
      alternatives: ['MongoDB multi-document transactions', 'Read-then-write balance updates'],
      tradeoff:
        'Replay protection covers a bounded window of recent settlements per wallet, and every ' +
        'future settlement step must be written idempotently too.',
    },
    {
      title: 'An actor-model hub instead of locks',
      context:
        'Chat, call, live-stream and HTTP paths all read and write the same realtime state.',
      choice:
        'One goroutine owns every hub map. Everything else, including HTTP handlers that need ' +
        'hub state, talks to it over channels. There are no mutexes in the hub.',
      why:
        'Go aborts the whole process on a concurrent map read and write, and recover() can’t ' +
        'catch it. A single owner removes that class of crash entirely, instead of guarding ' +
        'against it site by site.',
      alternatives: ['Mutexes around the shared maps', 'Sharded, per-entity locks'],
      tradeoff:
        'Any blocking work on that goroutine stalls every user, which the next decision had ' +
        'to solve.',
    },
    {
      title: 'Bounded async reads that shed load',
      context:
        'Handlers queried MongoDB inline on the routing goroutine, so one slow query froze ' +
        'delivery for everyone.',
      choice:
        'Reads run on their own goroutines, capped at 256, and post a continuation back to the ' +
        'hub. When the cap is reached a read is shed, and each call site defines what shedding ' +
        'means for it.',
      why:
        'Unbounded goroutines would let one client trigger a goroutine bomb, and the database ' +
        'driver’s pool only runs about 100 queries at once anyway. Waiting for a free slot would ' +
        'deadlock, because slots are released by goroutines waiting on a queue only the hub ' +
        'drains.',
      alternatives: [
        'One unbounded goroutine per read',
        'Blocking until a slot is free',
        'Loading everything up front at connect time',
      ],
      tradeoff:
        'One handler now spans several hub turns, so every continuation must re-check what ' +
        'changed in between: the user may have disconnected, or the call may already be settled.',
    },
    {
      title: 'An ordering gate per conversation, not per sender',
      context:
        'Once lookups became async, an ICE candidate could reach a peer before its offer, and ' +
        'both peers’ first messages could each create a conversation.',
      choice:
        'Messages for a pair of users queue behind that pair’s pending lookup, in arrival ' +
        'order, including messages that already carry a conversation ID.',
      why:
        'The two senders racing are usually the two ends of one conversation, which a ' +
        'per-sender queue would run in parallel. The messages that already have an ID are ' +
        'exactly the ones that would reorder a call.',
      alternatives: ['A per-sender queue', 'Relying on unique-index conflicts alone'],
      tradeoff:
        'Each pair’s queue is bounded; overflow is dropped and logged rather than delivered out ' +
        'of order.',
    },
    {
      title: 'Rank and price creators from the ledger, not from balances',
      context: 'The leaderboard and creator levels need a fair measure of performance.',
      choice:
        'A weekly aggregation over ledger earnings sets each creator’s level, and from it their ' +
        'call price and leaderboard position. In normal operation, that job is the only thing ' +
        'that writes a price.',
      why:
        'A balance falls when a creator cashes out, so ranking by it would push active creators ' +
        'down for withdrawing. The ledger records what they actually earned.',
      alternatives: ['Ranking by wallet balance, as the previous version did'],
      tradeoff: 'Levels and prices are only as fresh as the last weekly run.',
    },
    {
      title: 'In-call gifts settle before they’re shown; calls settle after, with retries',
      context:
        'Both are billable, but a gift is a foreground action with an animation, while a call ' +
        'is time already spent.',
      choice:
        'The hub waits for Node to confirm a gift before either person sees it, and doesn’t ' +
        'retry gifts. Call settlement runs after teardown and retries transient failures.',
      why:
        'Nobody should ever see a gift that wasn’t paid for. A call has already happened, so a ' +
        'dropped settlement is lost revenue that nothing else would recover.',
      alternatives: [
        'Optimistic gift animation with settlement afterwards',
        'Retrying gifts in the background',
      ],
      tradeoff:
        'If the API is unavailable, gifts fail visibly for the sender, and call settlement is ' +
        'only as durable as its retry window.',
    },
  ],

  features: [
    {
      group: 'Calls',
      items: [
        {
          name: 'Paid one-to-one video calls',
          detail:
            'Peer-to-peer WebRTC with server-supplied ICE servers, a relay-only fallback, ' +
            'balance-based warning and cut-off timers, and per-second settlement.',
        },
        {
          name: 'Random matching',
          detail:
            'Matches a caller with an available, opted-in creator they can afford and haven’t ' +
            'been shown yet in the session.',
        },
      ],
    },
    {
      group: 'Chat & presence',
      items: [
        {
          name: 'Realtime chat',
          detail:
            'Sent, delivered and read states, typing indicators, and push notifications when ' +
            'the recipient is offline.',
        },
        {
          name: 'Presence and busy state',
          detail:
            'Online, on a call, streaming or watching, answered by the hub itself so the app ' +
            'and server agree on who can be called.',
        },
        {
          name: 'Clear chat',
          detail:
            'Clearing hides a thread for both people while keeping it available to moderation ' +
            'for a retention period.',
        },
      ],
    },
    {
      group: 'Live',
      items: [
        {
          name: 'Live broadcasts',
          detail:
            'Server support for RTMP-in, HLS-out broadcasts, with live chat, viewer counts and ' +
            'chat replay for late joiners.',
        },
      ],
    },
    {
      group: 'Economy',
      items: [
        {
          name: 'Wallets and a ledger',
          detail:
            'Separate spendable and earned balances, with settled movements recorded in an ' +
            'append-only ledger.',
        },
        {
          name: 'Gifts',
          detail: 'During calls, on profiles and on posts, all through one settlement function.',
        },
        {
          name: 'Creator levels and a weekly leaderboard',
          detail: 'Computed from ledger earnings, and used to set each creator’s call price.',
        },
      ],
    },
    {
      group: 'Operations',
      items: [
        {
          name: 'Single-device sessions',
          detail:
            'A new login disconnects the previous device from the realtime server and bumps a ' +
            'token version that both services check.',
        },
        {
          name: 'Test-gated deploys',
          detail:
            'Both services run their test suites before deploying, and a deploy that restarts ' +
            'nothing fails instead of reporting success.',
        },
        {
          name: 'Structured logging',
          detail:
            'Request IDs, status-based levels and redacted failure bodies in Node; slog in Go.',
        },
      ],
    },
  ],

  challenges: [
    {
      title: 'One slow database read froze the server for everyone',
      problem:
        'The hub routes every message for every user on one goroutine, and handlers queried ' +
        'MongoDB inline: conversation lookups, wallet reads on call setup, chat history on ' +
        'joining a live room. While any of them waited, nothing was delivered, including the ' +
        'timers that end calls.',
      approach:
        'Built an async helper: reads run on a bounded pool and hand continuations back to the ' +
        'hub. The rules are written down: fetches never touch hub state, continuations ' +
        're-check everything they captured, and every caller decides what a shed read means. ' +
        'Database functions sit behind variables so tests can hold a read open.',
      outcome:
        'Tests hold a read open indefinitely and confirm unrelated traffic still routes. Shed ' +
        'reads are counted and reported.',
    },
    {
      title: 'Idempotent settlement across two services',
      problem:
        'The same call can be reported more than once, by retries and by racing teardown ' +
        'paths. A settlement is several writes, the process can die between any two, and ' +
        'multi-document transactions couldn’t be assumed.',
      approach:
        'One billing ID per answered call, never rewritten. Node claims settlements by that ID, ' +
        'resumes pending ones, and applies each balance change as a conditional update that ' +
        'records the ID in the same write, so a replay stops matching. Ledger rows sit under a ' +
        'unique index, with duplicates treated as success.',
      outcome:
        '32 test cases on an in-memory MongoDB cover sequential and concurrent replays, ' +
        'settlements interrupted before and after the caller was charged, and a gift racing a ' +
        'call.',
    },
    {
      title: 'Crashes from concurrent map access',
      problem:
        'Presence broadcasts and HTTP handlers read hub maps from other goroutines while the hub ' +
        'wrote them. Go kills the process when that happens, dropping every connected socket.',
      approach:
        'Moved every map read back onto the hub goroutine. HTTP handlers now submit small ' +
        'closures to the hub with timeouts, and results come back on buffered channels so an ' +
        'abandoned request can’t write into memory it no longer owns.',
      outcome:
        'The whole class of crash is gone by construction, with tests that query the hub while ' +
        'it’s mutating.',
    },
    {
      title: 'One stalled phone blocking the hub',
      problem:
        'Sending to a client blocked when its outbox was full, so one phone on a dead network ' +
        'stopped routing for everyone. Live chat, sent to every viewer, was the worst case.',
      approach:
        'All sends became non-blocking, with drops logged. For the few messages whose loss would ' +
        'leave a phone stuck (a ring that never stops, a call screen that never closes), a failed ' +
        'send closes the socket instead, so the app reconnects and resyncs.',
      outcome:
        'A test confirms routing continues when a recipient stops reading entirely, and ' +
        'critical messages can no longer be silently lost.',
    },
    {
      title: 'Deploys that fail loudly instead of serving stale code',
      problem:
        'Because the backend is an ES module package, the process manager silently loaded no ' +
        'apps from its config, so a deploy could “succeed” while restarting nothing.',
      approach:
        'A CommonJS process config, a workflow that type-checks and runs the tests before ' +
        'touching the server, a check that the app appears in the process manager after ' +
        'restart, and the boot log printed at the end of every deploy.',
      outcome:
        'A broken deploy now fails the pipeline, and the boot log shows startup checks on every ' +
        'release.',
    },
  ],

  metrics: [
    {
      value: '172',
      label: 'Backend test cases, in test files I wrote',
      kind: 'count',
      note: 'Vitest, with the database suites on an in-memory MongoDB.',
    },
    { value: '32', label: 'Of those, on call billing alone', kind: 'count' },
    { value: '61', label: 'Go test functions in the realtime server', kind: 'count' },
  ],

  stack: [
    { group: 'Node service', items: ['Node.js', 'Express 5', 'TypeScript', 'Mongoose', 'node-cron', 'winston'] },
    { group: 'Go service', items: ['Go 1.25', 'gorilla/websocket', 'golang-jwt', 'log/slog'] },
    { group: 'Media', items: ['WebRTC', 'RTMP', 'FFmpeg', 'HLS'] },
    { group: 'Data & messaging', items: ['MongoDB', 'Firebase Cloud Messaging'] },
    { group: 'Mobile', items: ['React Native', 'Redux Toolkit', 'RTK Query', 'react-native-webrtc'] },
    { group: 'Delivery & testing', items: ['GitHub Actions', 'pm2', 'Vitest', 'go test'] },
  ],
  links: [],
  gallery: [],

  openQuestions: [
    'Does the client allow naming Fliptoe and describing how it works (paid calls, gifts, random matching)? The page shows no prices, rates or thresholds.',
    'Is the app live on Google Play or the App Store? A store link would help, if allowed.',
    'Any usage you can share, like concurrent connections or calls per day? The repos have none. Were the WebSocket load-test tools ever run?',
    'Why was realtime split into a separate Go service? It isn’t written down anywhere, and it’s the first thing an interviewer will ask.',
    'Is live broadcasting used by the current app build? The server supports it, but publishing is stubbed on the app branch I read.',
    'Many recent commits carry a Claude co-author trailer. Do you want AI-assisted development mentioned, and how?',
    'Is “Ongoing” the right status, or should it say the platform is in production?',
  ],

  seo: {
    title: 'Fliptoe — case study',
    description:
      'Designing idempotent call and gift settlement across a Go realtime hub and a Node.js ' +
      'system of record, and keeping one goroutine routing for every user.',
  },
};
