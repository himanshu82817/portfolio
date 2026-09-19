/**
 * A live, gravitationally-lensed black hole for the dark-theme backdrop.
 *
 * Framework-free on purpose: this file owns the WebGL context and nothing else.
 * BackdropComponent owns the canvas element, the pointer listeners and the
 * requestAnimationFrame loop, and talks to us through `BlackHoleHandle`. That
 * split is what lets the same renderer be dropped behind a page, a hero, or a
 * standalone test harness without dragging the framework along.
 *
 * WHY analytic lensing instead of a raymarcher: this canvas sits behind body
 * copy on a portfolio, including on phones. A raymarched Kerr metric is the
 * usual way to get this image and it is far too expensive to run under text.
 * Every photon path here is closed-form (see `diskAt`), so the whole frame is
 * one full-screen triangle with no texture reads and one three-step loop.
 *
 * WHY the star field never twinkles: the disk is the only thing that moves.
 * A backdrop that shimmers under every paragraph is the screensaver failure
 * mode; confining motion to the object keeps the page calm to read.
 */

export interface BlackHoleOptions {
  /** Normalised viewport position of the hole, [x, y], origin top-left. May
   *  lie on or beyond an edge. Default [0.5, 1]: centred on the bottom edge. */
  center?: [number, number];
  /** Shadow radius as a fraction of the viewport WIDTH — width-relative so the
   *  disk, which reaches 9.6 radii, can be sized to span the screen. Clamped
   *  against the height (MIN_/MAX_RADIUS_OF_HEIGHT). Default 0.065. */
  scale?: number;
  /** 'still' renders a single static configuration: no time evolution, for prefers-reduced-motion. */
  motion?: 'full' | 'still';
}

export interface BlackHoleHandle {
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  /** Pointer position in CSS pixels relative to the canvas; inside=false when the pointer left the window. */
  setPointer(x: number, y: number, inside: boolean): void;
  /** A click at these CSS pixel coordinates — emit an outward gravitational ripple. */
  pulse(x: number, y: number): void;
  /** Render one frame. timeMs is a monotonically increasing millisecond clock. */
  frame(timeMs: number): void;
  /**
   * Draws a few frames and blocks until the GPU has finished them; returns the
   * average milliseconds per frame. Stalls the pipeline — call it once per
   * layout so the host can pick a render scale, never per frame.
   */
  measure(): number;
  dispose(): void;
}

/* -------------------------------------------------------------------------- */
/* Constants shared by the shader and the host                                */
/* -------------------------------------------------------------------------- */

/** Ripples in flight at once. A third rapid click recycles the oldest slot. */
const PULSE_SLOTS = 3;

/** A ripple has fully decayed by here, so its slot can be reused. */
const PULSE_LIFE = 1.8;

/** Outer edge of the disk in shadow radii. Wide and flat: at the default scale
 *  it is 0.62 of the viewport width from the centre, so the disk runs off both
 *  sides of the screen while the hole itself stays low; it fades over the last
 *  2.4 radii. */
const R_OUT = 9.6;

/** Angular speed of the disk at r = 1 (Keplerian: scales as r^-1.5). */
const SPIN = 0.62;

/** Frames averaged by measure(). Few, because each one stalls. */
const MEASURE_FRAMES = 4;

/** Ceiling on the shadow radius as a fraction of the viewport height, so an
 *  ultra-wide screen is not a sixth black hole. Costs it the last of its disk. */
const MAX_RADIUS_OF_HEIGHT = 0.15;

/** Floor on the shadow radius as a fraction of the viewport height. On a
 *  portrait screen a width-relative radius is so small that the bottom nav
 *  pill (its top ~80px up) hides the whole visible half; this keeps the ring
 *  clear above it. */
const MIN_RADIUS_OF_HEIGHT = 0.12;

/** The shadow radius, in CSS pixels, that the star field's cell sizes were
 *  tuned at. Stars are sampled in this fixed unit rather than in radii, so a
 *  bigger hole does not mean bigger, sparser stars. */
const STAR_UNIT_PX = 90;

