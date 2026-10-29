(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();class Nt{constructor(){this.m=new Map}get(t){return this.m.has(t)?this.m.get(t):null}set(t,e){this.m.set(t,e)}remove(t){this.m.delete(t)}}function Ot(){const s=new Nt;try{const t="__khidki_probe__";return window.localStorage.setItem(t,"1"),window.localStorage.removeItem(t),{persistent:!0,get:e=>{try{return window.localStorage.getItem(e)}catch{return s.get(e)}},set:(e,a)=>{try{window.localStorage.setItem(e,a)}catch{s.set(e,a)}},remove:e=>{try{window.localStorage.removeItem(e)}catch{s.remove(e)}}}}catch{return{persistent:!1,get:t=>s.get(t),set:(t,e)=>s.set(t,e),remove:t=>s.remove(t)}}}const ht="khidki2004:";class Ft{constructor(t){this.kv=t}read(t,e,a=1){const i=this.kv.get(ht+t);if(i==null)return e;try{const o=JSON.parse(i);return!o||typeof o!="object"||o.v!==a?e:o.data}catch{return e}}write(t,e,a=1){this.kv.set(ht+t,JSON.stringify({v:a,data:e}))}clear(t){this.kv.remove(ht+t)}}const jt={theme:"rani",wallpaper:"silk",sounds:!0,motion:"auto",skipBoot:!1},G=s=>[1,3,5].map(t=>parseInt(s.slice(t,t+2),16)/255),qt=[{id:"rani",name:"Rani Chrome",tagline:"rani pink · cherry · champagne · silver",shader:[G("#3a0a26"),G("#e2007a"),G("#f4e1bf"),G("#cfd4de")]},{id:"monsoon",name:"Monsoon Modem",tagline:"turquoise · icy blue · lavender · indigo",shader:[G("#0a1838"),G("#0fb5c2"),G("#c9b8ff"),G("#e6f7ff")]},{id:"paithani",name:"Paithani Midnight",tagline:"paithani purple · emerald · zari gold",shader:[G("#1b0b2e"),G("#5b2a86"),G("#0f7b5f"),G("#e0b44a")]}],wt=[{id:"silk",name:"Silk",note:"domain-warped noise shaded like thin-film silk"},{id:"rangoli",name:"Rangoli",note:"8-fold polar symmetry, a procedural kolam-like lattice"},{id:"rain",name:"Monsoon Glass",note:"procedural raindrops sliding on a window pane"}];class Gt{constructor(t){this.store=t,this.listeners=new Set,this.value={...jt,...t.read("settings",{})}}set(t,e){this.value={...this.value,[t]:e},this.store.write("settings",this.value),this.listeners.forEach(a=>a(this.value))}onChange(t){this.listeners.add(t)}}function Kt(s){return s==="reduced"?!0:s==="full"?!1:typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}const Wt="attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }",Vt=`
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
}`;function Ut(s){const t=s.getContext("webgl",{antialias:!1,premultipliedAlpha:!1,powerPreference:"low-power"}),e={setPalette(){},setMode(){},setReduced(){},ok:!1};if(!t)return e;const a=(u,x)=>{const A=t.createShader(u);if(t.shaderSource(A,x),t.compileShader(A),!t.getShaderParameter(A,t.COMPILE_STATUS))throw new Error(t.getShaderInfoLog(A)??"shader");return A},i=t.createProgram();try{if(t.attachShader(i,a(t.VERTEX_SHADER,Wt)),t.attachShader(i,a(t.FRAGMENT_SHADER,Vt)),t.linkProgram(i),!t.getProgramParameter(i,t.LINK_STATUS))throw new Error("link")}catch(u){return console.warn("[wallpaper] falling back to CSS gradient:",u),e}t.useProgram(i);const o=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,o),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);const c=t.getAttribLocation(i,"p");t.enableVertexAttribArray(c),t.vertexAttribPointer(c,2,t.FLOAT,!1,0,0);const d=u=>t.getUniformLocation(i,u),b=d("uRes"),p=d("uTime"),M=d("uMode"),g=d("uMouse"),E=[d("uC0"),d("uC1"),d("uC2"),d("uC3")];let r=Math.min(window.devicePixelRatio||1,1.5)*.7,m=0,h=!1,S=0,_=performance.now(),C=16,R=0;const I=[.7,.7],q=[.7,.7],P=performance.now(),B=()=>{const u=Math.max(1,Math.round(s.clientWidth*r)),x=Math.max(1,Math.round(s.clientHeight*r));(s.width!==u||s.height!==x)&&(s.width=u,s.height=x),t.viewport(0,0,u,x)},k=u=>{B(),I[0]+=(q[0]-I[0])*.05,I[1]+=(q[1]-I[1])*.05,t.uniform2f(b,s.width,s.height),t.uniform1f(p,h?12:(u-P)/1e3),t.uniform1i(M,m),t.uniform2f(g,I[0],I[1]),t.drawArrays(t.TRIANGLES,0,3)},F=u=>{const x=u-_;_=u,C=C*.95+x*.05,++R%90===0&&(C>22&&r>.36?r=Math.max(.35,r-.15):C<14&&r<1&&(r=Math.min(1,r+.05))),k(u),S=requestAnimationFrame(F)},H=()=>{cancelAnimationFrame(S),h?k(performance.now()):(_=performance.now(),S=requestAnimationFrame(F))};return window.addEventListener("pointermove",u=>{q[0]=u.clientX/innerWidth,q[1]=1-u.clientY/innerHeight},{passive:!0}),window.addEventListener("resize",()=>h&&k(performance.now())),document.addEventListener("visibilitychange",()=>document.hidden?cancelAnimationFrame(S):H()),s.addEventListener("webglcontextlost",u=>{u.preventDefault(),cancelAnimationFrame(S),document.body.classList.add("no-webgl")}),H(),{ok:!0,setPalette(u){u.forEach((x,A)=>t.uniform3f(E[A],x[0],x[1],x[2])),h&&k(performance.now())},setMode(u){m=u==="silk"?0:u==="rangoli"?1:2,h&&k(performance.now())},setReduced(u){h=u,H()}}}class Yt{constructor(){this.ctx=null,this.analyser=null,this.master=null,this.noise=null,this.uiEnabled=!0}ensure(){if(this.ctx)return this.ctx.state==="suspended"&&this.ctx.resume(),this.ctx;const t=window.AudioContext??window.webkitAudioContext;if(!t)return null;const e=new t,a=e.createGain();a.gain.value=.7;const i=e.createDynamicsCompressor();i.threshold.value=-16,i.ratio.value=4;const o=e.createAnalyser();o.fftSize=1024,o.smoothingTimeConstant=.82,a.connect(i).connect(o).connect(e.destination);const c=e.createBuffer(1,e.sampleRate,e.sampleRate),d=c.getChannelData(0);for(let b=0;b<d.length;b++)d[b]=Math.random()*2-1;return Object.assign(this,{ctx:e,master:a,analyser:o,noise:c}),e}get out(){return this.master}env(t,e,a,i,o){t.gain.setValueAtTime(1e-4,e),t.gain.exponentialRampToValueAtTime(a,e+i),t.gain.exponentialRampToValueAtTime(1e-4,e+i+o)}bell(t,e,a=.18,i=.9){const o=this.ctx;[1,2.76,5.4].forEach((c,d)=>{const b=o.createOscillator(),p=o.createGain();b.type="sine",b.frequency.value=t*c,this.env(p,e,a/(d*1.8+1),.004,i/(d+1)),b.connect(p).connect(this.out),b.start(e),b.stop(e+i+.1)})}ui(t){if(!this.uiEnabled)return;const e=this.ensure();if(!e)return;const a=e.currentTime+.01,i=554.37,o=c=>i*Math.pow(2,c/12);switch(t){case"click":this.bell(o(12),a,.05,.12);break;case"open":this.bell(o(7),a,.09,.4),this.bell(o(12),a+.06,.08,.5);break;case"close":this.bell(o(12),a,.07,.3),this.bell(o(7),a+.06,.06,.35);break;case"minimize":this.bell(o(4),a,.06,.25);break;case"save":this.bell(o(9),a,.07,.3),this.bell(o(14),a+.08,.06,.45);break;case"error":this.bell(o(1),a,.1,.3),this.bell(o(0),a+.09,.1,.4);break;case"boot":[-1,2,4,6,7,12].forEach((c,d)=>this.bell(o(c-12),a+d*.13,.11,1.4));break;case"shutdown":[12,7,4,0].forEach((c,d)=>this.bell(o(c-12),a+d*.18,.1,1.2));break}}drum(t,e,a,i=1){const o=this.ensure();if(o)if(t==="bayan"){const c=o.createOscillator(),d=o.createGain();c.type="sine",c.frequency.setValueAtTime(70,e),c.frequency.linearRampToValueAtTime(96,e+.06),c.frequency.exponentialRampToValueAtTime(58,e+.5),this.env(d,e,.55*i,.005,.5),c.connect(d).connect(this.out),c.start(e),c.stop(e+.6)}else if(t==="dayan"||t==="tin"){const c=t==="dayan"?.38:.12;[1,2.01,3.03].forEach((d,b)=>{const p=o.createOscillator(),M=o.createGain();p.type=b===0?"triangle":"sine",p.frequency.value=a*d,this.env(M,e,.22*i/(b+1),.002,c/(b*.6+1)),p.connect(M).connect(this.out),p.start(e),p.stop(e+c+.1)}),this.noiseHit(e,3200,.06*i,.03)}else this.noiseHit(e,6e3,.12*i,.025)}noiseHit(t,e,a,i){const o=this.ctx,c=o.createBufferSource();c.buffer=this.noise;const d=o.createBiquadFilter();d.type="bandpass",d.frequency.value=e,d.Q.value=1.2;const b=o.createGain();this.env(b,t,a,.001,i),c.connect(d).connect(b).connect(this.out),c.start(t,Math.random()*.5),c.stop(t+i+.05)}pluck(t,e,a,i=.12){const o=this.ensure();if(!o)return;const c=o.createBiquadFilter();c.type="lowpass",c.Q.value=4,c.frequency.setValueAtTime(t*8,e),c.frequency.exponentialRampToValueAtTime(t*1.5,e+a);const d=o.createGain();this.env(d,e,i,.004,a),c.connect(d).connect(this.out),[-4,4].forEach(b=>{const p=o.createOscillator();p.type="sawtooth",p.frequency.value=t,p.detune.value=b,p.connect(c),p.start(e),p.stop(e+a+.05)})}tanpura(t,e,a=.07){const i=this.ensure();if(!i)return;const o=i.createOscillator();o.type="sawtooth",o.frequency.value=t;const c=i.createBiquadFilter();c.type="lowpass",c.Q.value=6,c.frequency.setValueAtTime(t*3,e),c.frequency.linearRampToValueAtTime(t*9,e+.5),c.frequency.exponentialRampToValueAtTime(t*2,e+2.6);const d=i.createGain();this.env(d,e,a,.03,2.6),o.connect(c).connect(d).connect(this.out),o.start(e),o.stop(e+2.8)}}const D=new Yt,kt=["Weaving zari threads…","Tuning tanpura to C#…","Polishing chrome…","Dialing 56k modem…","Swagat. Welcome home."];function It(s,t){return new Promise(e=>{const a=document.createElement("div");a.className="boot",a.setAttribute("role","status"),a.setAttribute("aria-label","KHIDKI 2004 is starting"),a.innerHTML=`<canvas aria-hidden="true"></canvas>
      <div class="boot__ui"><div class="boot__bar">${"<i></i>".repeat(8)}</div>
      <div class="boot__msg" aria-live="polite"></div>
      <button class="boot__skip">Press any key to skip</button></div>
      <p class="boot__foot">${t}</p>`,document.body.append(a);const i=a.querySelector("canvas"),o=i.getContext("2d"),c=[...a.querySelectorAll(".boot__bar i")],d=a.querySelector(".boot__msg");let b=!1,p=0;const M=[],g=()=>{b||(b=!0,cancelAnimationFrame(p),M.forEach(clearTimeout),a.classList.add("done"),setTimeout(()=>a.remove(),600),removeEventListener("keydown",g),a.removeEventListener("pointerdown",g),e())};addEventListener("keydown",g),a.addEventListener("pointerdown",g);const E=s?1400:4200;c.forEach((_,C)=>M.push(setTimeout(()=>_.classList.add("on"),E*.85*(C+1)/c.length))),kt.forEach((_,C)=>M.push(setTimeout(()=>d.textContent=_,E*.9*C/kt.length))),M.push(setTimeout(g,E));const r=Math.min(devicePixelRatio||1,2),m=innerWidth,h=innerHeight;i.width=m*r,i.height=h*r,o.scale(r,r),Promise.race([document.fonts?.ready??Promise.resolve(),new Promise(_=>setTimeout(_,900))]).then(()=>{if(b)return;const _=Math.min(m*.15,150),C=document.createElement("canvas");C.width=m,C.height=h;const R=C.getContext("2d");if(R.fillStyle="#fff",R.textAlign="center",R.textBaseline="middle",R.font=`800 ${_}px Unbounded, 'Arial Black', sans-serif`,R.fillText("KHIDKI",m/2,h*.4),R.font=`${_*.36}px 'Tiro Devanagari Marathi', serif`,R.fillText("खिडकी · २००४",m/2,h*.4+_*.78),s){o.drawImage(C,0,0,m,h),o.globalCompositeOperation="source-atop";const A=o.createLinearGradient(0,h*.3,0,h*.6);A.addColorStop(0,"#ffffff"),A.addColorStop(.5,"#ff7cc0"),A.addColorStop(1,"#cfd4de"),o.fillStyle=A,o.fillRect(0,0,m,h);return}const I=R.getImageData(0,0,m,h).data,q=Math.max(3,Math.round(_/26)),P=[];for(let A=0;A<h;A+=q)for(let n=0;n<m;n+=q)I[(A*m+n)*4+3]>140&&P.push([n,A]);const B=Math.max(1,Math.ceil(P.length/3200)),k=["#ffffff","#ffd1e8","#ff4fa3","#e2007a","#f4e1bf","#cfd4de"],F=P.filter((A,n)=>n%B===0).map(([A,n])=>{const l=Math.random()*Math.PI*2,f=Math.max(m,h)*(.6+Math.random()*.4);return{x:m/2+Math.cos(l)*f,y:h/2+Math.sin(l)*f,vx:0,vy:0,tx:A,ty:n,c:k[Math.min(k.length-1,Math.floor((n-h*.3)/(h*.3)*k.length+Math.random()*1.5))]??"#fff",s:.6+Math.random()*1.4,ph:Math.random()*6.28,delay:Math.random()*500}});try{D.ui("boot")}catch{}const H=performance.now();let u=H;const x=A=>{const n=A-H,l=Math.min(4,Math.max(1,Math.round((A-u)/16.7)));u=A;const f=n>1700?(n-1700)/1300*(m*1.4)-m*.2:null;o.globalCompositeOperation="source-over",o.fillStyle="rgba(7, 2, 10, 0.28)",o.fillRect(0,0,m,h),o.globalCompositeOperation="lighter";for(const w of F){if(n>w.delay)for(let v=0;v<l;v++)w.vx=(w.vx+(w.tx-w.x)*.045)*.86,w.vy=(w.vy+(w.ty-w.y)*.045)*.86,w.x+=w.vx,w.y+=w.vy;const y=.55+.45*Math.sin(n/140+w.ph),T=f!==null&&Math.abs(w.x-f-(w.y-h/2)*.45)<46;o.globalAlpha=T?1:y,o.fillStyle=T?"#ffffff":w.c,o.fillRect(w.x,w.y,w.s*q*.55,w.s*q*.55)}o.globalAlpha=1,p=requestAnimationFrame(x)};p=requestAnimationFrame(x)})})}class Xt{constructor(t){this.viewport=t,this.wins=new Map,this.order=[],this.seq=0,this.listeners=new Set,this.cascade=0}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}emit(){this.listeners.forEach(t=>t(this))}get(t){return this.wins.get(t)}list(){return this.order.map(t=>this.wins.get(t))}focused(){for(let t=this.order.length-1;t>=0;t--){const e=this.wins.get(this.order[t]);if(!e.minimized)return e}}zIndexOf(t){return this.order.indexOf(t)}findByApp(t){return this.list().find(e=>e.appId===t)}open(t){if(t.singleton){const M=this.findByApp(t.appId);if(M)return this.focus(M.id),M}const e=this.viewport.h-this.viewport.bottomInset,a=Math.min(t.w??560,this.viewport.w-16),i=Math.min(t.h??420,e-16),o=this.cascade++%6*28,c=Math.max(8,Math.round((this.viewport.w-a)/2-84+o)),d=Math.max(8,Math.round((e-i)/2-56+o)),b=`win-${++this.seq}`,p={id:b,appId:t.appId,title:t.title,x:c,y:d,w:a,h:i,minimized:!1,maximized:!1,restore:null,minW:t.minW??280,minH:t.minH??200};return this.wins.set(b,p),this.order.push(b),this.clamp(p),this.emit(),p}close(t){this.wins.delete(t)&&(this.order=this.order.filter(e=>e!==t),this.emit())}focus(t){const e=this.wins.get(t);e&&(e.minimized=!1,this.order=this.order.filter(a=>a!==t),this.order.push(t),this.emit())}minimize(t){const e=this.wins.get(t);e&&(e.minimized=!0,this.emit())}toggleFromTaskbar(t){this.wins.get(t)&&(this.focused()?.id===t?this.minimize(t):this.focus(t))}toggleMaximize(t){const e=this.wins.get(t);e&&(e.maximized?(Object.assign(e,e.restore??{}),e.restore=null,e.maximized=!1):(e.restore={x:e.x,y:e.y,w:e.w,h:e.h},Object.assign(e,{x:0,y:0,w:this.viewport.w,h:this.viewport.h-this.viewport.bottomInset}),e.maximized=!0),this.focus(t))}moveTo(t,e,a){const i=this.wins.get(t);!i||i.maximized||(i.x=Math.round(e),i.y=Math.round(a),this.clamp(i),this.emit())}moveBy(t,e,a){const i=this.wins.get(t);i&&this.moveTo(t,i.x+e,i.y+a)}resizeTo(t,e,a){const i=this.wins.get(t);if(!i||i.maximized)return;const o=this.viewport.w-i.x,c=this.viewport.h-this.viewport.bottomInset-i.y;i.w=Math.round(Math.max(i.minW,Math.min(e,o))),i.h=Math.round(Math.max(i.minH,Math.min(a,c))),this.emit()}cycle(){const t=this.order.filter(a=>!this.wins.get(a).minimized),e=t.length>1?t:this.order;e.length!==0&&this.focus(e[0])}setViewport(t){this.viewport=t;for(const e of this.wins.values())e.maximized?Object.assign(e,{x:0,y:0,w:t.w,h:t.h-t.bottomInset}):this.clamp(e);this.emit()}clamp(t){const e=this.viewport.h-this.viewport.bottomInset;t.w=Math.min(t.w,this.viewport.w),t.h=Math.min(t.h,e);const a=96;t.x=Math.max(a-t.w,Math.min(t.x,this.viewport.w-a)),t.y=Math.max(0,Math.min(t.y,e-36))}}let Qt=0;const L="#3a0a26";function Zt(s){return`<defs>
    <linearGradient id="chr${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9ced8"/>
      <stop offset=".55" stop-color="#8d93a3"/><stop offset="1" stop-color="#eef0f5"/></linearGradient>
    <linearGradient id="pk${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff7cc0"/><stop offset=".6" stop-color="#e2007a"/><stop offset="1" stop-color="#9b0052"/></linearGradient>
    <linearGradient id="rd${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff5a6e"/><stop offset="1" stop-color="#a50e2b"/></linearGradient>
    <linearGradient id="gd${s}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff1c4"/><stop offset=".5" stop-color="#e0b44a"/><stop offset="1" stop-color="#9a6b12"/></linearGradient>
    <linearGradient id="tq${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9ff3f5"/><stop offset="1" stop-color="#0b8f9c"/></linearGradient>
    <linearGradient id="pp${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a86ad6"/><stop offset="1" stop-color="#3f1864"/></linearGradient>
    <linearGradient id="em${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#53d1a4"/><stop offset="1" stop-color="#0b5e48"/></linearGradient>
  </defs>`}const V=(s,t,e,a)=>`<ellipse cx="${s}" cy="${t}" rx="${e}" ry="${a}" fill="#fff" opacity=".45"/>`,xt={diary:s=>`
    <rect x="12" y="8" width="40" height="50" rx="6" fill="url(#pk${s})" stroke="${L}" stroke-width="1.5"/>
    <rect x="12" y="8" width="7" height="50" rx="3" fill="#9b0052" opacity=".6"/>
    <path d="M24 16h22M24 21h16" stroke="#ffd0e8" stroke-width="2" stroke-linecap="round" opacity=".8"/>
    <rect x="44" y="28" width="12" height="12" rx="3" fill="url(#chr${s})" stroke="${L}" stroke-width="1.2"/>
    <path d="M36 40c-5-4-9-7-9-11a4 4 0 0 1 9-1.5A4 4 0 0 1 45 29c0 4-4 7-9 11z" fill="url(#chr${s})" stroke="${L}" stroke-width="1.2"/>
    ${V(31,15,15,4)}`,taal:s=>`
    <circle cx="32" cy="32" r="25" fill="url(#chr${s})" stroke="${L}" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="25" fill="url(#tq${s})" opacity=".35"/>
    <path d="M32 7a25 25 0 0 1 22 13" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
    <path d="M10 42a25 25 0 0 0 10 10" stroke="#ff7cc0" stroke-width="3" fill="none" opacity=".7"/>
    <circle cx="32" cy="32" r="10" fill="#f4e1bf" stroke="${L}" stroke-width="1.2"/>
    <circle cx="32" cy="32" r="5" fill="#2a0e25"/><circle cx="30.5" cy="30.5" r="1.4" fill="#fff" opacity=".7"/>`,board:s=>`
    <rect x="10" y="12" width="40" height="44" rx="2" fill="#fff8fb" stroke="${L}" stroke-width="1.5" transform="rotate(-6 30 34)"/>
    <rect x="15" y="16" width="30" height="27" fill="url(#pp${s})" transform="rotate(-6 30 34)"/>
    <rect x="22" y="7" width="20" height="8" fill="#9ff3f5" opacity=".85" transform="rotate(8 32 11)"/>
    <g transform="translate(30 30) rotate(-6)">
      <path d="M0 0C-8-10-15-6-12 2-9 7-3 5 0 0zM0 0C8-10 15-6 12 2 9 7 3 5 0 0z" fill="url(#pk${s})" stroke="${L}" stroke-width="1"/>
      <path d="M0 0c-6 5-8 10-4 11 2 0 3-4 4-11zM0 0c6 5 8 10 4 11-2 0-3-4-4-11z" fill="#f4e1bf" stroke="${L}" stroke-width="1"/>
    </g>
    <path d="M50 44l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="url(#gd${s})" stroke="${L}" stroke-width=".8"/>`,settings:s=>`
    <g stroke="${L}" stroke-width="1.5">
      <path d="M32 6l4 6 7-2 1 7 7 2-3 6 5 5-6 4 2 7-7 1-2 7-6-3-5 5-4-6-7 2-1-7-7-2 3-6-5-5 6-4-2-7 7-1 2-7 6 3z" fill="url(#chr${s})"/>
      <circle cx="32" cy="32" r="12" fill="url(#pk${s})"/>
    </g>
    <path d="M36 25a8 8 0 1 0 0 14 6.5 6.5 0 1 1 0-14z" fill="#f4e1bf"/>
    ${V(28,16,10,3)}`,about:s=>`
    <path d="M32 5l7.5 15.5 17 2.3-12.4 12 3 16.9L32 43.6l-15.1 8.1 3-16.9-12.4-12 17-2.3z" fill="url(#gd${s})" stroke="${L}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="32" cy="22" r="2.6" fill="${L}"/><rect x="29.6" y="27" width="4.8" height="13" rx="2.4" fill="${L}"/>
    ${V(30,15,9,3)}`,power:s=>`
    <circle cx="32" cy="32" r="24" fill="url(#rd${s})" stroke="${L}" stroke-width="1.5"/>
    <path d="M24 22a14 14 0 1 0 16 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M32 16v14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>${V(32,18,14,5)}`},gt={butterfly:s=>`
    <path d="M32 32C18 8 2 16 8 30c4 9 16 8 24 2zM32 32C46 8 62 16 56 30c-4 9-16 8-24 2z" fill="url(#pk${s})" stroke="${L}" stroke-width="1.5"/>
    <path d="M32 32c-12 6-16 18-8 20 4 1 7-6 8-20zM32 32c12 6 16 18 8 20-4 1-7-6-8-20z" fill="url(#tq${s})" stroke="${L}" stroke-width="1.5"/>
    <circle cx="18" cy="24" r="3" fill="#fff" opacity=".7"/><circle cx="46" cy="24" r="3" fill="#fff" opacity=".7"/>
    <path d="M32 20v26" stroke="${L}" stroke-width="2.5" stroke-linecap="round"/>`,star:s=>`<path d="M32 4l7.5 17 18.5 2-14 12.5 4 18.5L32 44.5 16 54l4-18.5L6 23l18.5-2z" fill="url(#chr${s})" stroke="${L}" stroke-width="1.5" stroke-linejoin="round"/>${V(30,18,10,4)}`,heart:s=>`<path d="M32 56C14 42 6 32 6 21a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 11-8 21-26 35z" fill="url(#rd${s})" stroke="${L}" stroke-width="1.5"/>${V(20,18,7,4)}${V(44,18,7,4)}`,chandrakor:s=>`<path d="M40 8a25 25 0 1 0 0 48 20 20 0 1 1 0-48z" fill="url(#gd${s})" stroke="${L}" stroke-width="1.5"/><circle cx="46" cy="18" r="2" fill="#fff"/><circle cx="52" cy="30" r="1.4" fill="#fff"/>`,nath:s=>`
    <path d="M14 40C10 22 26 8 42 12c10 3 12 14 6 20" fill="none" stroke="url(#gd${s})" stroke-width="5" stroke-linecap="round"/>
    ${[[14,40],[12,30],[16,21],[23,14],[32,11],[41,12],[48,18],[50,26]].map(([t,e])=>`<circle cx="${t}" cy="${e}" r="3" fill="#fffaf0" stroke="${L}" stroke-width=".8"/>`).join("")}
    <path d="M26 30l6-6 6 6-6 6z" fill="url(#pk${s})" stroke="${L}" stroke-width="1"/>
    <circle cx="20" cy="45" r="2.4" fill="url(#em${s})" stroke="${L}" stroke-width=".8"/>
    <circle cx="32" cy="42" r="2.4" fill="#fffaf0" stroke="${L}" stroke-width=".8"/>`,bangles:s=>[0,1,2,3,4].map(t=>`<ellipse cx="32" cy="${18+t*7}" rx="22" ry="7" fill="none" stroke="url(#${["pk","gd","em","gd","rd"][t]}${s})" stroke-width="4.5"/>`).join("")+V(24,16,8,2),cassette:s=>`
    <rect x="6" y="14" width="52" height="36" rx="4" fill="url(#pp${s})" stroke="${L}" stroke-width="1.5"/>
    <rect x="12" y="19" width="40" height="11" rx="2" fill="#f4e1bf"/>
    <text x="32" y="27.5" font-size="7" text-anchor="middle" font-family="VT323, monospace" fill="${L}">MIX '04</text>
    <rect x="16" y="33" width="32" height="11" rx="5" fill="#2a0e25"/>
    <circle cx="23" cy="38.5" r="3.5" fill="url(#chr${s})"/><circle cx="41" cy="38.5" r="3.5" fill="url(#chr${s})"/>`,peacock:s=>`
    <path d="M30 50c-12 0-20-8-18-18 2-8 10-10 14-6" fill="none" stroke="url(#em${s})" stroke-width="5" stroke-linecap="round"/>
    <path d="M26 26c4-8 14-8 16 0 2 8-4 14-12 14" fill="url(#tq${s})" stroke="${L}" stroke-width="1.5"/>
    <path d="M40 26c2-6 2-12 6-16" stroke="url(#tq${s})" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="10" r="3" fill="url(#gd${s})"/><circle cx="42" cy="7" r="2" fill="url(#gd${s})"/><circle cx="49" cy="14" r="2" fill="url(#gd${s})"/>
    <circle cx="44" cy="20" r="1.5" fill="${L}"/><path d="M47 22l5 1-5 1z" fill="url(#gd${s})"/>
    ${[[14,44],[12,34],[20,50]].map(([t,e])=>`<circle cx="${t}" cy="${e}" r="4" fill="url(#gd${s})" stroke="${L}" stroke-width=".8"/><circle cx="${t}" cy="${e}" r="1.6" fill="url(#pp${s})"/>`).join("")}`,lotus:s=>`
    <path d="M32 50C20 44 16 30 32 12c16 18 12 32 0 38z" fill="url(#pk${s})" stroke="${L}" stroke-width="1.5"/>
    <path d="M32 50C18 50 6 40 8 26c12 4 20 12 24 24zM32 50c14 0 26-10 24-24-12 4-20 12-24 24z" fill="url(#pk${s})" stroke="${L}" stroke-width="1.5" opacity=".9"/>
    <path d="M14 54h36" stroke="url(#em${s})" stroke-width="4" stroke-linecap="round"/>`,flipphone:s=>`
    <rect x="18" y="4" width="28" height="26" rx="6" fill="url(#chr${s})" stroke="${L}" stroke-width="1.5"/>
    <rect x="23" y="9" width="18" height="15" rx="2" fill="url(#tq${s})"/>
    <rect x="18" y="32" width="28" height="28" rx="6" fill="url(#pk${s})" stroke="${L}" stroke-width="1.5"/>
    ${[0,1,2].flatMap(t=>[0,1,2].map(e=>`<rect x="${23+e*7}" y="${37+t*7}" width="5" height="4" rx="1.5" fill="#fff" opacity=".8"/>`)).join("")}
    ${V(32,8,10,2)}`,kairi:s=>`
    <path d="M40 8c14 10 16 34-2 44-14 8-30 0-28-14 2-12 18-10 20-20 1-4 0-8 10-10z" fill="url(#em${s})" stroke="${L}" stroke-width="1.5"/>
    <path d="M38 14c8 8 10 26-4 32-10 4-20-2-18-10" fill="none" stroke="url(#gd${s})" stroke-width="2.5"/>
    <circle cx="30" cy="34" r="4" fill="url(#gd${s})"/>`,sparkle:s=>`<path d="M32 2c3 20 10 27 30 30-20 3-27 10-30 30-3-20-10-27-30-30 20-3 27-10 30-30z" fill="url(#chr${s})" stroke="${L}" stroke-width="1.5"/>`},Jt=Object.keys(gt),dt={butterfly:"Butterfly",star:"Chrome star",heart:"Candy heart",chandrakor:"Chandrakor (crescent)",nath:"Nath (nose ring)",bangles:"Bangles",cassette:"Mixtape '04",peacock:"Mor (peacock)",lotus:"Lotus",flipphone:"Flip phone",kairi:"Kairi (mango buta)",sparkle:"Sparkle"};function Pt(s,t,e){const a=`k${++Qt}`;return`<svg viewBox="0 0 64 64" width="${t}" height="${t}" role="img" aria-label="${e}" xmlns="http://www.w3.org/2000/svg">${Zt(a)}${s(a)}</svg>`}const et=(s,t=48)=>Pt(xt[s]??xt.about,t,s),$t=(s,t=64)=>Pt(gt[s]??gt.star,t,dt[s]??s);function nt(s){const t=document.createElement("template");return t.innerHTML=s.trim(),t.content.firstElementChild}function te(s,t){let e;const a=(...i)=>{clearTimeout(e),e=setTimeout(()=>s(...i),t)};return a.flush=()=>{clearTimeout(e)},a}const ot='Original work by Shriya Shekatkar · SHRIYA.EXE · Synthetic or demo data is labeled as such. Not affiliated with any film, studio or company. · <a href="https://shriyashekatkar25-byte.github.io/shriya-exe/" target="_blank" rel="noopener">Studio gallery ↗</a>',ee={id:"settings",title:"Rangroop",deva:"रंगरूप",blurb:"themes, wallpaper, sound & motion",icon:"settings",w:600,h:540,minW:320,minH:340,mount(s,t){const e=nt(`<div class="sys">
      <section><h2>Theme <span class="deva">रंग</span></h2>
        <div class="sys__themes" role="radiogroup" aria-label="Theme">
          ${qt.map(o=>`<button class="theme-card" role="radio" data-theme-pick="${o.id}">
            <span class="theme-card__sw">${o.shader.map(([c,d,b])=>`<i style="background:rgb(${c*255},${d*255},${b*255})"></i>`).join("")}</span>
            <b>${o.name}</b><small>${o.tagline}</small></button>`).join("")}
        </div></section>
      <section><h2>Wallpaper <span class="deva">पार्श्वभूमी</span></h2>
        <div class="sys__walls" role="radiogroup" aria-label="Wallpaper">
          ${wt.map(o=>`<button class="pill" role="radio" data-wall="${o.id}" title="${o.note}">${o.name}</button>`).join("")}
        </div><p class="sys__hint" data-wall-note></p></section>
      <section><h2>Sound & motion</h2>
        <div class="sys__rows">
          <label class="sys__switch"><input type="checkbox" data-k="sounds"><span></span> Interface sounds (synthesised bells)</label>
          <label class="sys__switch"><input type="checkbox" data-k="skipBoot"><span></span> Skip the boot sequence</label>
          <label class="sys__sel">Motion
            <select class="field" data-k="motion"><option value="auto">Follow my device</option><option value="full">Full cinematic</option><option value="reduced">Reduced</option></select></label>
        </div></section>
      <section><h2>Storage</h2>
        <p class="sys__hint">${t.persistent?"Saving to this browser’s local storage. Nothing is sent anywhere.":"Local storage is blocked here, so changes last only until you close the tab."}</p>
        <button class="btn" data-act="wipe">Erase all KHIDKI data…</button></section>
    </div>`);s.append(e);const a=()=>{const o=t.settings.value;e.querySelectorAll("[data-theme-pick]").forEach(c=>c.setAttribute("aria-checked",String(c.dataset.themePick===o.theme))),e.querySelectorAll("[data-wall]").forEach(c=>c.setAttribute("aria-checked",String(c.dataset.wall===o.wallpaper))),e.querySelector("[data-wall-note]").textContent=wt.find(c=>c.id===o.wallpaper).note+".",e.querySelector('[data-k="sounds"]').checked=o.sounds,e.querySelector('[data-k="skipBoot"]').checked=o.skipBoot,e.querySelector('[data-k="motion"]').value=o.motion};let i=!1;return e.addEventListener("click",o=>{const c=o.target,d=c.closest("[data-theme-pick]")?.dataset.themePick;d&&t.settings.set("theme",d);const b=c.closest("[data-wall]")?.dataset.wall;b&&t.settings.set("wallpaper",b);const p=c.closest('[data-act="wipe"]');if(p){if(!i){i=!0,p.textContent="Click again to erase diary, board & settings",p.classList.add("btn--danger");return}["diary","diarySeeded","board","taal","settings","welcomed"].forEach(M=>t.store.clear(M)),t.toast("All local data erased. Restarting…"),setTimeout(()=>location.reload(),900)}a()}),e.addEventListener("change",o=>{const c=o.target;(c.dataset.k==="sounds"||c.dataset.k==="skipBoot")&&t.settings.set(c.dataset.k,c.checked),c.dataset.k==="motion"&&t.settings.set("motion",c.value)}),a(),()=>{}}},ae={id:"about",title:"Swagat",deva:"स्वागत",blurb:"welcome, manifesto & shortcuts",icon:"about",w:560,h:560,minW:320,minH:320,mount(s,t){return s.append(nt(`<div class="about">
      <header class="about__hero">
        <p class="about__kicker">SHRIYA.EXE · drop 001</p>
        <h1>KHIDKI <em>2004</em></h1>
        <p class="deva about__deva">खिडकी — a window</p>
      </header>
      <p class="about__lede">An operating system that never shipped, from an internet that half-existed: the glossy, glitter-dusted
      desi web of 2004 — cybercafé afternoons, ringtone countdowns, diaries kept in password-protected folders — rebuilt with today's tools.</p>
      <h2>What is real here</h2>
      <ul>
        <li><b>Window manager</b> — a tested state machine with an explicit z-order stack, drag, resize, minimise, maximise and keyboard control.</li>
        <li><b>Wallpaper</b> — a WebGL fragment shader (domain-warped noise, a 16-fold rangoli lattice, raindrops on glass) with adaptive resolution.</li>
        <li><b>Dainandini</b> — local-only diary with BM25 full-text search that handles Devanagari.</li>
        <li><b>TAAL.FM</b> — every sound is synthesised live; look-ahead audio scheduling; a Markov-chain melody walking a raga's note set.</li>
        <li><b>Aathavani</b> — a scrapbook in resolution-independent coordinates, saved to your browser.</li>
      </ul>
      <h2>Keyboard</h2>
      <dl class="about__keys">
        <dt>Alt + \`</dt><dd>cycle windows</dd><dt>Alt + Q</dt><dd>close focused window</dd>
        <dt>Alt + M</dt><dd>minimise focused window</dd><dt>Alt + S</dt><dd>open the सुरू menu</dd>
        <dt>Arrows on a title bar</dt><dd>move window (Shift: resize)</dd><dt>Enter on an icon</dt><dd>open app</dd>
      </dl>
      <p class="about__fine">Nothing you write leaves this browser. No cookies, no analytics, no accounts. Every icon, sticker, sound and
      pattern is original procedural work; references used for research are listed in CREDITS.md.</p>
      <footer class="about__foot">${ot}</footer>
      <p><button class="btn btn--hot" data-act="diary">Open the diary</button> <button class="btn" data-act="taal">Play TAAL.FM</button></p>
    </div>`)),s.addEventListener("click",e=>{const a=e.target.closest("[data-act]")?.dataset.act;a&&t.open(a)}),()=>{}}},se='<svg viewBox="0 0 12 12"><path d="M2 9h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',oe='<svg viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',ie='<svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',ne=s=>`<svg viewBox="0 0 20 20"><path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/>${s?'<path d="M13 7a4 4 0 0 1 0 6M15 5a7 7 0 0 1 0 10" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>':'<path d="M13 7l5 6M18 7l-5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'}</svg>`,re='<svg viewBox="0 0 64 64"><path d="M40 8a25 25 0 1 0 0 48 20 20 0 1 1 0-48z" fill="#fff"/></svg>',Q=()=>matchMedia("(max-width: 720px)").matches,Mt=56;function le(s,t){const e=new Map(s.map(n=>[n.id,n])),a=new Xt({w:innerWidth,h:innerHeight,bottomInset:Q()?0:Mt}),i=new Map,o={...t,open:n=>h(n)},c=s.filter(n=>n.id!=="power"),d=document.createElement("main");d.className="desktop",d.setAttribute("aria-label","KHIDKI 2004 desktop"),d.innerHTML=`
    <ul class="icons" role="listbox" aria-label="Desktop" aria-orientation="vertical">
      ${c.map((n,l)=>`<li role="none"><button class="icon" role="option" aria-selected="false" data-app="${n.id}" tabindex="${l?-1:0}"
        aria-label="${n.title} — ${n.blurb}">${et(n.icon,52)}<span class="icon__label">${n.title}<span class="icon__deva">${n.deva}</span></span></button></li>`).join("")}
    </ul>
    <div class="desk-mark" aria-hidden="true"><span class="deva">खिडकी</span><b>KHIDKI 2004</b><span>a desktop from a dreamed-up internet</span></div>
    <div class="windows"></div>`;const b=d.querySelector(".windows"),p=document.createElement("div");p.className="launcher",p.innerHTML=`
    <div class="statusbar" aria-hidden="true"><span>KHIDKI mobile</span><span class="m-clock"></span></div>
    <div class="launcher__hero"><span class="deva">खिडकी</span><b>KHIDKI</b><span>2004, in your pocket</span></div>
    <ul class="launcher__grid" aria-label="Apps">${s.map(n=>`<li><button class="icon" data-app="${n.id}" aria-label="${n.title} — ${n.blurb}">${et(n.icon,58)}<span class="icon__label">${n.title}<span class="icon__deva">${n.deva}</span></span></button></li>`).join("")}</ul>
    <p class="launcher__foot">${ot}</p>`;const M=document.createElement("nav");M.className="taskbar",M.setAttribute("aria-label","Taskbar"),M.innerHTML=`
    <button class="start" aria-haspopup="menu" aria-expanded="false" aria-controls="startmenu" title="Start (Alt+S)"><span class="orb">${re}</span><span class="deva">सुरू</span></button>
    <div class="tasks" role="toolbar" aria-label="Open windows"></div>
    <div class="tray"><button class="snd" aria-label="Toggle interface sounds"></button><time class="clock" aria-label="Clock"></time></div>`;const g=document.createElement("div");g.className="startmenu",g.id="startmenu",g.hidden=!0,g.setAttribute("role","menu"),g.innerHTML=`
    <div class="sm-head"><b>Namaskar, Shriya</b><span>the year is always 2004 here</span></div>
    <ul class="sm-list">${s.map(n=>`<li role="none"><button class="sm-item" role="menuitem" data-app="${n.id}">${et(n.icon,36)}<span><b>${n.title} <span class="deva">${n.deva}</span></b><small>${n.blurb}</small></span></button></li>`).join("")}</ul>
    <div class="sm-foot"><span>${ot}</span></div>`;const E=document.createElement("div");E.className="toast",E.setAttribute("role","status"),E.setAttribute("aria-live","polite"),document.body.append(d,p,M,g,E);const r=M.querySelector(".tasks"),m=M.querySelector(".start");function h(n){const l=e.get(n);if(!l)return;if(l.id==="power"){q(),t.shutdown();return}const f=a.findByApp(n);if(f){a.focus(f.id);return}const w=a.open({appId:n,title:l.title,w:l.w,h:l.h,minW:l.minW,minH:l.minH,singleton:!0});Q()&&a.toggleMaximize(w.id),D.ui("open"),q()}function S(n,l){const f=document.createElement("section");f.className="win",f.dataset.id=n.id,f.setAttribute("role","dialog"),f.setAttribute("aria-labelledby",`${n.id}-t`),f.innerHTML=`
      <header class="titlebar" tabindex="0" aria-label="${l.title} title bar. Arrow keys move, Shift plus arrows resize.">
        <span class="titlebar__icon" aria-hidden="true">${et(l.icon,22)}</span>
        <span class="titlebar__title" id="${n.id}-t">${l.title}<span class="deva">${l.deva}</span></span>
        <button class="wbtn wbtn--min" aria-label="Minimise">${se}</button>
        <button class="wbtn wbtn--max" aria-label="Maximise">${oe}</button>
        <button class="wbtn wbtn--close" aria-label="Close">${ie}</button>
      </header>
      <div class="win-body"></div>
      <div class="resize resize--e" data-edge="e" aria-hidden="true"></div>
      <div class="resize resize--s" data-edge="s" aria-hidden="true"></div>
      <div class="resize resize--se" data-edge="se" aria-hidden="true"></div>`;const w=f.querySelector(".win-body"),y=f.querySelector(".titlebar");f.addEventListener("pointerdown",()=>a.focused()?.id!==n.id&&a.focus(n.id),!0),f.querySelector(".wbtn--min").addEventListener("click",()=>{a.minimize(n.id),D.ui("minimize")}),f.querySelector(".wbtn--max").addEventListener("click",()=>{a.toggleMaximize(n.id),D.ui("click")}),f.querySelector(".wbtn--close").addEventListener("click",()=>_(n.id)),y.addEventListener("dblclick",v=>{v.target.closest(".wbtn")||a.toggleMaximize(n.id)}),y.addEventListener("pointerdown",v=>{if(v.target.closest(".wbtn")||Q()||v.button!==0)return;const $=a.get(n.id);if($.maximized)return;const N=v.clientX-$.x,Z=v.clientY-$.y;y.setPointerCapture(v.pointerId);const W=Y=>a.moveTo(n.id,Y.clientX-N,Y.clientY-Z),U=()=>{y.removeEventListener("pointermove",W),y.removeEventListener("pointerup",U)};y.addEventListener("pointermove",W),y.addEventListener("pointerup",U)}),f.querySelectorAll(".resize").forEach(v=>v.addEventListener("pointerdown",$=>{$.stopPropagation();const N=a.get(n.id),Z=v.dataset.edge,W=$.clientX,U=$.clientY,Y=N.w,z=N.h;v.setPointerCapture($.pointerId);const O=K=>a.resizeTo(n.id,Z.includes("e")?Y+K.clientX-W:Y,Z.includes("s")?z+K.clientY-U:z),j=()=>{v.removeEventListener("pointermove",O),v.removeEventListener("pointerup",j)};v.addEventListener("pointermove",O),v.addEventListener("pointerup",j)})),y.addEventListener("keydown",v=>{const $={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]};if(!$[v.key])return;v.preventDefault();const N=a.get(n.id);v.shiftKey?a.resizeTo(n.id,N.w+$[v.key][0],N.h+$[v.key][1]):a.moveBy(n.id,$[v.key][0],$[v.key][1])});const T=l.mount(w,o);return{el:f,cleanup:T}}function _(n){const l=i.get(n);D.ui("close"),l&&!t.reduced()?(l.el.classList.add("closing"),setTimeout(()=>a.close(n),130)):a.close(n)}let C="";function R(){const n=new Set(a.list().map(y=>y.id));for(const[y,T]of i)n.has(y)||(T.cleanup(),T.el.remove(),i.delete(y));const l=a.focused();a.list().forEach((y,T)=>{let v=i.get(y.id);v||(v=S(y,e.get(y.appId)),i.set(y.id,v),b.append(v.el));const $=v.el;$.style.setProperty("--tx",`${y.x}px`),$.style.setProperty("--ty",`${y.y}px`),$.style.transform=`translate(${y.x}px, ${y.y}px)`,$.style.width=`${y.w}px`,$.style.height=`${y.h}px`,$.style.zIndex=String(100+T),$.classList.toggle("focused",l?.id===y.id),$.classList.toggle("minimized",y.minimized),$.classList.toggle("maximized",y.maximized),$.querySelector(".wbtn--max").setAttribute("aria-label",y.maximized?"Restore":"Maximise")});const f=[...a.list()].sort((y,T)=>Number(y.id.slice(4))-Number(T.id.slice(4))),w=f.map(y=>`${y.id}:${y.minimized}:${l?.id===y.id}`).join("|");w!==C&&(r.innerHTML=f.map(y=>{const T=e.get(y.appId);return`<button class="task ${y.minimized?"min":""}" data-win="${y.id}" aria-pressed="${l?.id===y.id}">${et(T.icon,22)}<span>${T.title}</span></button>`}).join("")),C=w,p.classList.toggle("covered",Q()&&!!l)}a.onChange(R);function I(){g.hidden=!1,m.setAttribute("aria-expanded","true"),g.querySelector(".sm-item")?.focus(),D.ui("click")}function q(){g.hidden||(g.hidden=!0,m.setAttribute("aria-expanded","false"))}m.addEventListener("click",()=>g.hidden?I():q()),g.addEventListener("keydown",n=>{const l=[...g.querySelectorAll(".sm-item")],f=l.indexOf(document.activeElement);n.key==="ArrowDown"&&(n.preventDefault(),l[(f+1)%l.length].focus()),n.key==="ArrowUp"&&(n.preventDefault(),l[(f-1+l.length)%l.length].focus()),n.key==="Escape"&&(q(),m.focus())}),document.addEventListener("pointerdown",n=>{!g.hidden&&!g.contains(n.target)&&!m.contains(n.target)&&q()}),document.body.addEventListener("click",n=>{const l=n.target,f=l.closest("[data-app]");f&&(f.closest(".sm-list")||f.closest(".launcher"))?h(f.dataset.app):f?.closest(".icons")&&k(f);const w=l.closest("[data-win]");w&&(a.toggleFromTaskbar(w.dataset.win),D.ui("click"))});const P=d.querySelector(".icons"),B=[...P.querySelectorAll(".icon")];function k(n){B.forEach(l=>{l.setAttribute("aria-selected",String(l===n)),l.tabIndex=l===n?0:-1}),n.focus()}P.addEventListener("dblclick",n=>{const l=n.target.closest("[data-app]");l&&h(l.dataset.app)}),P.addEventListener("keydown",n=>{const l=B.indexOf(document.activeElement);l<0||((n.key==="Enter"||n.key===" ")&&(n.preventDefault(),h(B[l].dataset.app)),(n.key==="ArrowDown"||n.key==="ArrowRight")&&(n.preventDefault(),k(B[(l+1)%B.length])),(n.key==="ArrowUp"||n.key==="ArrowLeft")&&(n.preventDefault(),k(B[(l-1+B.length)%B.length])))}),P.addEventListener("pointerup",n=>{if(n.pointerType==="touch"){const l=n.target.closest("[data-app]");l&&h(l.dataset.app)}}),addEventListener("keydown",n=>{if(!n.altKey)return;const l=n.key.toLowerCase(),f=a.focused();l==="`"||n.code==="Backquote"?(n.preventDefault(),a.cycle()):l==="q"&&f?(n.preventDefault(),_(f.id)):l==="m"&&f?(n.preventDefault(),a.minimize(f.id)):l==="s"&&(n.preventDefault(),g.hidden?I():q())}),addEventListener("keydown",n=>{n.key==="Escape"&&Q()&&a.focused()&&!n.target.closest("input,textarea,select")&&a.minimize(a.focused().id)});const F=M.querySelector(".snd"),H=()=>{F.innerHTML=ne(t.settings.value.sounds),F.setAttribute("aria-pressed",String(t.settings.value.sounds))};F.addEventListener("click",()=>t.settings.set("sounds",!t.settings.value.sounds)),t.settings.onChange(H),H();const u=[M.querySelector(".clock"),p.querySelector(".m-clock")],x=()=>{const n=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});u.forEach(l=>l.textContent=n)};x(),setInterval(x,15e3);const A=()=>document.querySelectorAll(".wbtn--min").forEach(n=>n.setAttribute("aria-label",Q()?"Back to home":"Minimise"));return addEventListener("resize",()=>{a.setViewport({w:innerWidth,h:innerHeight,bottomInset:Q()?0:Mt}),A()}),a.onChange(A),{wm:a,open:h,toast:t.toast,elements:{desktop:d,taskbar:M,launcher:p,menu:g}}}const bt=["glitter","monsoon","filmi","chai","blue"],_t="diary";function st(s){return(s.toLowerCase().normalize("NFC").match(/[\p{L}\p{M}\p{N}]+/gu)??[]).filter(t=>t.length>0)}function ce(s){return[...new Set(s.split(/[,#\s]+/).map(t=>t.trim().toLowerCase()).filter(Boolean))].slice(0,8)}class de{constructor(t,e=Date.now){this.store=t,this.now=e,this.entries=t.read(_t,[])}all(){return[...this.entries].sort((t,e)=>e.created-t.created)}get(t){return this.entries.find(e=>e.id===t)}count(){return this.entries.length}create(t={}){const e=this.now(),a={id:`e${e.toString(36)}${Math.random().toString(36).slice(2,6)}`,title:t.title??"",body:t.body??"",mood:t.mood??"glitter",tags:t.tags??[],created:e,updated:e};return this.entries.push(a),this.save(),a}update(t,e){const a=this.get(t);if(a)return Object.assign(a,e,{updated:this.now()}),this.save(),a}remove(t){const e=this.entries.length;this.entries=this.entries.filter(a=>a.id!==t),this.entries.length!==e&&this.save()}moodCounts(){const t=Object.fromEntries(bt.map(e=>[e,0]));for(const e of this.entries)t[e.mood]++;return t}search(t,e){const a=e?this.entries.filter(o=>o.tags.includes(e)):this.entries,i=st(t);return i.length===0?a.map(o=>({entry:o,score:0})).sort((o,c)=>c.entry.created-o.entry.created):he(a,i)}save(){this.store.write(_t,this.entries)}}function ue(s){const t=st(s.title);return[...t,...t,...st(s.body),...s.tags.flatMap(st)]}function he(s,t,e=1.4,a=.75){const i=s.map(g=>({e:g,toks:ue(g)})),o=i.length;if(o===0)return[];const c=i.reduce((g,E)=>g+E.toks.length,0)/o||1,d=t.length-1,b=(g,E)=>{const r=t[E];let m=0;for(const h of g)(h===r||E===d&&r.length>=2&&h.startsWith(r))&&m++;return m},M=t.map((g,E)=>i.filter(r=>b(r.toks,E)>0).length).map(g=>Math.log(1+(o-g+.5)/(g+.5)));return i.map(({e:g,toks:E})=>{let r=0;for(let m=0;m<t.length;m++){const h=b(E,m);h!==0&&(r+=M[m]*(h*(e+1)/(h+e*(1-a+a*E.length/c))))}return{entry:g,score:r}}).filter(g=>g.score>0).sort((g,E)=>E.score-g.score||E.entry.created-g.entry.created)}function X(s){return s.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function St(s,t){const e=st(t).filter(i=>i.length>=2);if(e.length===0)return X(s);const a=new RegExp(`(${e.map(i=>i.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"giu");return s.split(a).map((i,o)=>o%2?`<mark>${X(i)}</mark>`:X(i)).join("")}const pt={glitter:"Glitter",monsoon:"Monsoon",filmi:"Filmi",chai:"Chai",blue:"Blue"},At=s=>new Date(s).toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"}),pe={id:"diary",title:"Dainandini",deva:"दैनंदिनी",blurb:"a diary that never leaves this browser",icon:"diary",w:760,h:520,minW:340,minH:320,mount(s,t){const e=new de(t.store);e.count()===0&&!t.store.read("diarySeeded",!1)&&(e.create({title:"Pehla panna — the first page",body:`This is a sample page written by KHIDKI itself. Delete it, or write over it.

Everything you type here is saved in this browser only — nothing is uploaded. Try the search box: it ranks pages with BM25, the same family of scoring used by real search engines, and it understands Devanagari too: पाऊस, चहा, गाणी.`,mood:"glitter",tags:["sample","welcome"]}),t.store.write("diarySeeded",!0));let a=e.all()[0]?.id??null,i="",o,c=!1;const d=nt(`
      <div class="diary">
        <aside class="diary__side" aria-label="Diary pages">
          <div class="diary__search">
            <label class="sr-only" for="dsearch">Search diary</label>
            <input id="dsearch" class="field" type="search" placeholder="Search pages…" autocomplete="off">
            <button class="btn btn--hot" data-act="new" title="New page (Alt+N)">+ Page</button>
          </div>
          <div class="diary__tags" role="group" aria-label="Filter by tag"></div>
          <ol class="diary__list" role="listbox" aria-label="Pages"></ol>
          <div class="diary__moods" aria-label="Mood ledger"></div>
        </aside>
        <article class="diary__page" aria-live="off">
          <div class="diary__empty empty" hidden>Your diary is empty.<br>Every page you write stays in this browser — nothing is uploaded.<br><br><button class="btn btn--hot" data-act="new">Write the first page</button></div>
          <form class="diary__editor" autocomplete="off">
            <div class="diary__meta">
              <button type="button" class="btn diary__back" data-act="back" aria-label="Back to pages">‹ Pages</button>
              <span class="diary__date"></span>
              <span class="diary__saved" aria-live="polite"></span>
            </div>
            <label class="sr-only" for="dtitle">Title</label>
            <input id="dtitle" class="diary__title" placeholder="Untitled page" maxlength="120">
            <div class="diary__moodpick" role="radiogroup" aria-label="Mood">
              ${bt.map(u=>`<button type="button" class="pill mood-${u}" role="radio" data-mood="${u}">${pt[u]}</button>`).join("")}
            </div>
            <label class="sr-only" for="dbody">Page text</label>
            <textarea id="dbody" class="diary__body" placeholder="Aaj kya hua? What happened today…"></textarea>
            <div class="diary__foot">
              <label class="label" for="dtags">Tags</label>
              <input id="dtags" class="field" placeholder="monsoon, college, filmi">
              <button type="button" class="btn" data-act="delete">Delete</button>
            </div>
          </form>
        </article>
      </div>`);s.append(d);const b=u=>d.querySelector(u),p=b("#dsearch"),M=b(".diary__list"),g=b(".diary__tags"),E=b(".diary__moods"),r=b(".diary__editor"),m=b("#dtitle"),h=b("#dbody"),S=b("#dtags"),_=b(".diary__saved"),C=b('[data-act="delete"]'),R=()=>{a&&(e.update(a,{title:m.value,body:h.value,tags:ce(S.value)}),_.textContent="saved ✓",P(),q())},I=te(R,450);function q(){const u=[...new Set(e.all().flatMap(n=>n.tags))].sort();g.innerHTML=u.length?u.map(n=>`<button class="pill" aria-pressed="${n===o}" data-tag="${X(n)}">#${X(n)}</button>`).join(""):"";const x=e.moodCounts(),A=Math.max(1,...Object.values(x));E.innerHTML='<span class="label">Mood ledger</span>'+bt.map(n=>`<span class="mbar mood-${n}" title="${pt[n]}: ${x[n]}"><i style="height:${x[n]/A*100}%"></i><small>${pt[n][0]}</small></span>`).join("")}function P(){const u=e.search(i,o);if(u.length===0){M.innerHTML=`<li class="empty">${i?`No page mentions “${X(i)}”.`:"No pages yet."}</li>`;return}M.innerHTML=u.map(({entry:x,score:A})=>{const n=x.body.replace(/\s+/g," ").slice(0,110);return`<li role="option" tabindex="0" aria-selected="${x.id===a}" data-id="${x.id}" class="mood-${x.mood}">
          <b>${St(x.title||"Untitled page",i)}</b>
          <small>${At(x.created)}${i?` · score ${A.toFixed(2)}`:""}</small>
          <span>${St(n,i)}</span></li>`}).join("")}function B(){const u=a?e.get(a):void 0;b(".diary__empty").hidden=!!u,r.hidden=!u,u||d.classList.remove("editing"),u&&(m.value=u.title,h.value=u.body,S.value=u.tags.join(", "),b(".diary__date").textContent=At(u.created),_.textContent="",c=!1,C.textContent="Delete",C.classList.remove("btn--danger"),d.querySelectorAll("[data-mood]").forEach(x=>x.setAttribute("aria-checked",String(x.dataset.mood===u.mood))))}const k=u=>{I.flush(),R(),a=u,d.classList.add("editing"),B(),P()};function F(){I.flush(),a&&R(),a=e.create({mood:"glitter"}).id,i="",p.value="",o=void 0,d.classList.add("editing"),H(),m.focus(),D.ui("open")}function H(){q(),P(),B()}return d.addEventListener("click",u=>{const x=u.target,A=x.closest("[data-act]")?.dataset.act;if(A==="new"&&F(),A==="back"&&d.classList.remove("editing"),A==="delete"&&a){if(!c){c=!0,C.textContent="Really delete?",C.classList.add("btn--danger");return}e.remove(a),D.ui("close"),a=e.all()[0]?.id??null,H(),t.toast("Page deleted.")}const n=x.closest("li[data-id]");n&&k(n.dataset.id);const l=x.closest("[data-mood]")?.dataset.mood;l&&a&&(e.update(a,{mood:l}),D.ui("click"),B(),P(),q());const f=x.closest("[data-tag]")?.dataset.tag;f&&(o=o===f?void 0:f,q(),P())}),M.addEventListener("keydown",u=>{const x=u.target.closest("li[data-id]");x&&((u.key==="Enter"||u.key===" ")&&(u.preventDefault(),k(x.dataset.id),m.focus()),u.key==="ArrowDown"&&(u.preventDefault(),x.nextElementSibling?.focus()),u.key==="ArrowUp"&&(u.preventDefault(),x.previousElementSibling?.focus()))}),d.addEventListener("keydown",u=>{u.altKey&&u.key.toLowerCase()==="n"&&(u.preventDefault(),F())}),p.addEventListener("input",()=>{i=p.value,P()}),[m,h,S].forEach(u=>u.addEventListener("input",()=>{_.textContent="typing…",I()})),r.addEventListener("submit",u=>u.preventDefault()),H(),t.persistent||t.toast("Storage is blocked in this browser — diary pages will vanish when you close the tab."),()=>{I.flush(),a&&R()}}},Et=[{id:"yaman",name:"Yaman",devanagari:"यमन",mood:"evening, tender",notes:[0,2,4,6,7,9,11]},{id:"bhupali",name:"Bhupali",devanagari:"भूपाळी",mood:"open, devotional",notes:[0,2,4,7,9]},{id:"bhairavi",name:"Bhairavi",devanagari:"भैरवी",mood:"farewell, bittersweet",notes:[0,1,3,5,7,8,10]},{id:"megh",name:"Megh",devanagari:"मेघ",mood:"monsoon clouds",notes:[0,2,5,7,10]}],fe={Dha:["bayan","dayan"],Dhin:["bayan","tin"],Dhi:["bayan","tin"],Ge:["bayan"],Na:["dayan"],Ta:["dayan"],Tin:["tin"],Ti:["tik"],Ke:["tik"],"-":[]},ft=[{id:"keherwa",name:"Keherwa",beats:8,bols:["Dha","Ge","Na","Ti","Na","Ke","Dhi","Na"],vibhag:[0,4]},{id:"dadra",name:"Dadra",beats:6,bols:["Dha","Dhi","Na","Dha","Ti","Na"],vibhag:[0,3]},{id:"teentaal",name:"Teentaal",beats:16,bols:["Dha","Dhin","Dhin","Dha","Dha","Dhin","Dhin","Dha","Dha","Tin","Tin","Ta","Ta","Dhin","Dhin","Dha"],vibhag:[0,4,8,12]}],at=["bayan","dayan","tin","tik"];function mt(s){const t=Object.fromEntries(at.map(e=>[e,new Array(s.beats).fill(!1)]));return s.bols.forEach((e,a)=>(fe[e]??[]).forEach(i=>t[i][a]=!0)),t}const Lt=(s,t)=>s*Math.pow(2,t/12);function me(s){let t=s>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function rt(s,t,e,a=.18){const i=me(e),o=[...s.notes,...s.notes.map(p=>p+12),24],c=p=>p%12===0||p%12===7,d=[];let b=o.indexOf(12)>=0?o.indexOf(12):0;for(let p=0;p<t.beats*2;p++){const M=p%2===0&&t.vibhag.includes(p/2)?1:0;if(p>0&&!M&&i()<a){d.push(null);continue}const g=o.map((E,r)=>{const m=Math.abs(r-b);return Math.exp(-m/1.3)*(1+2.5*(c(E)?1:0)*M)*(r===b?.35:1)});b=ge(g,i()),d.push(o[b])}return d[d.length-1]=12,d}function ge(s,t){const e=s.reduce((i,o)=>i+o,0);let a=0;for(let i=0;i<s.length;i++)if(a+=s[i]/e,t<a)return i;return s.length-1}const be=["Sa","re","Re","ga","Ga","ma","Ma","Pa","dha","Dha","ni","Ni"],Tt=s=>be[(s%12+12)%12]+(s>=12?s>=24?"''":"'":""),Ct={bayan:"Bayan · bass",dayan:"Dayan · ring",tin:"Tin · muted",tik:"Ti-ke · click"},lt=138.59,ve={id:"taal",title:"TAAL.FM",deva:"ताल",blurb:"synth tabla, tanpura & raga-inspired melodies",icon:"taal",w:940,h:580,minW:340,minH:380,mount(s,t){const a=t.store.read("taal",null)??{raga:"yaman",tala:"keherwa",bpm:96,seed:2004,drone:!0,melody:!0,grid:mt(ft[0])},i=()=>ft.find(l=>l.id===a.tala),o=()=>Et.find(l=>l.id===a.raga);let c=rt(o(),i(),a.seed);const d=nt(`
      <div class="taal">
        <div class="taal__stage"><canvas class="taal__viz" role="img" aria-label="Rangoli visualiser reacting to the music"></canvas></div>
        <div class="taal__deck">
          <div class="taal__row">
            <button class="taal__play btn btn--hot" aria-pressed="false" data-act="play">▶ Play</button>
            <label><span class="label">Raga</span>
              <select class="field" data-k="raga">${Et.map(l=>`<option value="${l.id}">${l.name} · ${l.devanagari}</option>`).join("")}</select></label>
            <label><span class="label">Tala</span>
              <select class="field" data-k="tala">${ft.map(l=>`<option value="${l.id}">${l.name} · ${l.beats}</option>`).join("")}</select></label>
            <label class="taal__bpm"><span class="label">Laya <output>${a.bpm}</output> bpm</span>
              <input type="range" min="50" max="170" step="1" data-k="bpm"></label>
          </div>
          <div class="taal__row taal__row--small">
            <button class="pill" data-toggle="drone" aria-pressed="${a.drone}">Tanpura drone</button>
            <button class="pill" data-toggle="melody" aria-pressed="${a.melody}">Melody</button>
            <button class="btn" data-act="reseed" title="Generate a new melody">✦ New melody</button>
            <button class="btn" data-act="theka" title="Reset grid to the traditional theka">Reset theka</button>
            <span class="taal__seed">seed <b></b></span>
          </div>
          <div class="taal__grid" role="grid" aria-label="Step sequencer"></div>
          <p class="taal__note"></p>
        </div>
      </div>`);s.append(d);const b=l=>d.querySelector(l),p=b(".taal__grid"),M=b(".taal__play"),g=b(".taal__viz");b('[data-k="raga"]').value=a.raga,b('[data-k="tala"]').value=a.tala,b('[data-k="bpm"]').value=String(a.bpm);const E=()=>t.store.write("taal",a);function r(){const l=i();p.style.setProperty("--steps",String(l.beats));const f=`<div class="tg-row tg-bols" role="row"><span class="tg-head" role="rowheader">Bol</span>${l.bols.map((v,$)=>`<span class="tg-bol ${l.vibhag.includes($)?"vib":""}" role="columnheader">${v}${$===0?"<sup>sam</sup>":""}</span>`).join("")}</div>`,w=at.map(v=>`<div class="tg-row" role="row"><span class="tg-head" role="rowheader">${Ct[v]}</span>${a.grid[v].map(($,N)=>`<button class="tg-cell v-${v} ${l.vibhag.includes(N)?"vib":""}" role="gridcell" aria-pressed="${$}" aria-label="${Ct[v]} beat ${N+1}" data-v="${v}" data-i="${N}"></button>`).join("")}</div>`).join(""),y=`<div class="tg-row tg-mel" role="row"><span class="tg-head" role="rowheader">Melody</span>${Array.from({length:l.beats},(v,$)=>`<span class="tg-note">${[c[$*2],c[$*2+1]].map(N=>N==null?"·":Tt(N)).join(`
`)}</span>`).join("")}</div>`;p.innerHTML=f+w+y,b(".taal__seed b").textContent=String(a.seed);const T=o();b(".taal__note").innerHTML=`<b>${T.name}</b> <span class="deva">${T.devanagari}</span> — ${T.mood}. Notes: ${T.notes.map(Tt).join(" ")}. Melody: first-order Markov chain favouring stepwise motion, pulled toward Sa/Pa on each vibhag. Raga-<i>inspired</i>: it uses the note set, not the raga's phrases.`}let m=!1,h=0,S=0,_,C=0;const R=[],I=()=>60/a.bpm/2;function q(){const l=D.ctx;for(;S<l.currentTime+.12;){const f=i(),w=h%(f.beats*2);if(w%2===0){const T=w/2;if(at.forEach(v=>a.grid[v][T]&&D.drum(v,S,lt*2,T===0?1.15:.9)),a.drone&&T%2===0){const v=[7,12,12,0];D.tanpura(Lt(lt,v[C++%4]),S)}}const y=c[w];a.melody&&y!=null&&D.pluck(Lt(lt*2,y),S,I()*1.8),R.push({step:w,time:S}),S+=I(),h++}}function P(){const l=D.ensure();if(!l){t.toast("Web Audio is not available in this browser.");return}m=!0,h=0,S=l.currentTime+.06,C=0,_=setInterval(q,25),q(),M.textContent="■ Stop",M.setAttribute("aria-pressed","true")}function B(){m=!1,clearInterval(_),R.length=0,M.textContent="▶ Play",M.setAttribute("aria-pressed","false"),p.querySelectorAll(".now").forEach(l=>l.classList.remove("now"))}d.addEventListener("click",l=>{const f=l.target,w=f.closest(".tg-cell");if(w){const v=w.dataset.v,$=Number(w.dataset.i);a.grid[v][$]=!a.grid[v][$],w.setAttribute("aria-pressed",String(a.grid[v][$])),a.grid[v][$]&&D.ensure()&&D.drum(v,D.ctx.currentTime+.01,lt*2),E()}const y=f.closest("[data-act]")?.dataset.act;y==="play"&&(m?B():P()),y==="reseed"&&(a.seed=Math.floor(Math.random()*99999),c=rt(o(),i(),a.seed),r(),E()),y==="theka"&&(a.grid=mt(i()),r(),E());const T=f.closest("[data-toggle]");if(T){const v=T.dataset.toggle;a[v]=!a[v],T.setAttribute("aria-pressed",String(a[v])),E()}}),d.addEventListener("change",l=>{const f=l.target;f.dataset.k==="raga"&&(a.raga=f.value,c=rt(o(),i(),a.seed)),f.dataset.k==="tala"&&(a.tala=f.value,a.grid=mt(i()),c=rt(o(),i(),a.seed),h=0),r(),E()}),d.addEventListener("input",l=>{const f=l.target;f.dataset.k==="bpm"&&(a.bpm=Number(f.value),b("output").textContent=f.value,E())}),p.addEventListener("keydown",l=>{const f=l.target.closest(".tg-cell");if(!f)return;const w=at.indexOf(f.dataset.v),y=Number(f.dataset.i),T={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowDown:[1,0],ArrowUp:[-1,0]};if(!T[l.key])return;l.preventDefault();const v=at[(w+T[l.key][0]+4)%4],$=(y+T[l.key][1]+i().beats)%i().beats;p.querySelector(`.tg-cell[data-v="${v}"][data-i="${$}"]`)?.focus()});const k=g.getContext("2d");let F=0,H=-1;const u=new Uint8Array(512),x=new Uint8Array(1024),A=getComputedStyle(document.documentElement);function n(l){const f=Math.min(devicePixelRatio||1,2),w=g.clientWidth,y=g.clientHeight;(g.width!==Math.round(w*f)||g.height!==Math.round(y*f))&&(g.width=Math.round(w*f),g.height=Math.round(y*f)),k.setTransform(f,0,0,f,0,0);const T=A.getPropertyValue("--accent").trim()||"#e2007a",v=A.getPropertyValue("--gold").trim()||"#f4e1bf",$=D.analyser;if($&&m)$.getByteFrequencyData(u),$.getByteTimeDomainData(x);else for(let z=0;z<u.length;z++)u[z]=t.reduced()?40:40+30*Math.sin(l/900+z/9);k.fillStyle="rgba(20, 4, 16, 0.32)",k.fillRect(0,0,w,y);const N=w/2,Z=y/2,W=Math.min(w,y)*.46,U=8,Y=t.reduced()?0:l/9e3;k.save(),k.translate(N,Z);for(let z=0;z<U*2;z++){k.save(),k.rotate(z*Math.PI/U+Y),z%2&&k.scale(1,-1),k.beginPath(),k.moveTo(0,0);const O=48;for(let j=0;j<=O;j++){const K=j/O*(Math.PI/U),Ht=u[Math.floor(j/O*180)+2]/255,yt=W*(.25+.75*Ht);k.lineTo(Math.cos(K)*yt,Math.sin(K)*yt)}k.closePath(),k.fillStyle=z%2?T+"55":v+"44",k.strokeStyle=z%2?T:v,k.lineWidth=1.2,k.fill(),k.stroke(),k.restore()}k.beginPath();for(let z=0;z<=128;z++){const O=z/128*Math.PI*2,j=m&&$?(x[z*8%x.length]-128)/128:0,K=W*.22*(1+j*.8);z?k.lineTo(Math.cos(O)*K,Math.sin(O)*K):k.moveTo(Math.cos(O)*K,Math.sin(O)*K)}k.strokeStyle="#fff",k.lineWidth=2,k.stroke();for(let z=0;z<16;z++){const O=z/16*Math.PI*2-Y*2;k.beginPath(),k.arc(Math.cos(O)*W*.98,Math.sin(O)*W*.98,2.2,0,Math.PI*2),k.fillStyle="#fff",k.fill()}if(k.restore(),m&&D.ctx){for(;R.length>1&&R[1].time<=D.ctx.currentTime;)R.shift();const z=R[0];if(z&&z.time<=D.ctx.currentTime&&z.step!==H){H=z.step;const O=Math.floor(z.step/2);p.querySelectorAll(".now").forEach(j=>j.classList.remove("now")),p.querySelectorAll(`.tg-row > :nth-child(${O+2})`).forEach(j=>j.classList.add("now"))}}F=requestAnimationFrame(n)}return r(),F=requestAnimationFrame(n),()=>{B(),cancelAnimationFrame(F)}}},zt="board",ct=s=>Math.max(0,Math.min(1,s));class ye{constructor(t,e){this.store=t,this.seq=0,this.items=t.read(zt,e??[]),this.seq=this.items.length}add(t,e,a=.5,i=.5){const o={id:`i${Date.now().toString(36)}${++this.seq}`,kind:t,value:e,x:ct(a),y:ct(i),rot:Math.round((Math.random()-.5)*16),scale:1,z:this.topZ()+1};return this.items.push(o),this.save(),o}get(t){return this.items.find(e=>e.id===t)}topZ(){return this.items.reduce((t,e)=>Math.max(t,e.z),0)}move(t,e,a){const i=this.get(t);i&&(i.x=ct(e),i.y=ct(a),this.save())}rotate(t,e){const a=this.get(t);a&&(a.rot=(a.rot+e+540)%360-180,this.save())}rescale(t,e){const a=this.get(t);a&&(a.scale=Math.max(.5,Math.min(2,Math.round(a.scale*e*100)/100)),this.save())}bringToFront(t){const e=this.get(t);!e||e.z===this.topZ()||(e.z=this.topZ()+1,this.normalise(),this.save())}setValue(t,e){const a=this.get(t);a&&(a.value=e.slice(0,280),this.save())}remove(t){this.items=this.items.filter(e=>e.id!==t),this.save()}reset(t){this.items=t.map(e=>({...e})),this.save()}sorted(){return[...this.items].sort((t,e)=>t.z-e.z)}normalise(){this.sorted().forEach((t,e)=>t.z=e+1)}save(){this.store.write(zt,this.items)}}const we=["#e2007a","#b5122f","#f4e1bf","#cfd4de","#0fb5c2","#c9b8ff","#5b2a86","#0f7b5f","#e0b44a"],Dt=[{id:"s1",kind:"note",value:"monsoon playlist, mogra gajra, silver jhumkas — the 2004 summer edit",x:.3,y:.3,rot:-4,scale:1,z:1},{id:"s2",kind:"sticker",value:"butterfly",x:.62,y:.26,rot:8,scale:1.2,z:2},{id:"s3",kind:"sticker",value:"nath",x:.78,y:.62,rot:-10,scale:1.1,z:3},{id:"s4",kind:"swatch",value:"#e2007a",x:.18,y:.7,rot:6,scale:1,z:4},{id:"s5",kind:"swatch",value:"#e0b44a",x:.28,y:.76,rot:-3,scale:1,z:5},{id:"s6",kind:"sticker",value:"cassette",x:.52,y:.66,rot:-6,scale:1.3,z:6},{id:"s7",kind:"sticker",value:"sparkle",x:.86,y:.2,rot:0,scale:.8,z:7}],ke={id:"board",title:"Aathavani",deva:"आठवणी",blurb:"a scrapbook moodboard you arrange by hand",icon:"board",w:820,h:560,minW:340,minH:360,mount(s,t){const e=new ye(t.store,Dt);let a=null;const i=nt(`
      <div class="scrap">
        <div class="scrap__tray" role="toolbar" aria-label="Add to board">
          <span class="label">Stickers</span>
          <div class="scrap__stickers">${Jt.map(r=>`<button class="scrap__add" data-add="sticker" data-v="${r}" title="${dt[r]}" aria-label="Add ${dt[r]}">${$t(r,34)}</button>`).join("")}</div>
          <span class="label">Swatches</span>
          <div class="scrap__swatches">${we.map(r=>`<button class="scrap__sw" style="--c:${r}" data-add="swatch" data-v="${r}" aria-label="Add colour ${r}"></button>`).join("")}</div>
          <button class="btn" data-add="note" data-v="new note">+ Note</button>
          <button class="btn" data-act="reset">Reset board</button>
        </div>
        <div class="scrap__paper" aria-label="Moodboard. Select an item, then use arrow keys to move, R to rotate, + and − to resize, Delete to remove." tabindex="-1"></div>
        <div class="scrap__inspect" role="toolbar" aria-label="Selected item" hidden>
          <input class="field scrap__text" aria-label="Note text" maxlength="280">
          <button class="btn" data-act="rotl" aria-label="Rotate left">⟲</button>
          <button class="btn" data-act="rotr" aria-label="Rotate right">⟳</button>
          <button class="btn" data-act="smaller" aria-label="Smaller">−</button>
          <button class="btn" data-act="bigger" aria-label="Bigger">+</button>
          <button class="btn" data-act="front">To front</button>
          <button class="btn btn--danger" data-act="remove">Remove</button>
        </div>
      </div>`);s.append(i);const o=i.querySelector(".scrap__paper"),c=i.querySelector(".scrap__inspect"),d=i.querySelector(".scrap__text"),b=r=>{const m=r.kind==="sticker"?$t(r.value,72):r.kind==="swatch"?`<span class="sw" style="--c:${r.value}"><b>${r.value}</b></span>`:`<span class="note">${X(r.value)}</span>`,h=r.kind==="sticker"?dt[r.value]:r.kind==="swatch"?`Colour ${r.value}`:`Note: ${r.value}`;return`<button class="item item--${r.kind}" data-id="${r.id}" aria-label="${X(h)}" aria-pressed="${r.id===a}"
        style="left:${r.x*100}%;top:${r.y*100}%;z-index:${r.z};--rot:${r.rot}deg;--s:${r.scale}">${m}</button>`};function p(){o.innerHTML=e.items.length?e.sorted().map(b).join(""):'<p class="empty">An empty page. Add stickers, swatches and notes from the tray, then drag them into place.</p>';const r=a?e.get(a):void 0;c.hidden=!r,r&&(d.hidden=r.kind!=="note",d.value=r.kind==="note"?r.value:"")}function M(r){a=r,p(),r&&o.querySelector(`[data-id="${r}"]`)?.focus()}let g=null;o.addEventListener("pointerdown",r=>{const m=r.target.closest(".item");if(!m){r.target===o&&M(null);return}const h=e.get(m.dataset.id),S=o.getBoundingClientRect();g={id:h.id,dx:(r.clientX-S.left)/S.width-h.x,dy:(r.clientY-S.top)/S.height-h.y,moved:!1},m.setPointerCapture(r.pointerId),m.classList.add("dragging"),a!==h.id&&(a=h.id,e.bringToFront(h.id),o.querySelectorAll(".item").forEach(_=>_.setAttribute("aria-pressed",String(_.dataset.id===h.id))),m.style.zIndex=String(e.get(h.id).z),c.hidden=!1,d.hidden=h.kind!=="note",d.value=h.kind==="note"?h.value:"")}),o.addEventListener("pointermove",r=>{if(!g)return;const m=o.getBoundingClientRect(),h=(r.clientX-m.left)/m.width-g.dx,S=(r.clientY-m.top)/m.height-g.dy,_=o.querySelector(`[data-id="${g.id}"]`);_.style.left=`${Math.max(0,Math.min(1,h))*100}%`,_.style.top=`${Math.max(0,Math.min(1,S))*100}%`,g.moved=!0});const E=r=>{if(!g)return;const m=o.getBoundingClientRect();g.moved&&(e.move(g.id,(r.clientX-m.left)/m.width-g.dx,(r.clientY-m.top)/m.height-g.dy),D.ui("click"));const h=g.id;g=null,p(),o.querySelector(`[data-id="${h}"]`)?.focus({preventScroll:!0})};return o.addEventListener("pointerup",E),o.addEventListener("pointercancel",E),o.addEventListener("keydown",r=>{const m=r.target.closest(".item");if(!m)return;const h=m.dataset.id,S=e.get(h),_=r.shiftKey?.05:.01,C={ArrowLeft:[-_,0],ArrowRight:[_,0],ArrowUp:[0,-_],ArrowDown:[0,_]};if(C[r.key])r.preventDefault(),e.move(h,S.x+C[r.key][0],S.y+C[r.key][1]),a=h,p();else if(r.key==="r"||r.key==="R")e.rotate(h,r.shiftKey?-15:15),p();else if(r.key==="+"||r.key==="=")e.rescale(h,1.1),p();else if(r.key==="-")e.rescale(h,1/1.1),p();else if(r.key==="Delete"||r.key==="Backspace"){e.remove(h),a=null,p(),D.ui("close");return}else if(r.key==="Enter"||r.key===" ")r.preventDefault(),a=h,e.bringToFront(h),p();else return;o.querySelector(`[data-id="${h}"]`)?.focus()}),i.addEventListener("click",r=>{const m=r.target,h=m.closest("[data-add]");if(h){const C=e.add(h.dataset.add,h.dataset.v,.35+Math.random()*.3,.3+Math.random()*.4);D.ui("open"),M(C.id),C.kind==="note"&&(d.focus(),d.select())}const S=m.closest("[data-act]")?.dataset.act;if(!S)return;if(S==="reset"){e.reset(Dt),a=null,p(),t.toast("Board reset to the sample layout.");return}if(!a)return;const _=a;S==="rotl"&&e.rotate(_,-15),S==="rotr"&&e.rotate(_,15),S==="smaller"&&e.rescale(_,1/1.15),S==="bigger"&&e.rescale(_,1.15),S==="front"&&e.bringToFront(_),S==="remove"&&(e.remove(_),a=null,D.ui("close")),p()}),d.addEventListener("input",()=>{if(!a)return;e.setValue(a,d.value||" ");const r=o.querySelector(`[data-id="${a}"] .note`);r&&(r.textContent=d.value)}),p(),()=>{}}},Bt=Ot(),ut=new Ft(Bt),it=new Gt(ut),J=()=>Kt(it.value.motion),xe=document.getElementById("wall"),tt=Ut(xe);tt.ok||document.body.classList.add("no-webgl");function vt(){const s=it.value;document.documentElement.dataset.theme=s.theme,tt.setPalette(qt.find(t=>t.id===s.theme).shader),tt.setMode(s.wallpaper),tt.setReduced(J()),document.documentElement.classList.toggle("reduce-motion",J()),D.uiEnabled=s.sounds}it.onChange(vt);matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change",vt);vt();let Rt;function $e(s){const t=document.querySelector(".toast");t&&(t.textContent=s,t.classList.add("show"),clearTimeout(Rt),Rt=setTimeout(()=>t.classList.remove("show"),3800))}function Me(){D.ui("shutdown");const s=document.createElement("div");s.className="shutdown",s.innerHTML=`<div><p>It is now safe to switch off your dil.</p><p class="deva">आता संगणक बंद करणे सुरक्षित आहे.</p>
    <button class="btn btn--hot">Start KHIDKI again</button></div>`,document.body.append(s);const t=s.querySelector("button");t.focus(),t.addEventListener("click",async()=>{s.remove(),await It(J(),ot)})}const _e={id:"power",title:"Band karaa",deva:"बंद करा",blurb:"shut down (gently)",icon:"power",w:300,h:200,mount:()=>()=>{}},Se=[pe,ve,ke,ee,ae,_e];async function Ae(){it.value.skipBoot||(tt.setReduced(!0),await It(J(),ot),tt.setReduced(J()));const s=le(Se,{store:ut,settings:it,persistent:Bt.persistent,toast:$e,shutdown:Me,reduced:J});ut.read("welcomed",!1)||(s.open("about"),ut.write("welcomed",!0)),addEventListener("pointerdown",()=>D.ensure(),{once:!0})}Ae();
