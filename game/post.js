import*as n from"three";import{EffectComposer as g}from"../vendor/jsm/postprocessing/EffectComposer.js";import{RenderPass as w}from"../vendor/jsm/postprocessing/RenderPass.js";import{OutputPass as b}from"../vendor/jsm/postprocessing/OutputPass.js";import{UnrealBloomPass as y}from"../vendor/jsm/postprocessing/UnrealBloomPass.js";import{GTAOPass as P}from"../vendor/jsm/postprocessing/GTAOPass.js";import{ShaderPass as D}from"../vendor/jsm/postprocessing/ShaderPass.js";const S={uniforms:{tDiffuse:{value:null},px:{value:new n.Vector2(1/1024,1/1024)},sharp:{value:.35},sat:{value:1.08},contrast:{value:1.05},vig:{value:.22},warm:{value:.015}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 px; uniform float sharp, sat, contrast, vig, warm; varying vec2 vUv;
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
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a); }`};function G(s,i,c,l){const o=location.search;if(/[?&]nopost/.test(o))return null;const v=s.domElement.width,m=s.domElement.height,f=new n.WebGLRenderTarget(v,m,{type:n.HalfFloatType,samples:4}),t=new g(s,f);t.setPixelRatio(1),t.addPass(new w(i,c));let e=null;l||(e=new P(i,c,v,m),e.updateGtaoMaterial({radius:1.4,distanceExponent:1.4,thickness:2,scale:1.3,samples:16,distanceFallOff:1}),e.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12}),e.blendIntensity=.85,e.enabled=/[?&]ao\b/.test(o),t.addPass(e));const r=new y(new n.Vector2(v>>1,m>>1),.38,.6,1);t.addPass(r),t.addPass(new b);const p=new D(S);t.addPass(p),p.uniforms.sharp.value=l?.5:.35,addEventListener("keydown",a=>{a.code==="KeyG"&&e&&(e.enabled=!e.enabled),a.code==="KeyH"&&(d.on=!d.on)});const x=()=>{const a=s.domElement.width,u=s.domElement.height;t.setSize(a,u),r.setSize(a>>1,u>>1),p.uniforms.px.value.set(1/a,1/u)};x();let h=0;const d={composer:t,ao:e,bloom:r,on:!0,render:()=>t.render(),resize:x,degrade(){const a=performance.now();a-h<3e3||(h=a,e&&e.enabled?e.enabled=!1:r.enabled?r.enabled=!1:d.on=!1)}};return d}function C(s,i){const c=new n.SphereGeometry(3500,48,24),l=new n.ShaderMaterial({side:n.BackSide,depthWrite:!1,fog:!1,uniforms:{sd:{value:i.clone().normalize()}},vertexShader:"varying vec3 vd; void main(){ vd = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }",fragmentShader:`uniform vec3 sd; varying vec3 vd;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
      void main(){ float h = clamp(vd.y, -0.2, 1.0);
        vec3 zen = vec3(0.24,0.44,0.74), hor = vec3(0.70,0.79,0.87), gnd = vec3(0.62,0.66,0.66);
        vec3 c = h > 0.0 ? mix(hor, zen, pow(h, 0.55)) : gnd;
        float s = max(dot(normalize(vd), sd), 0.0);
        c += vec3(1.0,0.92,0.75) * (pow(s, 48.0) * 0.55 + pow(s, 6.0) * 0.10);
        if (h > 0.015) { // кучевые облака: проекция на «потолок», к горизонту редеют и тонут в дымке
          vec2 uv = vd.xz / (vd.y + 0.12) * 1.6;
          float n = fbm(uv + vec2(3.1, 7.7)); float cl = smoothstep(0.52, 0.78, n) * smoothstep(0.015, 0.22, h);
          vec3 cc = mix(vec3(0.80,0.83,0.88), vec3(1.0,0.99,0.96), smoothstep(0.5, 0.9, fbm(uv * 1.7 + 11.0)) * 0.7 + s * 0.3);
          c = mix(c, cc, cl * 0.85);
        }
        gl_FragColor = vec4(c, 1.0); }`}),o=new n.Mesh(c,l);return o.frustumCulled=!1,o.userData.noAO=!0,o.renderOrder=-1,o.onBeforeRender=(v,m,f)=>o.position.copy(f.position),s.add(o),s.background=null,o}export{C as addSky,G as makePost};