/**
 * uTime wraps here so a tab left open for hours does not drift into float
 * imprecision. The wrap is a whole number of orbits (20) of the disk's outer
 * edge, so the one region whose texture is broad and slow enough for a phase
 * jump to show is exactly where there is none. Inner radii do jump — one
 * frame, once every ~31 minutes, in fast filaments that flicker anyway.
 */
const TIME_WRAP = (20 * 2 * Math.PI * Math.pow(R_OUT, 1.5)) / SPIN;

/* -------------------------------------------------------------------------- */
/* Shaders                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One oversized triangle rather than a quad: it covers the viewport with three
 * vertices instead of six and has no diagonal seam for the rasteriser to
 * double-shade.
 */
const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/**
 * Units throughout the fragment shader: one "unit" is the apparent radius of
 * the shadow (the critical impact parameter b_c). Fixing b_c = 1 pins every
 * other length in the scene — horizon, ISCO, photon ring — to a constant, so
 * the geometry is resolution-independent and `uR` is the only scale that moves.
 */
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;      // drawing-buffer size, device px
uniform vec2  uCenter;   // hole centre, device px, y up (GL convention)
uniform float uR;        // shadow radius, device px
uniform float uTime;     // seconds
uniform vec3  uPointer;  // xy device px, z = 1 while the pointer is over the page
uniform vec3  uPulse[${PULSE_SLOTS}];  // xy device px origin, z = seconds since the click (< 0: idle)
uniform float uStarUnit; // device px per star-field unit

const float PI    = 3.14159265;
const float RS    = 0.38490;  // horizon radius: b_c / (3*sqrt(3)/2)
const float MASS  = 0.19245;  // RS / 2, geometric units (G = c = 1)
const float R_IN  = 1.16;     // ISCO, 3 Rs — the disk's hot inner edge
const float R_OUT = ${R_OUT.toFixed(2)};

// Disk normal, 80 degrees from face-on — the viewing angle of NASA Goddard's
// 2019 visualisation this is modelled on. Near edge-on is what folds the far
// side of the disk up and over the shadow as a broad arc while the near side
// stays a flat band; face-on would just be a ring, and fully edge-on collapses
// the band to a razor line.
const float NY = 0.98481;
const float NZ = 0.17365;

// The page ground (#05060F), so there is no seam where the canvas meets the page.
const vec3 GROUND = vec3(0.0196, 0.0235, 0.0588);

vec3 hash33(vec2 p) {
  vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                dot(p, vec2(269.5, 183.3)),
                dot(p, vec2(419.2, 371.9)));
  return fract(sin(q) * 43758.5453);
}

/* --- star field ----------------------------------------------------------- */

/**
 * One depth layer of stars, on a jittered grid so no repeat is visible.
 *
 * "soft" is the load-bearing argument. The lens squeezes a wide arc of sky into
 * a couple of pixels near the photon ring; a point sampled sharply there turns
 * into crawling fireflies. Widening (and dimming) each point by the local
 * compression is a cheap stand-in for the integral we cannot afford.
 */
vec3 starLayer(vec2 sp, float cell, float fill, float amp, float soft, float seed) {
  vec2 g = sp / cell + seed;
  vec2 id = floor(g);
  vec3 h = hash33(id + seed * 17.0);
  if (h.z > fill) return vec3(0.0);

  // Jitter stays inside the middle half of the cell so a star's falloff never
  // reaches the cell edge — that is what lets us sample one cell instead of nine.
  vec2 f = (g - id - 0.5) - (h.xy - 0.5) * 0.5;
  float grade = h.z / fill;                    // 0..1 within the cells that got a star
  float rad = (0.014 + 0.030 * grade) * (1.0 + soft * 2.0);
  float d2 = dot(f, f);
  float core = exp(-d2 / (rad * rad));
  // A 1/d^4 skirt on the brightest few only. Give it to every star and the sky
  // turns into fog the moment the lens smears any of them.
  float halo = (rad * rad) / (d2 + rad * rad * 0.25);
  // Widening a point spreads its energy over soft^2 more area; divide it back
  // out or the lensed region glows brighter than the unlensed sky around it.
  float br = amp * (core + 0.06 * halo * halo * step(0.90, grade))
                 / (1.0 + 2.0 * soft + 1.4 * soft * soft);

  // Roughly a naked-eye colour mix: mostly white with a cool bias, the odd warm
  // giant. Same four values the tiled SVG star fields use, so the two blend.
  float t = fract(h.x * 7.31);
  vec3 col = vec3(1.0);
  if (t > 0.64) col = vec3(0.804, 0.851, 1.000);  // #CDD9FF
  if (t > 0.86) col = vec3(1.000, 0.902, 0.780);  // #FFE6C7
  if (t > 0.96) col = vec3(0.851, 0.788, 1.000);  // #D9C9FF
  return col * br;
}

