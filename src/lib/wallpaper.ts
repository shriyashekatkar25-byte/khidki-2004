/**
 * Procedural WebGL wallpaper — the desktop's centrepiece. One full-screen
 * triangle, one fragment shader, three modes. No textures, no images.
 *
 * Adaptive quality: the canvas renders at `scale` × CSS pixels. A rolling
 * average of frame time steps the scale down (to 0.35) when frames exceed
 * ~22 ms and back up when there is headroom. With reduced motion, a single
 * still frame is rendered and re-rendered only on resize/theme change.
 */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform int uMode; uniform vec2 uMouse;
uniform vec3 uC0, uC1, uC2, uC3;

// ── value noise + fbm (5 octaves, rotated each octave to hide grid artefacts)
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5; mat2 r = mat2(.8,.6,-.6,.8);
  for(int i=0;i<5;i++){ v += a*noise(p); p = r*p*2.02; a *= .5; }
  return v;
}
// Thin-film style iridescence: cosine palette driven by optical path ~ view angle.
vec3 irid(float t){ return .5 + .5*cos(6.2831*(vec3(.0,.33,.67) + t)); }

// Four-point twinkle star on a jittered grid — the "glitter" layer.
float sparkles(vec2 uv, float scale, float t){
  vec2 g = uv*scale; vec2 id = floor(g); vec2 f = fract(g) - .5;
  float h = hash(id);
  if(h < .82) return 0.;
  vec2 o = vec2(hash(id+3.1), hash(id+7.7)) - .5; f -= o*.6;
  float tw = pow(.5 + .5*sin(t*(1.5+h*3.) + h*40.), 6.);
  float d = length(f);
  float cross = max(0., 1. - abs(f.x*f.y)*900.) * smoothstep(.35, .0, d);
  return (smoothstep(.06, .0, d) + cross*.8) * tw;
}

// Chandrakor — crescent moon: a disc minus an offset disc, softly lit.
float crescent(vec2 p, float r){
  float a = smoothstep(r, r-.006, length(p));
  float b = smoothstep(r*.92, r*.92-.006, length(p - vec2(r*.42, r*.18)));
  return clamp(a - b, 0., 1.);
}

vec3 silk(vec2 uv, vec2 p, float t){
  p *= .38;
  vec2 q = vec2(fbm(p + t*.04), fbm(p + vec2(5.2,1.3) - t*.03));
  vec2 r = vec2(fbm(p + 3.*q + vec2(1.7,9.2) + t*.05), fbm(p + 3.*q + vec2(8.3,2.8)));
  float f = fbm(p + 3.5*r);
  // Height-field normal by finite differences; light follows the pointer.
  float e = .01;
  float fx = fbm(p + 3.5*r + vec2(e,0.)) - f, fy = fbm(p + 3.5*r + vec2(0.,e)) - f;
  vec3 n = normalize(vec3(-fx/e*.35, -fy/e*.35, 1.));
  vec3 L = normalize(vec3(uMouse - .5, .9));
  float diff = clamp(dot(n, L), 0., 1.);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0,0,1)), 0., 1.), 24.);
  vec3 col = mix(uC0, uC1, smoothstep(.25, .85, f));
  col = mix(col, uC2, smoothstep(.6, 1., length(q))*.55);
  col *= .55 + .65*diff;
  col += irid(f*1.6 + n.x*.6 + t*.02) * spec * .35 + uC3*spec*.6;
  return col;
}

