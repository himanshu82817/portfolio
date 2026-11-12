import { Block } from '../post.model';

export const BODY: Block[] = [
  {
    kind: 'paragraph',
    text: 'Reminders were the first feature in LifeBoard that had to happen while nobody was looking. Until then, everything that looked like a background job had been done lazily, in the read path: abandoned focus sessions are closed when someone next loads them. If a thing only matters when somebody looks, it does not need a cron.',
  },
  {
    kind: 'paragraph',
    text: 'A reminder is the one case that reasoning does not cover. Its whole purpose is to matter while the app is closed.',
  },
  {
    kind: 'paragraph',
    text: 'The obvious implementation is a `setInterval` that checks every minute for reminders that have come due. It works on a laptop. On Cloud Run it fails quietly, and working out why shaped the whole design.',
  },
  { kind: 'heading', level: 2, text: 'Why the timer fails' },
  {
    kind: 'paragraph',
    text: 'Cloud Run bills for CPU while a request is being handled. Two consequences follow:',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      '**Between requests, the instance\'s CPU is throttled.** A timer callback is not a request. Ticks run late or not at all.',
      '**An idle service scales to zero.** The container is gone, and the timer goes with it.',
    ],
  },
  {
    kind: 'paragraph',
    text: 'So an in-process timer fires reliably only while the service happens to be busy, which is exactly when users are already in the app and need a reminder least. At 3 a.m., with nobody online, nothing fires.',
  },
  {
    kind: 'paragraph',
    text: 'There is no error and no failed job to look at. The reminders simply never arrive.',
  },
  { kind: 'heading', level: 2, text: 'Drive it from outside' },
  {
    kind: 'paragraph',
    text: 'A request from outside is the one thing that reliably wakes an instance and holds CPU while it works. So the clock moved out of the process: Cloud Scheduler calls an endpoint once a minute.',
  },
  {
    kind: 'code',
    language: 'ts',
    code: `@Public()                      // not a user route...
@UseGuards(SweepTriggerGuard)  // ...but not an open one either
@Post('sweep')
async sweep(): Promise<SweepResult> {
  const result = await this.scheduler.sweepNow();
  if (result.outcome === 'failed') {
    throw new ServiceUnavailableException('The reminder sweep failed; see the server log');
  }
  return result;
}`,
  },
  {
    kind: 'paragraph',
    text: 'Two details in those few lines carry weight.',
  },
  {
    kind: 'paragraph',
    text: '**The sweep is awaited before the response is sent.** It would be natural to answer `202 Accepted` and do the work afterwards. That would put the work back on a throttled CPU, which is the exact problem the endpoint exists to solve. The request stays open for as long as the sweep runs.',
  },
  {
    kind: 'paragraph',
    text: '**A failed sweep fails the request.** "Nothing was due" and "the sweep threw" are opposite answers. If both returned 200, Cloud Scheduler would show a row of green ticks beside reminders that never came.',
  },
  { kind: 'heading', level: 2, text: 'Who is allowed to call it' },
  {
    kind: 'paragraph',
    text: 'This endpoint has no user behind it, so the normal JWT guard does not apply. It still must not be public: anyone who could call it could make the service do database work on demand.',
  },
  {
    kind: 'paragraph',
    text: 'Cloud Scheduler can attach a Google-signed OIDC token to each call, minted as a service account. The guard verifies it in three steps:',
  },
  {
    kind: 'list',
    ordered: true,
    items: [
      'The signature and audience are valid (`verifyIdToken`).',
      'The issuer is Google.',
      '**The token\'s email is the one service account we expect, and Google marks it verified.**',
    ],
  },
  {
    kind: 'paragraph',
    text: 'The third check is the one that matters, and it is easy to leave out. Verifying the signature and audience proves that Google signed a token meant for this service. It says nothing about *who* asked for it. Anyone with a Google account can mint an ID token for any audience they like:',
  },
  {
    kind: 'code',
    language: 'bash',
    code: `gcloud auth print-identity-token --audiences=https://your-api.example.com`,
  },
  {
    kind: 'paragraph',
    text: 'An audience check without an identity check is an open door with a Google logo on it.',
  },
  {
    kind: 'paragraph',
    text: 'The guard also returns distinct statuses, because the person reading them will be looking at a failed run in the Cloud Scheduler console:',
  },
  {
    kind: 'table',
    head: ['Status', 'Meaning'],
    rows: [
      ['503', 'this server was never configured for the trigger'],
      ['401', 'the token is missing, expired, for the wrong audience, or not Google\'s'],
      ['403', 'a perfectly good token from the wrong account'],
    ],
  },
  {
    kind: 'paragraph',
    text: 'Unconfigured, it refuses everything. A laptop cannot be made to sweep.',
  },
  { kind: 'heading', level: 2, text: 'Exactly once, with more than one instance' },
  {
    kind: 'paragraph',
    text: 'Cloud Run can run several instances, and a deploy briefly runs old and new side by side. Two of them can sweep the same minute. A reminder that buzzes twice is a bug the user feels immediately.',
  },
  {
    kind: 'paragraph',
    text: 'There is no lock and no leader election. The guarantee comes from a unique index:',
  },
  {
    kind: 'code',
    language: 'ts',
    code: `NotificationSchema.index({ userId: 1, itemId: 1, remindAt: 1 }, { unique: true });`,
  },
  {
    kind: 'paragraph',
    text: 'Each sweep does three things in a fixed order:',
  },
  {
    kind: 'list',
    ordered: true,
    items: [
      '**Find** what has come due.',
      '**Record** each firing as a notification row, in one unordered bulk insert.',
      '**Push** only the rows this instance managed to insert.',
    ],
  },
  {
    kind: 'paragraph',
    text: 'If two instances race, the index lets one insert through and refuses the other. A refused row is one another instance recorded first; it is theirs to push. The insert is unordered so that one refused row does not stop the rest of the batch.',
  },
  {
    kind: 'paragraph',
    text: 'One smaller detail made this work: the sweep generates each row\'s `_id` itself instead of reading it back from the driver. A partially failed bulk insert reports errors by position, not the documents that survived, and the push needs to name the row it belongs to either way.',
  },
  { kind: 'heading', level: 2, text: 'The cost of record-then-push' },
  {
    kind: 'paragraph',
    text: 'Recording before pushing gives at-most-once delivery. The alternative, push then record, gives at-least-once: a crash between the two steps means the next sweep pushes again. For a reminder, a duplicate buzz is worse than a rare miss, since the reminder is still listed in the app either way.',
  },
  {
    kind: 'paragraph',
    text: 'But it leaves a gap. If the process dies after recording and before pushing, that push is gone for good. The row exists, so no later sweep will retry it.',
  },
  {
    kind: 'paragraph',
    text: 'That gap is small in normal operation and wide open during a deploy, because Cloud Run sends SIGTERM and kills the container ten seconds later. Two things close it:',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      '**Shutdown hooks are enabled.** Without `app.enableShutdownHooks()`, NestJS never hears SIGTERM and no `onModuleDestroy` runs. The drain logic below would be dead code.',
      '**Shutdown waits for a sweep in flight**, for up to eight seconds: inside Cloud Run\'s ten, and matched to the per-delivery push timeout so a batch that has started sending gets its answers back.',
    ],
  },
  {
    kind: 'code',
    language: 'ts',
    code: `async onModuleDestroy(): Promise<void> {
  if (this.timer) clearInterval(this.timer);
  const sweep = this.inFlight;
  if (!sweep) return;                       // the ordinary case costs nothing
  await Promise.race([sweep, timeout(DRAIN_MS)]);
}`,
  },
  {
    kind: 'paragraph',
    text: 'The same `inFlight` promise also prevents overlap on a single instance: if a sweep is still running when the next trigger arrives, the endpoint answers `skipped` instead of starting a second writer for the same minute.',
  },
  { kind: 'heading', level: 2, text: 'Whose nine o\'clock?' },
  {
    kind: 'paragraph',
    text: 'A reminder in LifeBoard is stored as a civil time: "the 15th at nine", not an instant. That is the right model for a journal, since it should stay nine o\'clock if you travel, but the server now has to answer whose nine o\'clock it is.',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      'Each user\'s timezone is stored in their preferences, and the sweep converts civil time to an instant per user, using `Intl` so daylight-saving changes are handled without an offset table.',
      'The candidate query runs on the civil string, because that is what is indexed and those strings sort correctly. Its upper bound is widened by 14 hours, the furthest any zone runs ahead of UTC. Somewhere it is already tomorrow, so a reminder dated tomorrow can be due now. One query covers every account.',
      'A reminder with a date and no time fires at 9 a.m. local. Midnight is the literal reading and the wrong one: it arrives while you are asleep and is stale by morning.',
    ],
  },
  { kind: 'heading', level: 2, text: 'Late is different from stale' },
  {
    kind: 'paragraph',
    text: 'Suppose the scheduler is down for four hours. When it comes back, should everyone get every reminder they missed, all at once?',
  },
  {
    kind: 'paragraph',
    text: 'No. Fifteen minutes late is a reminder; four hours late is an interruption about the past. So recording and pushing have different horizons:',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      'Everything that came due is **recorded**, and shows in the in-app notification list.',
      'Only firings less than **15 minutes** late are **pushed**.',
      'The sweep looks back at most **48 hours**, so a long outage cannot resurface reminders from weeks ago.',
    ],
  },
  { kind: 'heading', level: 2, text: 'Buttons that work with no app open' },
  {
    kind: 'paragraph',
    text: 'A push notification carries Snooze and Done buttons. They are handled by the service worker, which runs with no app open and so has no login token. It can only fetch a plain URL.',
  },
  {
    kind: 'paragraph',
    text: 'So the link has to carry its own authority: an HMAC over the notification id, the action and an expiry.',
  },
  {
    kind: 'list',
    ordered: false,
    items: [
      'It can snooze or complete **one** reminder and nothing else.',
      'It expires after a week, which bounds what a leaked link is worth.',
      'Its key is derived from the JWT secret under its own label, so a token of one kind can never be replayed as the other.',
    ],
  },
  { kind: 'heading', level: 2, text: 'The laptop that ate production\'s reminders' },
  {
    kind: 'paragraph',
    text: 'One failure mode I would not have predicted. A development machine pointed at a shared database, with the in-process timer running, can win the race to record a reminder. It then pushes with the laptop\'s push keys, which the browser\'s subscription was never made with. The push service refuses it, and nothing retries a reminder that is already recorded. The only trace is a log line on somebody\'s laptop.',
  },
  {
    kind: 'paragraph',
    text: 'So the timer\'s default is decided by `K_SERVICE`, a variable Cloud Run injects into every container and nobody sets by hand, and not by `NODE_ENV`, which is easy to get wrong in the direction that hurts. Off Cloud Run, the default is not to sweep. An explicit setting overrides it either way, a typo in that setting fails at boot, and every process logs at startup whether it is sweeping and why.',
  },
  { kind: 'heading', level: 2, text: 'What this does not do' },
  {
    kind: 'list',
    ordered: false,
    items: [
      '**It is at-most-once.** A hard crash between record and push still loses that push. The drain makes it rare; it does not make it impossible.',
      '**Resolution is one minute.** That is fine for a journal and would not be for a trading alert.',
      '**Each sweep is a query, not a queue.** It finds due reminders by scanning an indexed range every minute. At much larger volume I would move to per-reminder scheduled tasks (Cloud Tasks) or partition the sweep.',
      '**Web Push depends on the browser and OS.** A delivered push is not a seen notification, and iOS only allows it for an installed web app.',
    ],
  },
  { kind: 'heading', level: 2, text: 'What I would tell someone doing this' },
  {
    kind: 'list',
    ordered: true,
    items: [
      '**On a serverless platform, time has to come from outside.** If it must happen when nobody is calling you, something has to call you.',
      '**Hold the request open while you work.** Answering early hands your work back to a throttled CPU.',
      '**Check who the token belongs to, not only who signed it.**',
      '**Let the database decide the race.** A unique index is a simpler exactly-once guarantee than any lock you will write.',
      '**Choose your delivery guarantee on purpose**, then close the gap it leaves. Here that meant shutdown hooks and a drain window.',
      '**Make every process say at boot what it is doing.** "Reminders stopped" with a reason on the first page of the logs is a five-minute fix; without one it is an afternoon.',
    ],
  },
];