/* --- ground --------------------------------------------------------------- */

/**
 * One of the CSS fallback's nebula washes — radial-gradient(ellipse, colour,
 * transparent 70%) — reproduced so the canvas fading in over it changes nothing.
 */
float wash(vec2 uv, vec2 c, vec2 r) {
  vec2 d = (uv - c) / r;
  return 1.0 - clamp(length(d) / 0.7, 0.0, 1.0);
}

vec3 ground(vec2 uv) {
  vec3 g = GROUND;
  g += vec3(1.000, 0.470, 0.160) * 0.07 * wash(uv, vec2(0.10, 0.10), vec2(0.55, 0.45));
  g += vec3(0.220, 0.345, 0.784) * 0.12 * wash(uv, vec2(0.90, 0.85), vec2(0.45, 0.35));
  g += vec3(0.655, 0.569, 1.000) * 0.06 * wash(uv, vec2(0.30, 0.80), vec2(0.40, 0.30));
  return g;
}

/* --- accretion disk ------------------------------------------------------- */

/** Deep red at the cool rim through orange to yellow-white at the hot inner
 *  edge: a blackbody-ish ramp, the look of the Goddard render. */
vec3 diskRamp(float x) {
  vec3 deep = vec3(0.420, 0.055, 0.010);
  vec3 red  = vec3(0.900, 0.220, 0.020);
  vec3 ora  = vec3(1.000, 0.560, 0.100);
  vec3 hot  = vec3(1.000, 0.930, 0.700);
  vec3 c = mix(deep, red, smoothstep(0.00, 0.40, x));
  c = mix(c, ora, smoothstep(0.36, 0.74, x));
  c = mix(c, hot, smoothstep(0.76, 1.00, x));
  return c;
}

/**
 * Sample the disk where the photon's orbit crosses the equatorial plane.
 *
 * The path is the first-order solution of the photon orbit equation,
 *   1/r(phi) = sin(phi)/b + (M/b^2)(1 - cos phi)^2,
 * with phi measured from the camera direction. It reproduces the exact
 * asymptotic deflection 4M/b, and because M is rescaled by the caller to match
 * the strong-field deflection, a path can wind past phi = PI — which is
 * precisely the ray that carries the far side of the disk over the top of the
 * hole. That arc is the whole silhouette; it falls out of the algebra for free.
 *
 * Returns premultiplied colour in .rgb and coverage in .a.
 */