// Rangoli: concentric rings of petals, scallops and dots, built as a mandala the
// way a rangoli is drawn — from the centre outwards; cos(A·n) petals give dihedral symmetry.
float band(float r, float a, float b, float w){ return smoothstep(a-w, a, r) * (1. - smoothstep(b, b+w, r)); }
vec3 rangoli(vec2 uv, vec2 p, float t){
  vec2 asp = vec2(uRes.x/uRes.y, 1.);
  vec2 c = (uv - vec2(.5 + .08*(asp.x-1.), .5)) * asp;
  float r = length(c), A = atan(c.y, c.x) + t*.015;
  float w = 2.5/uRes.y;                                    // anti-alias width
  float breathe = 1. + .015*sin(t*.6);
  r /= breathe;
  vec3 col = mix(uC0*1.5, uC0*.55, smoothstep(.0, .9, r));
  // 1 · centre lotus, 8 petals
  float e1 = .035 + .085*pow(abs(cos(A*4.)), .7);
  col = mix(col, uC1, smoothstep(e1+w, e1, r));
  col = mix(col, uC3, smoothstep(w, 0., abs(r - e1)) * .9);
  col = mix(col, uC3, smoothstep(.022, .018, r));
  // 2 · zari ring
  col = mix(col, uC3, band(r, .145, .155, w));
  // 3 · sixteen pointed petals
  float e3 = .165 + .12*pow(abs(cos(A*8.)), 2.2);
  float in3 = smoothstep(e3+w, e3, r) * step(.155, r);
  col = mix(col, mix(uC2, uC1, .35 + .35*cos(A*16.)), in3);
  col = mix(col, uC3, smoothstep(w*1.2, 0., abs(r - e3)) * step(.155, r) * .9);
  // 4 · ring of 32 dots (the kolam "pulli")
  float k = 32.; float ai = (floor(A/6.2831*k) + .5) * 6.2831/k;
  vec2 dp = c/breathe - vec2(cos(ai), sin(ai)) * .33;
  col = mix(col, uC3, smoothstep(.011+w, .011, length(dp)));
  // 5 · scalloped outer border, 24 scallops, with a second inner line
  float e5 = .37 + .05*abs(sin(A*12.));
  col = mix(col, uC1*.85, band(r, .37, e5, w) );
  col = mix(col, uC3, smoothstep(w, 0., abs(r - e5)) + band(r, .43, .436, w));
  // 6 · drifting dot lattice beyond the mandala, fading out
  vec2 q = mat2(.7071,-.7071,.7071,.7071) * (c*14.) + t*.05;
  float lat = smoothstep(.12, .07, length(fract(q) - .5));
  col += uC3 * lat * .22 * smoothstep(.47, .6, r);
  col += irid(r*1.5 - t*.03) * .05;
  return col;
}

