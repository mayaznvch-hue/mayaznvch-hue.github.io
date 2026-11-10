import*as e from"three";import{EffectComposer as g}from"../vendor/jsm/postprocessing/EffectComposer.js";import{RenderPass as w}from"../vendor/jsm/postprocessing/RenderPass.js";import{OutputPass as b}from"../vendor/jsm/postprocessing/OutputPass.js";import{UnrealBloomPass as z}from"../vendor/jsm/postprocessing/UnrealBloomPass.js";import{GTAOPass as y}from"../vendor/jsm/postprocessing/GTAOPass.js";import{ShaderPass as P}from"../vendor/jsm/postprocessing/ShaderPass.js";const C={uniforms:{tDiffuse:{value:null},px:{value:new e.Vector2(1/1024,1/1024)},sharp:{value:.35},sat:{value:1.08},contrast:{value:1.05},vig:{value:.22},warm:{value:.015}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 px; uniform float sharp, sat, contrast, vig, warm; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
      vec3 a = texture2D(tDiffuse, vUv + vec2(0.0, -px.y)).rgb, b = texture2D(tDiffuse, vUv + vec2(-px.x, 0.0)).rgb,
           d = texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb, e = texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb;
      vec3 mn = min(col, min(min(a, b), min(d, e))), mx = max(col, max(max(a, b), max(d, e)));
      vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-4), 0.0, 1.0));
      vec3 wgt = -amp * mix(0.125, 0.2, sharp);
      col = clamp((col + (a + b + d + e) * wgt) / (1.0 + 4.0 * wgt), 0.0, 1.0);
      float l = dot(col, vec3(0.2126,0.7152,0.0722));
      col = mix(vec3(l), col, sat);
      col = (col - 0.5) * contrast + 0.5;
      col += vec3(warm, warm*0.4, -warm);
      vec2 dv = vUv - 0.5; col *= 1.0 - vig * dot(dv, dv) * 2.2;
      col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a); }`};function G(i,l,c,u){const t=location.search;if(/[?&]nopost/.test(t))return null;const v=i.domElement.width,m=i.domElement.height,d=new e.WebGLRenderTarget(v,m,{type:e.HalfFloatType,samples:4}),a=new g(i,d);a.setPixelRatio(1),a.addPass(new w(l,c));let o=null;u||(o=new y(l,c,v,m),o.updateGtaoMaterial({radius:1.4,distanceExponent:1.4,thickness:2,scale:1.3,samples:16,distanceFallOff:1}),o.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12}),o.blendIntensity=.85,o.enabled=/[?&]ao\b/.test(t),a.addPass(o));const n=new z(new e.Vector2(v>>1,m>>1),.38,.6,1);a.addPass(n),a.addPass(new b);const f=new P(C);a.addPass(f),f.uniforms.sharp.value=u?.5:.35,addEventListener("keydown",s=>{s.code==="KeyG"&&o&&(o.enabled=!o.enabled),s.code==="KeyH"&&(r.on=!r.on)});const h=()=>{const s=i.domElement.width,p=i.domElement.height;a.setSize(s,p),n.setSize(s>>1,p>>1),f.uniforms.px.value.set(1/s,1/p)};h();let x=0;const r={composer:a,ao:o,bloom:n,on:!0,render:()=>a.render(),resize:h,degrade(){const s=performance.now();if(!(s-x<3e3)){if(x=s,o&&o.enabled)o.enabled=!1;else if(n.enabled)n.enabled=!1;else if(r.on)r.on=!1;else return!1;return!0}}};return r}function N(i,l){const c=new e.SphereGeometry(3500,48,24),u=new e.ShaderMaterial({side:e.BackSide,depthWrite:!1,fog:!1,uniforms:{sd:{value:l.clone().normalize()},uT:{value:0},zen:{value:new e.Vector3(.24,.44,.74)},hor:{value:new e.Vector3(.7,.79,.87)},gnd:{value:new e.Vector3(.62,.66,.66)},uNight:{value:0},uCloud:{value:.22},uSunVis:{value:1},uGlow:{value:new e.Vector3},uFogK:{value:0},uCLit:{value:new e.Vector3(.98,.98,.97)},uCDark:{value:new e.Vector3(.62,.65,.7)}},vertexShader:"varying vec3 vd; void main(){ vd = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }",fragmentShader:`uniform vec3 sd, zen, hor, gnd, uCLit, uCDark, uGlow; uniform float uT, uNight, uCloud, uSunVis, uFogK; varying vec3 vd;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
      void main(){ vec3 d = normalize(vd); float h = clamp(d.y, -0.2, 1.0);
        vec3 c = h > 0.0 ? mix(hor, zen, pow(h, 0.55)) : gnd;
        float s = max(dot(d, sd), 0.0);
        c += mix(vec3(1.0,0.92,0.75), vec3(0.75,0.82,1.0), uNight) * (pow(s, 48.0) * 0.55 + pow(s, 6.0) * 0.10) * uSunVis * (1.0 - uNight * 0.6);
        c += vec3(1.0, 0.94, 0.80) * smoothstep(0.99935, 0.99975, s) * 2.5 * uSunVis * (1.0 - uNight); // диск солнца
        if (uNight > 0.01 && h > 0.0) { // звёзды и луна
          vec2 sp = d.xz / (d.y + 1.0) * 220.0; vec2 ci = floor(sp); float r = hs(ci);
          float st = step(0.988, r) * smoothstep(0.22, 0.0, length(fract(sp) - 0.5 - (vec2(hs(ci + 3.1), hs(ci + 7.7)) - 0.5) * 0.5)) * (0.6 + 0.4 * sin(uT * (1.0 + r * 3.0) + r * 40.0));
          c += vec3(0.85, 0.9, 1.0) * st * uNight * smoothstep(0.02, 0.25, h) * (1.0 - uCloud);
          float mn = smoothstep(0.9993, 0.9996, dot(d, normalize(vec3(-sd.x, abs(sd.y) + 0.25, -sd.z))));
          c += vec3(0.9, 0.92, 0.85) * mn * uNight * (1.0 - uCloud * 0.9) * 1.4;
          c += vec3(0.5, 0.33, 0.18) * 0.05 * uNight * smoothstep(0.25, 0.0, h); // зарево города у горизонта
        }
        if (h > 0.0) { // облака: проекция на «потолок», дрейфуют, при пасмурной погоде затягивают небо
          vec2 uv = d.xz / (d.y + 0.12) * 1.6 + vec2(uT * 0.004, uT * 0.0015);
          float n = fbm(uv + vec2(3.1, 7.7)) * 0.8 + fbm(uv * 3.3 + 5.0) * 0.2;
          float lo = mix(0.52, 0.12, uCloud), hi = mix(0.78, 0.55, uCloud);
          float cl = smoothstep(lo, hi, n) * smoothstep(0.0, mix(0.22, 0.06, uCloud), h);
          float sh = fbm(uv * 1.7 + 11.0 + sd.xz * 0.6);
          vec3 cc = mix(uCDark, uCLit, smoothstep(0.35, 0.9, sh) * 0.75 + s * 0.25 * uSunVis);
          c = mix(c, cc, cl * mix(0.85, 0.98, uCloud));
        }
        if (h > -0.05) { // закатное свечение у горизонта со стороны солнца
          float az = dot(normalize(d.xz + 1e-4), normalize(sd.xz + 1e-4)) * 0.5 + 0.5;
          c += uGlow * exp(-max(h, 0.0) * 7.0) * (0.55 + 0.45 * az * az);
        }
        c = mix(c, gnd, uFogK * (1.0 - smoothstep(0.0, 0.6, h) * 0.35)); // в тумане и осадках небо тонет в дымке
        gl_FragColor = vec4(c, 1.0); }`}),t=new e.Mesh(c,u);return t.frustumCulled=!1,t.userData.noAO=!0,t.renderOrder=-1,t.onBeforeRender=(v,m,d)=>t.position.copy(d.position),i.add(t),i.background=null,t}export{N as addSky,G as makePost};