vec4 diskAt(float phi, float b, float meff, vec3 U, float t, float prox) {
  float s = sin(phi), c = cos(phi);
  float om = 1.0 - c;
  float iu = s / b + meff * om * om / (b * b);
  if (iu <= 0.001) return vec4(0.0);           // path escaped before reaching the plane
  float r = 1.0 / iu;
  if (r <= R_IN || r >= R_OUT) return vec4(0.0);

  vec3 P = r * vec3(s * U.x, s * U.y, c);

  // In-plane basis: e1 = (1,0,0), e2 = (0, NZ, -NY). Both are constant because
  // the disk only ever tilts about the screen's x axis.
  float psi = atan(P.y * NZ - P.z * NY, P.x);

  // Keplerian: differential rotation is what shears the turbulence into
  // trailing filaments instead of a rigid spinning texture.
  float spin = ${SPIN.toFixed(2)} * pow(r, -1.5);
  float sw = psi - spin * t;

  // Orbital velocity is n x P, normalised — |n x P| = r since n is unit and
  // perpendicular to P. Only its z component (toward the camera) matters here.
  float los = -NY * P.x / r;
  float beta = sqrt(MASS / r);
  float dop = 1.0 / max(1.0 - beta * los, 0.30);
  float grav = sqrt(max(1.0 - RS / r, 0.04));
  float boost = dop * grav;
  // Beaming would dim the receding wing to a quarter of the approaching one
  // and end the disk well short of that screen edge; the floor keeps both
  // wings reaching the sides while the asymmetry still reads.
  float boost3 = max(boost * boost * boost, 0.45);

  // Sheared sinusoids, not a noise function: the r-dependent phase is what
  // turns them into trailing spiral filaments once sw carries the Keplerian
  // shear. The broad terms give the disk its mottle; the fine ones are the
  // tight concentric grooves and long thin streaks of the Goddard render.
  float f1 = sin(sw * 7.0 + r * 3.0);
  float f2 = sin(sw * 15.0 - r * 7.0 + 1.7);
  float f3 = sin(sw * 29.0 + r * 13.0 + 0.6);
  // Slow variation along the orbit breaks the rings into arcs of differing
  // brightness; anything faster than this reads as spokes across them.
  float mott = 0.70 + 0.18 * f1 + 0.08 * f2 + 0.04 * f3;
  // Thin bright concentric rings, slightly wound into a spiral by the shear.
  float ringing = 0.5 + 0.5 * sin(r * 34.0 - sw * 2.0 + 0.7 * f1);
  float grooves = 0.55 + 0.45 * ringing * ringing;
  float streak = pow(max(0.0, sin(sw * 11.0 + r * 4.5)), 6.0) * 0.18;
  float flick = 0.94 + 0.06 * sin(t * 1.6 + psi * 3.0);

  // The gentle radial falloff keeps the band visible out to the screen edges.
  float dens = smoothstep(R_IN, R_IN + 0.20, r)
             * (1.0 - smoothstep(R_OUT - 2.4, R_OUT, r))
             * pow(R_IN / r, 0.85)
             * max(0.0, mott * grooves + streak) * flick;

  float temp = clamp(pow(R_IN / r, 0.95) * (0.62 + 0.42 * clamp(boost * 0.85, 0.0, 1.7)), 0.0, 1.0);
  vec3 col = diskRamp(temp);

  // The receding limb is dimmer anyway; reddening it as well is what makes the
  // asymmetry read as motion rather than as an uneven texture.
  float rec = clamp((0.98 - boost) * 2.2, 0.0, 1.0);
  col = mix(col, col * vec3(1.0, 0.62, 0.45), rec * 0.6);

  // The approaching limb goes yellow-white: blue-shifted, in blackbody terms.
  // Squared so it only touches the hottest few percent instead of the whole disk.
  float appr = clamp((boost - 1.06) * 1.9, 0.0, 1.0);
  col = mix(col, vec3(1.0, 0.97, 0.86), appr * appr * 0.55);

  float lum = dens * boost3 * 1.30 * (1.0 + 0.30 * prox);
  return vec4(col * lum, clamp(dens * 2.1, 0.0, 0.94));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  vec2 p = (frag - uCenter) / uR;
  float b = max(length(p), 1e-4);
  vec2 ud = p / b;

  /* pointer: proximity glow + a few pixels of star parallax. The glow is gone
     by ~3 radii, so crossing the page to reach the nav does not light the disk. */
  vec2 ptr = (uPointer.xy - uCenter) / uR;
  float prox = uPointer.z * exp(-dot(ptr, ptr) / 8.0);
  vec2 par = uPointer.z * clamp((uPointer.xy - uRes * 0.5) / uRes.y, -0.6, 0.6);

  /* Click ripples: wave packets racing outward, gone inside ~1.5 s. The
     displacement profile is the DERIVATIVE of the gaussian, not the gaussian —
     an antisymmetric push that crowds the sky ahead of the front and thins it
     behind. That is what reads as a lens sweeping over the stars; a plain
     gaussian would only add a glowing ring. */
  vec2 disp = vec2(0.0);
  float wave = 0.0;
  for (int i = 0; i < ${PULSE_SLOTS}; i++) {
    float age = uPulse[i].z;
    if (age < 0.0) continue;
    vec2 q = frag - uPulse[i].xy;
    float dq = max(length(q) / uR, 1e-4);
    float front = age * 6.5;
    float width = 0.34 + age * 0.34;        // the packet spreads as it travels
    float s = (dq - front) / width;
    float w = exp(-s * s) * exp(-age * 2.4);
    // Same energy over a growing circle.
    disp += (q / (dq * uR)) * (-s * w / (1.0 + front * 0.22));
    wave += w;
  }
  wave = min(wave, 1.0);

  /* Deflection. -2Rs*log(1 - b_c/b) is the cheapest curve with both limits
     right: it decays to the weak-field 4M/b far out and diverges at the photon
     sphere, which is what piles stars into arcs instead of merely sliding them. */
  float defl = b > 1.0 ? (-0.77 * log(max(1.0 - 1.0 / b, 1e-4))) : 0.0;

  /* Star field, lensed. The lens equation r_src = r_img - K*alpha is applied to
     a *continuous* procedural field, so tangential magnification stretches each
     point into an arc on its own — no per-star geometry, no special casing. */
  float K = 1.55 * (1.0 + 0.20 * prox + 0.55 * wave);
  float rs = b - K * defl;
  vec2 sdir = ud;
  if (rs < 0.0) { rs = -rs; sdir = -sdir; }   // second image, folded through the centre
  float comp = 1.0 + K * 0.77 / max(b * (b - 1.0), 0.02);
  float soft = clamp(log(comp) * 0.50, 0.0, 1.7);
  // Lensing is done in radii; the stars themselves live in a fixed pixel unit
  // so their size and density do not follow the size of the hole.
  vec2 sp = (sdir * rs + disp * 1.75) * (uR / uStarUnit);

  // Four depth layers, each sparser-looking than the last only because it is
  // dimmer: the counts go up, the brightness goes down, which is what makes a
  // sky read as deep instead of busy.
  vec3 sky = starLayer(sp + par * 0.055, 0.860, 0.19, 1.00, soft, 0.0);
  sky += starLayer(sp + par * 0.036, 0.500, 0.14, 0.50, soft, 3.7);
  sky += starLayer(sp + par * 0.022, 0.300, 0.130, 0.24, soft, 8.1);
  sky += starLayer(sp + par * 0.012, 0.190, 0.090, 0.12, soft, 15.3);
  sky *= 1.0 + 0.85 * wave;   // the shell magnifies what it passes over

  /* Disk. Rays with b < 1 are captured, but they can still strike the near side
     of the disk on the way in — that thin bright band crossing in front of the
     shadow. For those we walk a straight line and stop at the photon sphere. */
  float meff = b > 1.0 ? defl * b * 0.25 : MASS;
  float phiMax = b > 1.0 ? PI + defl : asin(clamp(b, 0.0, 0.999));

  // The plane through the origin is crossed at phi_c and phi_c + PI; solving
  // cos(phi)*n.w + sin(phi)*n.u = 0 gives both in one atan.
  float phi1 = atan(-NZ, ud.y * NY);
  if (phi1 < 0.0) phi1 += PI;
  vec3 U = vec3(ud, 0.0);
  vec4 d1 = phi1 < phiMax ? diskAt(phi1, b, meff, U, uTime, prox) : vec4(0.0);
  vec4 d2 = phi1 + PI < phiMax ? diskAt(phi1 + PI, b, meff, U, uTime, prox) : vec4(0.0);

  // Smaller phi is nearer the camera, so d1 occludes d2.
  vec3 col = d1.rgb + d2.rgb * (1.0 - d1.a);
  float diskA = d1.a + d2.a * (1.0 - d1.a);

  float open = smoothstep(0.985, 1.020, b);   // 0 inside the shadow

  /* The ground sits behind the sky, darkening toward the hole — a gravity well
     swallowing the nebula glow — and black inside the shadow. */
  vec3 bg = ground(uv) * (1.0 - 0.65 * exp(-(b - 1.0) * 1.3));
  col += (bg + sky) * (1.0 - diskA) * open;

  /* Photon ring: the pile-up of every highly-wound orbit. Never let it fall
     below a pixel wide or it scintillates when the viewport changes size.
     Capped short of white so it can never punch through text laid over it. */
  float pw = 0.011 + 0.7 / uR;
  float dr = b - 1.024;
  float ring = exp(-(dr * dr) / (pw * pw));
  float dr2 = b - 1.090;
  ring += 0.16 * exp(-(dr2 * dr2) / 0.0014);
  float limb = mix(0.40, 1.0, smoothstep(-0.55, 0.75, -ud.x));
  vec3 ringCol = mix(vec3(1.000, 0.420, 0.100), vec3(1.000, 0.900, 0.700), limb);
  col += ringCol * min(ring * (0.95 + 0.65 * prox), 0.88) * open;

  // Warm halo: the disk's own light scattered around the shadow.
  float glow = exp(-(b - 1.0) * 1.60) * open;
  col += vec3(0.220, 0.075, 0.015) * glow * (0.32 + 0.50 * prox);
  col += vec3(0.42, 0.36, 0.30) * wave * 0.30;

  // 8-bit banding is glaring across a near-black gradient; a sub-LSB dither
  // costs nothing.
  float dth = (hash33(frag).x - 0.5) * (1.6 / 255.0);
  gl_FragColor = vec4(max(col, vec3(0.0)) + dth, 1.0);
}
`;

/* -------------------------------------------------------------------------- */
/* Renderer                                                                   */
/* -------------------------------------------------------------------------- */

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // Not thrown: a shader that will not build on some driver should degrade to
    // the CSS star field, not take the page down with it.
    console.warn('[black-hole] shader compile failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  // The shaders are referenced by the program from here on; dropping our handles
  // lets the driver reclaim the sources immediately.
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[black-hole] program link failed:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

/** Returns null when WebGL is unavailable, so the caller can fall back to the CSS star field. */
export function createBlackHole(
  canvas: HTMLCanvasElement,
  opts: BlackHoleOptions = {}
): BlackHoleHandle | null {
  const centerX = opts.center ? opts.center[0] : 0.5;
  const centerY = opts.center ? opts.center[1] : 1;
  const scale = opts.scale ?? 0.065;
  const still = opts.motion === 'still';

  const attrs: WebGLContextAttributes = {
    // The shader paints the page ground itself, so nothing needs to show
    // through — and an opaque canvas spares the compositor a full-screen blend.
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    // The drawing buffer is normally discarded after every composite. A still
    // backdrop draws once and stops, so its one frame has to be kept.
    preserveDrawingBuffer: still,
    powerPreference: 'low-power',
    // A software-rendered context would run this at a crawl and cook the CPU;
    // the CSS star field is the better backdrop on such a machine.
    failIfMajorPerformanceCaveat: true,
  };

  let gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext('webgl', attrs) ??
      canvas.getContext('experimental-webgl', attrs)) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const ctx = gl;

  let prog: WebGLProgram | null = null;
  let buf: WebGLBuffer | null = null;
  let uRes: WebGLUniformLocation | null = null;
  let uCenter: WebGLUniformLocation | null = null;
  let uR: WebGLUniformLocation | null = null;
  let uTime: WebGLUniformLocation | null = null;
  let uPointer: WebGLUniformLocation | null = null;
  let uPulse: WebGLUniformLocation | null = null;
  let uStarUnit: WebGLUniformLocation | null = null;

  /** Rebuildable so a restored context can pick up where the lost one left off. */
  function build(): boolean {
    prog = link(ctx);
    if (!prog) return false;
    buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    // One triangle large enough to cover clip space; the excess is clipped free.
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
    const loc = ctx.getAttribLocation(prog, 'aPos');
    ctx.enableVertexAttribArray(loc);
    ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);

    uRes = ctx.getUniformLocation(prog, 'uRes');
    uCenter = ctx.getUniformLocation(prog, 'uCenter');
    uR = ctx.getUniformLocation(prog, 'uR');
    uTime = ctx.getUniformLocation(prog, 'uTime');
    uPointer = ctx.getUniformLocation(prog, 'uPointer');
    uPulse = ctx.getUniformLocation(prog, 'uPulse');
    uStarUnit = ctx.getUniformLocation(prog, 'uStarUnit');
    ctx.useProgram(prog);
    ctx.disable(ctx.DEPTH_TEST);
    ctx.disable(ctx.BLEND);
    return true;
  }

  if (!build()) return null;

  // Every one of these is a scalar, so the per-frame path never allocates.
  let dw = 1;
  let dh = 1;
  let cssH = 1;   // only the height is kept: it is what flips pointer y into GL's frame
  let ratio = 1;
  let holeX = 0;
  let holeY = 0;
  let radius = 1;

  let ptrTargetX = 0;
  let ptrTargetY = 0;
  let ptrTargetIn = 0;
  let ptrX = 0;
  let ptrY = 0;
  let ptrIn = 0;
  let ptrSeeded = false;

  // Ring buffer of ripples: xy origin in device px, z = age (< 0 means idle).
  // Uploaded with one uniform3fv, so the count costs nothing per frame.
  const pulses = new Float32Array(PULSE_SLOTS * 3);
  const pulseStart = new Float32Array(PULSE_SLOTS);
  const pulsePending: boolean[] = new Array(PULSE_SLOTS).fill(false);
  let pulseSlot = 0;
  for (let i = 0; i < PULSE_SLOTS; i++) pulses[i * 3 + 2] = -1;
  const idlePulses = new Float32Array(pulses);

  let lost = false;
  let disposed = false;
  let dirty = true;

  function onLost(e: Event): void {
    // Without preventDefault the browser never fires contextrestored.
    e.preventDefault();
    lost = true;
  }
  function onRestored(): void {
    if (disposed) return;
    lost = !build();
    // The restored context starts with a default viewport; the canvas may have
    // been resized while we were dark, so re-apply ours rather than trust it.
    if (!lost) ctx.viewport(0, 0, dw, dh);
    dirty = true;
  }
  canvas.addEventListener('webglcontextlost', onLost as EventListener, false);
  canvas.addEventListener('webglcontextrestored', onRestored, false);

  function place(): void {
    holeX = centerX * dw;
    holeY = (1 - centerY) * dh;   // GL's origin is bottom-left; the API's is top-left
    radius = Math.max(
      8,
      Math.min(Math.max(scale * dw, MIN_RADIUS_OF_HEIGHT * dh), MAX_RADIUS_OF_HEIGHT * dh)
    );
    // Keep the pointer pinned to the hole until the visitor moves it, so the
    // parallax cannot start from a position they never chose.
    if (!ptrSeeded) {
      ptrX = holeX;
      ptrY = holeY;
      ptrTargetX = holeX;
      ptrTargetY = holeY;
    }
    dirty = true;
  }

  function resize(cssWidth: number, cssHeight: number, dpr: number): void {
    // Cost is quadratic in dpr and a star field gains nothing above 2; the
    // floor still honours a host stepping quality down on a struggling GPU.
    const d = Math.max(0.5, Math.min(dpr || 1, 2));
    const w = Math.max(1, Math.round(cssWidth * d));
    const h = Math.max(1, Math.round(cssHeight * d));
    cssH = Math.max(1, cssHeight);
    ratio = d;
    // Early-out keeps this safe to call from a ResizeObserver on every tick.
    if (w !== dw || h !== dh) {
      dw = w;
      dh = h;
      canvas.width = w;
      canvas.height = h;
      ctx.viewport(0, 0, w, h);
    }
    place();
  }

  function setPointer(x: number, y: number, inside: boolean): void {
    if (still) return;
    ptrTargetX = x * ratio;
    ptrTargetY = (cssH - y) * ratio;
    ptrTargetIn = inside ? 1 : 0;
    if (!ptrSeeded) {
      ptrX = ptrTargetX;
      ptrY = ptrTargetY;
      ptrSeeded = true;
    }
  }

  function pulse(x: number, y: number): void {
    if (still) return;
    const i = pulseSlot;
    pulseSlot = (pulseSlot + 1) % PULSE_SLOTS;
    pulses[i * 3] = x * ratio;
    pulses[i * 3 + 1] = (cssH - y) * ratio;
    pulses[i * 3 + 2] = 0;
    // A click can land between frames — or before the first one — so the
    // ripple is anchored to the host's clock on the next frame() instead.
    pulsePending[i] = true;
  }

  let lastMs = -1;

  /** The still configuration: one fixed instant, pointer parked, no ripples. */
  const STILL_TIME = 8.0;

  function upload(t: number): void {
    ctx.uniform2f(uRes, dw, dh);
    ctx.uniform2f(uCenter, holeX, holeY);
    ctx.uniform1f(uR, radius);
    ctx.uniform1f(uTime, t);
    ctx.uniform1f(uStarUnit, STAR_UNIT_PX * ratio);
    if (still) {
      ctx.uniform3f(uPointer, holeX, holeY, 0);
      ctx.uniform3fv(uPulse, idlePulses);
    } else {
      ctx.uniform3f(uPointer, ptrX, ptrY, ptrIn);
      ctx.uniform3fv(uPulse, pulses);
    }
  }

  function frame(timeMs: number): void {
    if (disposed || lost) return;
    const prev = lastMs;
    lastMs = timeMs;

    if (still) {
      // Genuinely static: one fixed sample of the evolution, redrawn only when
      // the drawing buffer has actually changed underneath us.
      if (!dirty) return;
      dirty = false;
      upload(STILL_TIME);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
      return;
    }

    // Critically-damped-ish follow. The raw pointer stream is jumpy and the
    // parallax is only a few pixels, so unsmoothed input reads as a twitch.
    const dt = prev < 0 ? 0.016 : Math.min(0.1, Math.max(0, (timeMs - prev) / 1000));
    const k = 1 - Math.exp(-dt * 6);
    ptrX += (ptrTargetX - ptrX) * k;
    ptrY += (ptrTargetY - ptrY) * k;
    ptrIn += (ptrTargetIn - ptrIn) * (1 - Math.exp(-dt * 4));

    const t = timeMs / 1000;
    for (let i = 0; i < PULSE_SLOTS; i++) {
      if (pulsePending[i]) {
        pulseStart[i] = t;
        pulsePending[i] = false;
      } else if (pulses[i * 3 + 2] < 0) {
        continue;
      }
      const age = t - pulseStart[i];
      // Retire it once the shader would draw nothing, so a page that is never
      // clicked again is not carrying live ripples forever.
      pulses[i * 3 + 2] = age > PULSE_LIFE ? -1 : age;
    }

    upload(t % TIME_WRAP);
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
  }

  const probe = new Uint8Array(4);

  function measure(): number {
    if (disposed || lost) return 0;
    upload(still || lastMs < 0 ? STILL_TIME : (lastMs / 1000) % TIME_WRAP);
    // A pixel readback is the one portable way to wait for the GPU in WebGL1:
    // gl.finish() returns early under ANGLE. The warm-up draw absorbs the
    // buffer allocation and shader specialisation that follow a resize, which
    // are not per-frame costs.
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, probe);
    const start = performance.now();
    for (let i = 0; i < MEASURE_FRAMES; i++) ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, probe);
    // What was just drawn IS the still frame, so a still backdrop is up to date.
    if (still) dirty = false;
    return (performance.now() - start) / MEASURE_FRAMES;
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', onLost as EventListener, false);
    canvas.removeEventListener('webglcontextrestored', onRestored, false);
    if (buf) ctx.deleteBuffer(buf);
    if (prog) ctx.deleteProgram(prog);
    buf = null;
    prog = null;
    // Deliberately NOT losing the context: the host reuses this canvas on the
    // next switch to dark mode, and a canvas hands back its one existing
    // context — lost contexts included — for the rest of its life.
  }

  return { resize, setPointer, pulse, frame, measure, dispose };
}
