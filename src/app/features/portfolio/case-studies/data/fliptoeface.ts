import { CaseStudy } from '../case-study.model';

/**
 * Written from a read of FliptoeFace and its integration in the Fliptoe app, then
 * fact-checked claim by claim against the code (Sep 2026). Published Nov 2026 on
 * the owner's decision.
 *
 * Deliberately left out: repository links (they sit under the client's account),
 * colleague names, the host app's configuration details, and the build artefact.
 */
export const FLIPTOEFACE: CaseStudy = {
  slug: 'fliptoeface',
  name: 'FliptoeFace',
  tagline:
    'A React Native SDK for real-time face tracking and face effects, rendered natively and ' +
    'locked to the camera frame, with no per-frame data crossing the JS bridge.',
  kind: 'React Native SDK',
  engagement: 'contract',
  status: { label: 'Android · integrating', tone: 'beta' },
  period: 'Jul 2026 – present',
  role: 'Sole engineer',
  platforms: ['Android', 'React Native (New Architecture)'],
  cover: {
    src: '/case-studies/fliptoeface/cover.svg',
    alt: 'Abstract illustration of a triangulated face mesh with landmark contours and effect sliders',
  },
  published: true,

  confidentiality:
    'Built during a client engagement. The SDK’s design is shared in full here; the source ' +
    'code and the host app aren’t public.',

  summary: [
    'FliptoeFace is a native face-effects pipeline exposed to React Native through two small ' +
      'surfaces: a VisionCamera camera output created through Nitro Modules, and a Fabric view ' +
      'driven only by props. Everything per-frame, from 478-landmark face tracking to morphs, ' +
      'skin smoothing, rendering and recording, happens in Kotlin and OpenGL ES 3.',
    'I designed and wrote all of it. In an integration branch of the client’s app, the same ' +
      'compositor runs inside react-native-webrtc’s capture pipeline, which is how the effects ' +
      'reach the other person in a one-to-one video call, not just the local preview.',
    'It runs on Android only today. The effects core is plain Kotlin with no Android imports, ' +
      'written so it can be ported to iOS.',
  ],
  problem: [
    'The obvious design, a camera preview with a mesh overlay drawn on top, makes the mesh trail ' +
      'the face by however long analysis takes. The goal was the opposite: a mesh locked to the ' +
      'image, at 30fps on mid-range Android, with end-to-end latency under 90ms at p95.',
    'Effects raised the bar further. Several morphs have to combine without GPU cost growing per ' +
      'effect, recording can’t be allowed to stall the live preview, and in a video call the ' +
      'processed frames have to live inside someone else’s capture pipeline without ever owning ' +
      'the camera.',
  ],
  ownership: {
    statement:
      'Sole engineer. I designed the architecture, wrote the SDK and its design documents, and ' +
      'built its integration into the client’s app, including the in-call processor and the ' +
      'Filters experience.',
  },

  architecture: {
    overview: [
      'CameraX delivers 640×480 frames on one analyzer thread. Each frame is kept at full ' +
        'resolution for display, and a small copy goes to MediaPipe. When landmarks come back ' +
        'they’re paired with the exact frame they came from, smoothed, displaced by the active ' +
        'morphs, and published together as one immutable frame.',
      'The GL thread draws that frame: the camera image as background, then a single warp draw ' +
        'whose positions are the displaced landmarks and whose texture coordinates are the ' +
        'originals, then a lip-tint pass. Because the image and its landmarks come from the same ' +
        'instant, the mesh is aligned by construction, with no prediction needed.',
      'Recording and calls are extra render targets for the same composite. An encoder thread ' +
        'with its own EGL context in the renderer’s share group feeds MediaCodec, and in calls a ' +
        'video-frame processor rewrites each outgoing frame on the GPU and hands it back to ' +
        'libwebrtc.',
    ],
    diagram: {
      caption: 'FliptoeFace: one frame, one set of landmarks, composited to every output',
      nodes: [
        { id: 'js', label: 'RN app', sublabel: 'Props & setters', tier: 'client' },
        { id: 'output', label: 'Camera output', sublabel: 'Nitro · CameraX', tier: 'edge', ownership: 'built' },
        { id: 'detector', label: 'Frame detector', sublabel: 'Timestamp pairing', tier: 'service', ownership: 'built' },
        { id: 'core', label: 'Effects core', sublabel: 'Deformers · One-Euro', tier: 'service', ownership: 'built' },
        { id: 'gl', label: 'GL compositor', sublabel: 'Warp + lip tint', tier: 'service', ownership: 'built' },
        { id: 'enc', label: 'Encoder thread', sublabel: 'Share-group EGL', tier: 'service', ownership: 'built' },
        { id: 'vproc', label: 'Call processor', sublabel: 'libwebrtc frame seam', tier: 'service', ownership: 'built' },
        { id: 'bus', label: 'Landmark bus', sublabel: 'Immutable frames', tier: 'data', ownership: 'built' },
        { id: 'mp4', label: 'MP4 file', sublabel: 'H.264 + AAC', tier: 'data' },
        { id: 'mediapipe', label: 'MediaPipe', sublabel: '478 landmarks', tier: 'external' },
        { id: 'peer', label: 'Remote peer', sublabel: 'via libwebrtc', tier: 'external' },
      ],
      edges: [
        { from: 'js', to: 'output', label: 'create' },
        { from: 'output', to: 'detector', label: 'frames' },
        { from: 'detector', to: 'mediapipe', label: 'small copy' },
        { from: 'mediapipe', to: 'detector', label: 'landmarks' },
        { from: 'detector', to: 'core' },
        { from: 'core', to: 'bus', label: 'publish' },
        { from: 'bus', to: 'gl', label: 'latest' },
        { from: 'gl', to: 'enc' },
        { from: 'enc', to: 'mp4', label: 'MediaCodec' },
        { from: 'js', to: 'vproc', label: 'effects' },
        { from: 'vproc', to: 'mediapipe', label: 'inference' },
        { from: 'vproc', to: 'peer', label: 'frames' },
      ],
    },
    components: [
      {
        name: 'Camera output',
        tech: 'Nitro Modules · VisionCamera 5 · CameraX',
        responsibility:
          'The JavaScript entry point. It returns a camera output to pass to VisionCamera, ' +
          'capturing 640×480 RGBA with auto-exposure pinned to 30fps.',
        ownership: 'built',
      },
      {
        name: 'Frame detector',
        tech: 'Kotlin · MediaPipe Face Landmarker',
        responsibility:
          'Copies each frame into a pooled buffer, sends a small copy for inference on the GPU ' +
          'delegate with a CPU fallback, and pairs every result with its source frame by ' +
          'timestamp.',
        ownership: 'built',
      },
      {
        name: 'Effects core',
        tech: 'Plain Kotlin · JUnit',
        responsibility:
          'Each morph is a pure deformer that adds per-landmark offsets. A composer sums them ' +
          'and clamps the result, after One-Euro smoothing. No Android imports.',
        ownership: 'built',
      },
      {
        name: 'Landmark bus',
        tech: 'Lock-free handoff',
        responsibility:
          'Passes immutable frames from the inference thread to the GL thread, and owns the pool ' +
          'that recycles multi-megabyte pixel buffers safely between them.',
        ownership: 'built',
      },
      {
        name: 'GL compositor',
        tech: 'OpenGL ES 3.0 · GLSL',
        responsibility:
          'Draws the camera image, one warp pass with skin smoothing gated by per-vertex ' +
          'weights, a separate lip tint over its own ring mesh, and an optional wireframe.',
        ownership: 'built',
      },
      {
        name: 'Recording egress',
        tech: 'EGL share group · MediaCodec · MediaMuxer',
        responsibility:
          'Encodes the composite to MP4, H.264 with optional AAC, on its own thread, dropping ' +
          'recorded frames under pressure instead of freezing the preview.',
        ownership: 'built',
      },
      {
        name: 'In-call processor',
        tech: 'react-native-webrtc video-frame processor',
        responsibility:
          'Rewrites each outgoing call frame on the GPU inside libwebrtc’s capture pipeline, ' +
          'with a retirement handshake so teardown never races frames still in flight.',
        ownership: 'built',
      },
    ],
    flows: [
      {
        name: 'Camera frame to a frame-locked render',
        steps: [
          'The analyzer thread receives a 640×480 frame and stamps its arrival time.',
          'The frame is copied into a buffer reclaimed from the pool, and a small copy goes to MediaPipe with a strictly increasing timestamp.',
          'On MediaPipe’s result thread, the landmarks are paired with their stashed source frame, smoothed and rotated upright.',
          'The effects composer displaces them, and pixels, original landmarks and displaced landmarks are published together as one immutable frame.',
          'The GL thread uploads only frames it hasn’t drawn, then returns the previous buffer to the pool, giving the handoff a real happens-before edge.',
          'The composite is drawn, and end-to-end latency from arrival to render is tracked at p50 and p95.',
        ],
      },
      {
        name: 'Effects in a video call',
        steps: [
          'The look is tuned beforehand on a Filters screen, previewed through the same processor a call uses, and saved.',
          'When a call starts, the app enables the processor on the local video track, once per track.',
          'For each captured frame, on libwebrtc’s capture thread, the processor copies the camera texture using libwebrtc’s own context.',
          'It switches to its own ES3 context in the same share group, reads back a small frame, and runs inference on it synchronously.',
          'The compositor renders the effects into an upright output texture, handed to libwebrtc with the original timestamp. Any failure forwards the untouched frame instead.',
          'There are no in-call controls: the processor is attached once and never detached mid-call.',
        ],
      },
      {
        name: 'Recording without blocking the preview',
        steps: [
          'Starting a recording creates a small pool of offscreen textures and an encoder thread sharing the renderer’s GL objects.',
          'For each new frame, the GL thread tries to take a free texture without waiting. If none is free, that recorded frame is dropped.',
          'It draws the composite into the texture and attaches a GPU fence before handing it over.',
          'The encoder thread waits on the fence, blits to the codec’s input surface and swaps. Only this thread ever blocks.',
          'Video and audio are stamped against one capture clock, and the muxer buffers until both tracks are ready.',
        ],
      },
    ],
  },

  decisions: [
    {
      title: 'Draw the camera frame myself, instead of overlaying a preview',
      context:
        'The first design ran the camera preview with a mesh overlay beside it, so the mesh ' +
        'trailed the image by the full analysis latency.',
      choice:
        'One analysis stream. Each frame is kept for display and published together with its ' +
        'landmarks, and an opaque GL surface draws both.',
      why:
        'The mesh is aligned because both come from the same frame, so no motion prediction is ' +
        'needed to hide lag.',
      alternatives: ['A camera preview plus a separate overlay', 'Motion prediction to compensate'],
      tradeoff:
        'A CPU copy of every frame is now required, and what’s displayed is delayed by the ' +
        'analysis latency rather than overlaid on a live preview.',
    },
    {
      title: 'An ownership handshake for pixel buffers, not a timing guess',
      context:
        'Multi-megabyte frame buffers are reused between the inference threads and the GL thread.',
      choice:
        'The GL thread returns a buffer to the pool only after it has uploaded a newer frame, and ' +
        'the producer only ever writes buffers it has reclaimed from that pool.',
      why:
        'The previous “recycle it a few frames later” heuristic was an unsynchronised data race. ' +
        'Handing buffers back through the queue creates a real happens-before edge.',
      alternatives: ['Recycling buffers after a fixed number of frames'],
      tradeoff:
        'The pool can be momentarily empty, forcing a fresh allocation, and the GL thread always ' +
        'holds one buffer.',
    },
    {
      title: 'No per-frame data across the JS bridge',
      context:
        'Sending landmarks or pixels to JavaScript every frame would add latency and jank.',
      choice:
        'Inference runs in a native camera output, and the view only receives props when they ' +
        'change. The two sides meet through native singletons.',
      why:
        'The per-frame path stays entirely native, and JavaScript is only involved when a setting ' +
        'actually changes.',
      alternatives: ['Passing landmark or pixel data to JavaScript each frame'],
      tradeoff:
        'There’s no imperative API or event stream yet: recording is a boolean prop, and metrics ' +
        'only reach the device log.',
    },
    {
      title: 'Every morph composes into one warp draw',
      context:
        'Nose, eye and lip morphs have to combine without GPU cost growing per effect.',
      choice:
        'Each morph is a pure Kotlin function adding per-landmark offsets. They’re summed, ' +
        'clamped, and rendered in a single textured draw: positions displaced, texture ' +
        'coordinates original.',
      why:
        'N morphs cost the same GPU time as one, and a new morph is a single JVM-testable Kotlin ' +
        'file with no GL changes.',
      alternatives: ['One GL pass per effect'],
      tradeoff:
        'CPU work grows with morphs × landmarks, and warp resolution is limited to the mesh ' +
        'vertices.',
    },
    {
      title: 'Encode on a separate EGL thread with fenced, non-blocking slots',
      context:
        'Swapping buffers into a video encoder’s surface blocks when the encoder falls behind. On ' +
        'the GL thread, that would freeze the live preview.',
      choice:
        'The GL thread composites into pooled textures and hands them over behind GPU sync ' +
        'fences. A separate encoder thread waits, blits and swaps. Taking a slot never waits; a ' +
        'busy slot is a dropped recorded frame.',
      why:
        'Back-pressure should degrade the recording, never the display. Fences are the GPU ' +
        'equivalent of the CPU buffer handshake.',
      alternatives: [
        'Encoding on the render thread',
        'A self-managed EGL render thread in place of GLSurfaceView',
      ],
      tradeoff:
        'Recorded frames drop under load, and a recording is abandoned if the GL context is lost.',
    },
    {
      title: 'Integrate calls through react-native-webrtc’s frame processor',
      context:
        'Effects had to appear for the remote person in one-to-one calls, not just in the local ' +
        'preview.',
      choice:
        'A processor registered with react-native-webrtc rewrites frames inside libwebrtc’s own ' +
        'capture pipeline and returns GPU textures.',
      why:
        'libwebrtc keeps ownership of the camera. A custom capturer would fight the SDK for it, ' +
        'and Android camera devices are exclusive.',
      alternatives: [
        'A custom video capturer fed by the SDK’s own camera',
        'An SDK-owned WebRTC stack or WHIP publishing',
      ],
      tradeoff:
        'It depends on a private react-native-webrtc API and its internals, and runs at the ' +
        'call’s capture rate rather than 30fps.',
    },
    {
      title: 'Synchronous inference in calls, reversing async plus prediction',
      context:
        'The call processor first used asynchronous results plus velocity extrapolation, to avoid ' +
        'holding frames and adding mouth-to-ear delay.',
      choice:
        'Inference runs inline on the capture thread, so each frame composites with its own ' +
        'landmarks. A stall guard skips inference when it gets slow, and prediction bridges the ' +
        'skipped frames.',
      why:
        'On-device telemetry showed inference taking about 30ms against a camera delivering ' +
        'about 10fps. Async results were always one frame interval stale, so effects visibly ' +
        'trailed the face.',
      alternatives: [
        'Async inference with forward prediction',
        'Holding frames until their landmarks arrive',
      ],
      tradeoff:
        'The capture thread blocks for the duration of inference, so a slow model delays capture ' +
        'up to the guard’s threshold.',
    },
  ],

  features: [
    {
      group: 'Tracking',
      items: [
        {
          name: '478-landmark face tracking',
          detail:
            'MediaPipe Face Landmarker on the GPU delegate with a CPU fallback, One-Euro ' +
            'smoothing, and a short grace window when the face is lost.',
        },
        {
          name: 'Frame-locked rendering',
          detail:
            'The camera image and its mesh are drawn from the same frame, with an optional ' +
            'debug wireframe.',
        },
      ],
    },
    {
      group: 'Effects',
      items: [
        {
          name: 'Geometry morphs',
          detail:
            'Nose width, eye size and lip fullness, each along its own anatomical axis with a ' +
            'smooth falloff. Face slimming exists on the integration branch.',
        },
        {
          name: 'Skin smoothing',
          detail:
            'Frequency-separation smoothing at quarter resolution, gated to skin so eyes, brows ' +
            'and lips stay sharp.',
        },
        {
          name: 'Lip tint',
          detail:
            'A dedicated pass over the lip ring mesh, so colour never bleeds onto skin or teeth.',
        },
      ],
    },
    {
      group: 'Outputs',
      items: [
        {
          name: 'MP4 recording',
          detail: 'H.264 with optional AAC, timestamped against the capture clock.',
        },
        {
          name: 'Effects in video calls',
          detail:
            'The composite replaces outgoing call video on Android, tuned once on a Filters ' +
            'screen and applied automatically to every call. Not yet merged into the app’s main ' +
            'branch.',
        },
      ],
    },
    {
      group: 'Planned',
      items: [
        { name: 'iOS', detail: 'The effects core was written without Android imports so it can be ported.' },
        {
          name: 'Live streaming egress',
          detail: 'RTMP and WHIP publishing, designed in full but not yet built.',
        },
        {
          name: 'Standalone package',
          detail: 'Extracting the SDK into a library module that apps depend on, rather than copy.',
        },
      ],
    },
  ],

  challenges: [
    {
      title: 'The mesh trailing the camera',
      problem:
        'With the preview and the mesh overlay as separate streams, the mesh lagged the face by ' +
        'the whole analysis pipeline.',
      approach:
        'Moved to a single stream: the GL surface uploads the exact frame MediaPipe analysed and ' +
        'draws it under the mesh, paired by timestamp. Capture was fixed at 640×480 with ' +
        'auto-exposure pinned to 30fps.',
      outcome:
        'The mesh is locked to the image, recorded at about 30fps with p95 end-to-end latency ' +
        'around 62ms, against a 90ms budget.',
    },
    {
      title: 'A native crash minutes into a call',
      problem:
        'The proof-of-concept processor, built to confirm react-native-webrtc’s frame hook would ' +
        'work at all, crashed deep inside libwebrtc’s encoder thread six or seven minutes into a ' +
        'call, with a stack trace nowhere near the cause.',
      approach:
        'Traced three compounding bugs: returning the input frame from an error path released it ' +
        'twice, a converted frame buffer leaked whenever an exception was thrown, and a plane ' +
        'copy assumed matching row strides.',
      outcome:
        'All three fixed on the spike. The production processor follows the same rule from the ' +
        'start: on any failure, hand back nothing and let libwebrtc forward the original frame.',
    },
    {
      title: 'Crash on the second effects toggle',
      problem:
        'Toggling effects built a new processor and destroyed the old one immediately, while the ' +
        'encoder still held frames that needed the old processor’s resources.',
      approach:
        'A retirement handshake: a counter covers every in-flight call and every unreleased output ' +
        'frame, and teardown runs once, only when the processor is retired and the count reaches ' +
        'zero. Separately, the app stopped attaching and detaching the processor mid-call ' +
        'altogether.',
      outcome:
        'Every crash seen in development had happened at that attach/detach transition, and the ' +
        'design now avoids it during a call entirely.',
    },
    {
      title: 'An ES3 compositor inside an ES2 capture pipeline',
      problem:
        'libwebrtc’s capture thread runs OpenGL ES 2, while every SDK shader is ES 3. Sampling the ' +
        'camera texture across the version boundary returned black on several Adreno GPUs, with ' +
        'no GL error.',
      approach:
        'Do the one camera-texture blit on libwebrtc’s own context with its own drawer, then ' +
        'switch to a dedicated ES3 context in the same share group for compositing. Build the ' +
        'YUV converter synchronously on its own thread, and flush before every cross-context ' +
        'handoff.',
      outcome:
        'The processor returns texture frames the encoder can consume, and the pipeline stays on ' +
        'the GPU apart from one small readback for inference.',
    },
    {
      title: 'Face slimming revealing the face behind it',
      problem:
        'A forward warp only draws over its own silhouette, so pulling the face outline inward ' +
        'exposed the original face along a hard, aliased edge.',
      approach:
        'Found the true mesh boundary by walking edges that belong to exactly one triangle, then ' +
        'added a ring of zero-displacement vertices outside it, wide enough to exceed the ' +
        'maximum slim, drawn in the same call.',
      outcome:
        'The silhouette is clean, and the vacated area is filled by pixels stretching across ' +
        'the band.',
    },
  ],

  metrics: [
    {
      value: '~62ms',
      label: 'End-to-end latency at p95, from frame arrival to render',
      kind: 'measured',
      note: 'Recorded at about 30fps during development; the test device isn’t noted.',
    },
    { value: '<90ms', label: 'The p95 latency budget it was designed to', kind: 'target' },
    { value: '478', label: 'Face landmarks tracked per frame, entirely in native code', kind: 'count' },
  ],

  stack: [
    {
      group: 'React Native',
      items: ['New Architecture', 'Nitro Modules', 'Fabric', 'VisionCamera 5', 'react-native-webrtc'],
    },
    { group: 'Android', items: ['Kotlin', 'CameraX', 'MediaPipe Tasks Vision', 'C++ (JNI)', 'CMake'] },
    { group: 'Graphics', items: ['OpenGL ES 3.0', 'GLSL', 'EGL share groups', 'GL sync fences'] },
    { group: 'Media', items: ['MediaCodec', 'MediaMuxer', 'H.264', 'AAC'] },
    { group: 'Testing & tooling', items: ['JUnit', 'Python (mesh table generator)'] },
  ],
  links: [],
  gallery: [],

  // Published Nov 2026. Questions that were still open at that point, kept
  // here so they are not lost:
  //  - The ~62ms p95 figure comes from a single line in a design note that doesn’t name a device. Which device was it, and are there logs? I’d like to show the device next to the number.
  //  - The newest SDK code (face slim, the extracted compositor, the in-call processor) exists only in the copy inside the client’s app, on an unmerged branch. Is that the right source to describe, and has the in-call work shipped?
  //  - Was it confirmed on a second device that the other person actually sees the effects?
  //  - Most FaceMesh commits carry a Claude co-author trailer. Do you want AI-assisted development mentioned, and how?
  //  - Keep the name FliptoeFace, or present it under a neutral name like “FaceMesh SDK”?
  //  - Are iOS, a published package, and RTMP/WHIP streaming still planned?
  //  - A short screen recording of the Filters preview would make this page. Can you capture one?
  openQuestions: [],

  seo: {
    title: 'FliptoeFace — case study',
    description:
      'A React Native SDK for real-time face effects: MediaPipe tracking, a single-draw OpenGL ' +
      'warp locked to the camera frame, recording, and effects inside WebRTC calls.',
  },
};