// Rain on glass: bokeh lights behind, drops in tall cells that slide on a sawtooth clock.
vec3 bokeh(vec2 uv, float t){
  vec3 col = mix(uC0*.6, uC0*1.4, uv.y);
  for(int i=0;i<14;i++){
    float fi = float(i);
    vec2 c = vec2(hash(vec2(fi,1.)), hash(vec2(fi,2.))*.7);
    c.x = fract(c.x + t*.004*(hash(vec2(fi,3.))-.5));
    float rad = .03 + .07*hash(vec2(fi,4.));
    float d = length((uv - c)*vec2(uRes.x/uRes.y,1.));
    float k3 = mod(fi, 3.);
    vec3 lc = k3 < .5 ? uC1 : (k3 < 1.5 ? uC2 : uC3);
    col += lc * smoothstep(rad, rad*.7, d) * .35;
  }
  return col;
}
// Returns (refraction offset.xy, drop mask). Each drop magnifies and flips what
// is behind it, like a real lens, so the bokeh shows through inverted.
vec3 drops(vec2 uv, float t, float s){
  vec2 a = vec2(3., 1.); vec2 g = uv*s*a; g.y += t*.25;
  vec2 id = floor(g); vec2 f = fract(g) - .5;
  float h = hash(id);
  float y = -fract(t*.25*(.6+h) + h) + .5;          // slides down, wraps
  vec2 dp = (f - vec2((h-.5)*.6, y)) / a;
  float m = smoothstep(.085, .06, length(dp)) * step(.3, h);
  return vec3(-dp * m * 6., m);
}
vec3 rain(vec2 uv, vec2 p, float t){
  vec3 d1 = drops(uv, t, 6.), d2 = drops(uv*1.7+.3, t*1.1, 9.);
  vec2 off = d1.xy + d2.xy*.6;
  float mask = max(d1.z, d2.z);
  vec3 col = bokeh(uv + off, t);
  // static beads: tiny round drops that do not slide
  vec2 g = uv*vec2(uRes.x/uRes.y,1.)*40.; vec2 gi = floor(g); vec2 gf = fract(g)-.5;
  float bead = smoothstep(.16, .1, length(gf - (vec2(hash(gi), hash(gi+2.))-.5)*.5)) * step(.86, hash(gi+5.));
  return col * (1. + mask*.35) + mask*.06*uC3 + bead*.16*uC3;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * vec2(uRes.x/uRes.y, 1.) * 2.2;
  float t = uTime;
  vec3 col = uMode == 0 ? silk(uv, p, t) : (uMode == 1 ? rangoli(uv, p, t) : rain(uv, p, t));
  vec2 asp = vec2(uRes.x/uRes.y, 1.);
  // Moon + halo, upper right.
  vec2 mp = (uv - (asp.x < 1. ? vec2(.72, .9) : vec2(.84, .8))) * asp;
  float moon = crescent(mp, .075);
  col += uC3 * exp(-length(mp)*9.) * .25 + mix(uC2, vec3(1.), .5) * moon * .9;
  col += vec3(1., .95, .98) * (sparkles(uv*asp, 38., t) + sparkles(uv*asp + 1.3, 17., t*.8)*.8);
  // Cinematic vignette + gentle film grain.
  col *= .78 + .3*smoothstep(1.15, .2, length((uv-.5)*asp));
  col += (hash(uv*uRes + fract(t)) - .5) * .025;
  gl_FragColor = vec4(pow(clamp(col, 0., 1.), vec3(.95)), 1.);
}`;

export interface WallpaperHandle {
  setPalette(c: [number, number, number][]): void;
  setMode(m: 'silk' | 'rangoli' | 'rain'): void;
  setReduced(r: boolean): void;
  ok: boolean;
}

export function mountWallpaper(canvas: HTMLCanvasElement): WallpaperHandle {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  const noop: WallpaperHandle = { setPalette() {}, setMode() {}, setReduced() {}, ok: false };
  if (!gl) return noop;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch (err) {
    console.warn('[wallpaper] falling back to CSS gradient:', err);
    return noop;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uMode = U('uMode'), uMouse = U('uMouse');
  const uC = [U('uC0'), U('uC1'), U('uC2'), U('uC3')];

  let scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7;
  let mode = 0, reduced = false, raf = 0, last = performance.now(), avg = 16, frames = 0;
  const mouse = [0.7, 0.7], target = [0.7, 0.7];
  const start = performance.now();

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };

  const draw = (now: number) => {
    resize();
    mouse[0] += (target[0] - mouse[0]) * 0.05; mouse[1] += (target[1] - mouse[1]) * 0.05;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced ? 12.0 : (now - start) / 1000);
    gl.uniform1i(uMode, mode);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now: number) => {
    const dt = now - last; last = now;
    avg = avg * 0.95 + dt * 0.05;
    if (++frames % 90 === 0) {
      if (avg > 22 && scale > 0.36) scale = Math.max(0.35, scale - 0.15);
      else if (avg < 14 && scale < 1) scale = Math.min(1, scale + 0.05);
    }
    draw(now);
    raf = requestAnimationFrame(loop);
  };

  const restart = () => {
    cancelAnimationFrame(raf);
    if (reduced) draw(performance.now());
    else { last = performance.now(); raf = requestAnimationFrame(loop); }
  };

  window.addEventListener('pointermove', (e) => { target[0] = e.clientX / innerWidth; target[1] = 1 - e.clientY / innerHeight; }, { passive: true });
  window.addEventListener('resize', () => reduced && draw(performance.now()));
  document.addEventListener('visibilitychange', () => (document.hidden ? cancelAnimationFrame(raf) : restart()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cancelAnimationFrame(raf); document.body.classList.add('no-webgl'); });

  restart();
  return {
    ok: true,
    setPalette(c) { c.forEach((rgb, i) => gl.uniform3f(uC[i], rgb[0], rgb[1], rgb[2])); if (reduced) draw(performance.now()); },
    setMode(m) { mode = m === 'silk' ? 0 : m === 'rangoli' ? 1 : 2; if (reduced) draw(performance.now()); },
    setReduced(r) { reduced = r; restart(); },
  };
}
