import*as r from"three";import{LIGHTS as D}from"./util.js";const d=t=>new r.Color(t),p=t=>new r.Vector3(...t),V={day:{sunI:2.45,sunC:d("#ffedd2"),hemiI:1,hemiS:d("#d2e1f6"),hemiG:d("#8a8268"),zen:p([.24,.44,.74]),hor:p([.7,.79,.87]),fog:d("#a9bccb"),lamp:0,win:0,exp:1.05,env:1,bloom:.38,dayK:1,night:0,cloudLit:p([.98,.98,.97]),cloudDark:p([.62,.65,.7])},dusk:{sunI:1.15,sunC:d("#ff9a55"),hemiI:.8,hemiS:d("#a7a3c4"),hemiG:d("#6a5444"),zen:p([.16,.24,.46]),hor:p([.96,.62,.44]),fog:d("#a08c8c"),lamp:.75,win:.55,exp:1.1,env:.55,bloom:.5,dayK:.6,night:.2,glow:p([.9,.38,.12]),cloudLit:p([1,.7,.55]),cloudDark:p([.38,.32,.36])},night:{sunI:.38,sunC:d("#93a8dc"),hemiI:.95,hemiS:d("#4a5a84"),hemiG:d("#1c1a16"),zen:p([.008,.016,.045]),hor:p([.07,.085,.13]),fog:d("#151b28"),lamp:1,win:1,exp:1.15,env:.14,bloom:.85,dayK:.12,night:1,cloudLit:p([.16,.14,.15]),cloudDark:p([.07,.07,.09])}},H={clear:{cloud:.22,sunK:1,hemiK:1,grey:0,near:420,far:2600,rain:0,snow:0,wet:0,cover:0},clouds:{cloud:.72,sunK:.5,hemiK:1.12,grey:.35,near:380,far:2400,rain:0,snow:0,wet:0,cover:0},rain:{fogK:.45,cloud:1,sunK:.14,hemiK:1.05,grey:.85,near:15,far:430,rain:1,snow:0,wet:1,cover:0},snow:{fogK:.55,cloud:1,sunK:.22,hemiK:1.25,grey:.75,near:20,far:520,rain:0,snow:1,wet:0,cover:1},fog:{fogK:.92,cloud:1,sunK:.18,hemiK:1.2,grey:1,near:0,far:170,rain:0,snow:0,wet:.35,cover:0}},$={now:"Сейчас",day:"День",dusk:"Вечер",night:"Ночь"},j={now:"Сейчас",clear:"Ясно",clouds:"Облачно",rain:"Дождь",snow:"Снег",fog:"Туман"},S={uUp:{value:new r.Vector3(0,1,0)},uSnow:{value:0},uWet:{value:0},uLamp:{value:0},uWin:{value:0},uLm:{value:null},uSkyR:{value:new r.Vector3(.7,.79,.87)},uLmBox:{value:new r.Vector4(0,0,1,1)},uLampCol:{value:new r.Vector3(1,.72,.42)},uEnvT:{value:0}},q=`varying vec3 vEnvW; uniform float uEnvT;
`,O=`
  { vec4 ew = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    ew = instanceMatrix * ew;
  #endif
    vEnvW = (modelMatrix * ew).xyz; }`,Y=`
  #ifdef ENV_SWAY
  { float ph = 0.0;
  #ifdef USE_INSTANCING
    ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
  #endif
    float hk = position.y + 1.0;
    transformed.x += (sin(uEnvT * 1.3 + ph) * 0.6 + sin(uEnvT * 2.9 + ph * 1.7 + position.y * 2.0) * 0.4) * 0.035 * hk;
    transformed.z += cos(uEnvT * 1.1 + ph * 1.3) * 0.02 * hk; }
  #endif`,X=`varying vec3 vEnvW;
uniform vec3 uUp, uSkyR; uniform float uSnow, uWet, uLamp, uWin; uniform sampler2D uLm; uniform vec4 uLmBox; uniform vec3 uLampCol; float envWk = 0.0;
float envH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float envN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(envH(i), envH(i + vec2(1.0, 0.0)), f.x), mix(envH(i + vec2(0.0, 1.0)), envH(i + vec2(1.0, 1.0)), f.x), f.y); }
`,J=`
  float envUp = dot(normal, uUp);
  { // газон: крупные пятна (выгоревшая/сочная трава) и мелкая рябь — без однотонной «заливки»
    float gq = diffuseColor.g / max(diffuseColor.r, 0.02);
    float lk = smoothstep(1.05, 1.2, gq) * (1.0 - smoothstep(1.6, 1.9, gq)) * smoothstep(0.7, 0.95, envUp) * step(vEnvW.y, 1.5);
    if (lk > 0.001) {
      float m1 = envN(vEnvW.xz * 0.045), m2 = envN(vEnvW.xz * 0.31 + 17.0), m3 = envN(vEnvW.xz * 2.3);
      vec3 dry = diffuseColor.rgb * vec3(1.20, 1.07, 0.80), dark = diffuseColor.rgb * vec3(0.72, 0.84, 0.74);
      vec3 g2 = mix(dark, dry, smoothstep(0.25, 0.75, m1 * 0.6 + m2 * 0.4)) * (0.9 + 0.2 * m3);
      diffuseColor.rgb = mix(diffuseColor.rgb, g2, lk);
    }
  }
  if (uSnow > 0.001) {
    float sk = uSnow * smoothstep(0.42, 0.8, envUp) * (0.78 + 0.22 * envN(vEnvW.xz * 0.7));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.90, 0.93, 0.97), sk);
  #ifdef STANDARD
    roughnessFactor = mix(roughnessFactor, 0.85, sk); metalnessFactor *= 1.0 - sk;
  #endif
  }
  if (uWet > 0.001) {
    float pud = smoothstep(0.45, 0.75, envN(vEnvW.xz * 0.18) * 0.7 + envN(vEnvW.xz * 0.9) * 0.3);
    float wk = uWet * smoothstep(0.6, 0.95, envUp) * (0.55 + 0.45 * pud); envWk = wk;
    diffuseColor.rgb *= 1.0 - 0.55 * wk;
  #ifdef STANDARD
    roughnessFactor = mix(roughnessFactor, 0.06, wk * (0.6 + 0.4 * pud));
  #endif
  }`,Q=`
  if (uLamp > 0.001) {
    vec2 luv = (vEnvW.xz - uLmBox.xy) / uLmBox.zw;
    float lv = texture2D(uLm, luv).r;
    float hk = clamp(1.0 - vEnvW.y / 10.0, 0.0, 1.0);
    totalEmissiveRadiance += (diffuseColor.rgb + 0.08) * uLampCol * (lv * lv * 3.4 + lv * 0.6) * hk * uLamp;
    totalEmissiveRadiance += uLampCol * (lv * lv * 4.0 + lv * 0.6) * envWk * uLamp; // отражения фонарей в мокром асфальте
  }
  if (envWk > 0.001) { // мокрая поверхность: френелевское отражение неба
    float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.0);
    totalEmissiveRadiance += uSkyR * fr * envWk * 0.7 * (1.0 - 0.6 * clamp(dot(diffuseColor.rgb, vec3(0.333)) * 2.0, 0.0, 1.0)); // на светлой плитке слабее, чтобы не белела
  }
  #ifdef ENV_WIN
  if (uWin > 0.001) {
  #if defined(USE_METALNESSMAP)
    vec2 wuv = vMetalnessMapUv; float isWin = step(0.15, texture2D(metalnessMap, wuv).b);
  #elif defined(USE_MAP)
    vec2 wuv = vMapUv; float isWin = step(dot(texture2D(map, wuv).rgb, vec3(0.333)), 0.42);
  #else
    vec2 wuv = vec2(0.0); float isWin = 0.0;
  #endif
    vec2 cell = floor(wuv * ENV_WIN) + floor(vEnvW.xz / 37.0) * 17.0 + floor(vEnvW.y / 97.0);
    float hs = envH(cell);
    float lit = step(0.55, hs);
    vec3 wc = mix(vec3(1.0, 0.66, 0.36), vec3(1.0, 0.84, 0.6), fract(hs * 7.31));
    if (fract(hs * 13.7) > 0.93) wc = vec3(0.6, 0.72, 1.0); // редкие «телевизорные» окна
    totalEmissiveRadiance += isWin * lit * wc * uWin * (0.3 + 0.45 * fract(hs * 3.17));
  }
  #endif`;function Z(t){t.userData.envPatched||(t.isMeshStandardMaterial||t.isMeshLambertMaterial||t.isMeshPhongMaterial)&&(t.userData.envPatched=!0,t.userData.win&&(t.defines={...t.defines||{},ENV_WIN:t.userData.win.toFixed(1)}),t.userData.sway&&(t.defines={...t.defines||{},ENV_SWAY:""}),t.onBeforeCompile=l=>{Object.assign(l.uniforms,S),l.vertexShader=q+l.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>"+Y).replace("#include <project_vertex>","#include <project_vertex>"+O),l.fragmentShader=X+l.fragmentShader.replace("#include <normal_fragment_maps>","#include <normal_fragment_maps>"+J).replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>"+Q)},t.customProgramCacheKey=()=>"env2"+(t.defines?.ENV_WIN||"")+(t.userData.sway?"s":""),t.needsUpdate=!0)}function ee(t){if(!D.length)return null;let l=1/0,u=-1/0,c=1/0,m=-1/0;for(const[a,,w,y]of D)l=Math.min(l,a-y),u=Math.max(u,a+y),c=Math.min(c,w-y),m=Math.max(m,w+y);l-=4,c-=4,u+=4,m+=4;const g=t?1024:2048,T=g/(u-l),b=g/(m-c),x=document.createElement("canvas");x.width=x.height=g;const h=x.getContext("2d");h.fillStyle="#000",h.fillRect(0,0,g,g),h.globalCompositeOperation="lighter";for(const[a,w,y,E]of D){const i=(a-l)*T,k=(y-c)*b,I=Math.max(2,E*T),M=Math.min(1,w/8)*.55+.45,_=h.createRadialGradient(i,k,0,i,k,I);_.addColorStop(0,`rgba(255,255,255,${.62*M})`),_.addColorStop(.35,`rgba(255,255,255,${.32*M})`),_.addColorStop(1,"rgba(255,255,255,0)"),h.fillStyle=_,h.fillRect(i-I,k-I,I*2,I*2)}const o=new r.CanvasTexture(x);return o.colorSpace=r.NoColorSpace,o.generateMipmaps=!1,o.flipY=!1,o.minFilter=o.magFilter=r.LinearFilter,o.wrapS=o.wrapT=r.ClampToEdgeWrapping,S.uLmBox.value.set(l,c,u-l,m-c),o}function U(t,l){const u=t==="rain",c=u?new r.Vector3(70,34,70):new r.Vector3(56,30,56),m=new r.BufferGeometry,g=u?2:1,T=new Float32Array(l*g*4),b=new Float32Array(l*g*3);for(let y=0;y<l;y++){const E=Math.random(),i=Math.random(),k=Math.random(),I=Math.random();for(let M=0;M<g;M++)T.set([E,i,k,u?M:I],(y*g+M)*4)}m.setAttribute("position",new r.BufferAttribute(b,3)),m.setAttribute("seed",new r.BufferAttribute(T,4));const x={uT:{value:0},uCam:{value:new r.Vector3},uBox:{value:c},uA:{value:0},uCol:{value:new r.Color(u?"#c6d3df":"#ffffff")},uPx:{value:1}},h=`attribute vec4 seed; uniform float uT, uPx; uniform vec3 uCam, uBox; varying float vF;
    void main(){
      vec3 p = seed.xyz * uBox;
      ${u?"p.y -= uT * (16.0 + seed.w * 0.0 + seed.x * 5.0); p.x += uT * 2.2;":"p.y -= uT * (1.1 + seed.w * 0.7); p.x += sin(uT * 0.9 + seed.w * 6.28) * 0.9 + uT * 0.6; p.z += cos(uT * 0.7 + seed.x * 6.28) * 0.7;"}
      vec3 o = uCam - uBox * 0.5; p = mod(p - o, uBox) + o;
      ${u?"p += vec3(0.13, -1.0, 0.0) * 0.75 * seed.w;":""}
      vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
      float d = length(p - uCam); vF = (1.0 - smoothstep(uBox.x * 0.32, uBox.x * 0.5, d)) * smoothstep(0.6, 2.0, d);
      ${u?"":"gl_PointSize = clamp(uPx * (0.05 + seed.w * 0.06) * 700.0 / -mv.z, 1.0, 14.0 * uPx);"}
    }`,o=`uniform float uA; uniform vec3 uCol; varying float vF;
    void main(){ ${u?"float a = 0.2;":"vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.15, length(c)) * 0.9;"} gl_FragColor = vec4(uCol, a * uA * vF); }`,a=new r.ShaderMaterial({uniforms:x,vertexShader:h,fragmentShader:o,transparent:!0,depthWrite:!1,fog:!1}),w=u?new r.LineSegments(m,a):new r.Points(m,a);return w.frustumCulled=!1,w.renderOrder=5,w.userData.noAO=!0,w}function oe(t=new Date,l=55.761,u=37.859){const c=Math.PI/180,m=t.getTime()/864e5-10957.5,g=(357.529+.98560028*m)*c,b=(280.459+.98564736*m+1.915*Math.sin(g)+.02*Math.sin(2*g))*c,x=(23.439-36e-8*m)*c,h=Math.atan2(Math.cos(x)*Math.sin(b),Math.cos(b)),o=Math.asin(Math.sin(x)*Math.sin(b)),w=((18.697374558+24.06570982441908*m)%24*15+u)*c-h;return Math.asin(Math.sin(l*c)*Math.sin(o)+Math.cos(l*c)*Math.cos(o)*Math.cos(w))/c}const P=()=>{const t=oe();return t>7?"day":t>-5?"dusk":"night"},ne=t=>t>=71&&t<=77||t===85||t===86?"snow":t>=51&&t<=67||t>=80&&t<=82||t>=95?"rain":t===45||t===48?"fog":t===3||t===2?"clouds":"clear",te=t=>({0:"ясно",1:"почти ясно",2:"переменная облачность",3:"пасмурно",45:"туман",48:"туман",51:"морось",53:"морось",55:"морось",56:"ледяная морось",57:"ледяная морось",61:"небольшой дождь",63:"дождь",65:"сильный дождь",66:"ледяной дождь",67:"ледяной дождь",71:"небольшой снег",73:"снег",75:"сильный снег",77:"снежные зёрна",80:"ливень",81:"ливень",82:"сильный ливень",85:"снегопад",86:"сильный снегопад",95:"гроза",96:"гроза с градом",99:"гроза с градом"})[t]||"";function ie({scene:t,renderer:l,camera:u,sun:c,hemi:m,MOB:g}){const T=new Set;t.traverse(n=>{const e=n.material?Array.isArray(n.material)?n.material:[n.material]:[];for(const f of e)T.add(f)});const b=[];for(const n of T){if(Z(n),!(n.emissive||n.envMapIntensity!==void 0))continue;const e=n.emissiveIntensity??1,f=!!(n.emissive&&n.emissive.r+n.emissive.g+n.emissive.b>.001);let v=n.userData.night||null;!v&&n.emissiveMap&&(v={i:Math.max(.9,e*3)}),!v&&f&&e>=.8&&Math.max(n.emissive.r,n.emissive.g,n.emissive.b)>.5&&(v={i:e*1.6}),b.push({m:n,e:n.emissive?n.emissive.clone():null,ei:e,env:n.envMapIntensity??1,n:v,glow:f})}S.uLm.value=ee(g)||new r.DataTexture(new Uint8Array(4),1,1),S.uLm.value.isCanvasTexture||(S.uLm.value.needsUpdate=!0);const x=U("rain",g?6e3:11e3),h=U("snow",g?4500:8e3);t.add(x,h);const o={sunI:2.2,sunC:d("#fff1dc"),hemiI:1.1,hemiS:d("#dfe8f0"),hemiG:d("#8a8268"),zen:p([.24,.44,.74]),hor:p([.7,.79,.87]),fog:d("#a9bccb"),lamp:0,win:0,exp:1.05,env:1,bloom:.38,dayK:1,night:0,cloudLit:p([.98,.98,.97]),cloudDark:p([.62,.65,.7]),glow:p([0,0,0]),fogK:0,cloud:.22,sunVis:1,near:420,far:2600,rain:0,snow:0,wet:0,cover:0},a={};let w=null,y=null,E=0;const i={time:"day",wx:"clear",realTime:"day",realWx:"clear",note:""};function k(){const n=V[i.time==="now"?i.realTime:i.time],e=H[i.wx==="now"?i.realWx:i.wx],f=s=>s.r*.3+s.g*.55+s.b*.15,v=(s,A)=>{const L=f(s);return s.clone().lerp(new r.Color(L,L*1.01,L*1.04),A)};a.sunI=n.sunI*e.sunK,a.sunC=n.sunC.clone().lerp(d("#dfe3e8"),e.grey*.6),a.hemiI=n.hemiI*e.hemiK,a.hemiS=v(n.hemiS,e.grey),a.hemiG=n.hemiG.clone();const C=(s,A,L=1)=>{const N=(s.x*.3+s.y*.55+s.z*.15)*L;return s.clone().lerp(new r.Vector3(N,N*1.01,N*1.05),A)};a.zen=C(n.zen,e.grey,e.grey>.5?1.15:1),a.hor=C(n.hor,e.grey,1.05),a.fog=v(n.fog,e.grey),e.snow&&a.fog.lerp(d(n===V.night?"#2a3140":"#d4d9de"),.5),a.night=n.night,a.lamp=n.lamp,a.win=n.win,a.exp=n.exp,a.env=n.env*(1-e.grey*.4),a.bloom=n.bloom,a.dayK=n.dayK,a.cloudLit=n.cloudLit.clone().lerp(n.cloudDark,e.grey*.75),a.cloudDark=n.cloudDark.clone().multiplyScalar(1-e.rain*.25),n===V.night&&(a.cloudLit=new r.Vector3(.17,.13,.12).lerp(new r.Vector3(.2,.16,.14),e.grey)),a.glow=(n.glow||p([0,0,0])).clone().multiplyScalar(1-e.grey*.85),a.fogK=e.fogK||0,a.cloud=e.cloud,a.sunVis=1-Math.min(1,e.grey*1.1),a.near=e.near,a.far=e.far,a.rain=e.rain,a.snow=e.snow,a.wet=e.wet,a.cover=e.cover,E=4}const I=(n,e,f)=>n.lerp(e,f);function M(n){for(const e of["sunI","hemiI","lamp","win","exp","env","bloom","dayK","night","fogK","cloud","sunVis","near","far","rain","snow","wet"])o[e]+=(a[e]-o[e])*n;o.cover+=(a.cover-o.cover)*(n>=1?1:n*.35);for(const e of["sunC","hemiS","hemiG","fog"])I(o[e],a[e],n);for(const e of["zen","hor","cloudLit","cloudDark","glow"])o[e].lerp(a[e],n);c.intensity=o.sunI,c.color.copy(o.sunC),m.intensity=o.hemiI,m.color.copy(o.hemiS),m.groundColor.copy(o.hemiG),t.fog&&(t.fog.color.copy(o.fog),t.fog.near=o.near,t.fog.far=Math.min(o.far,t.userData.fogFar||1e9)),l.toneMappingExposure=o.exp,S.uLamp.value=o.lamp,S.uWin.value=o.win,S.uSnow.value=o.cover,S.uWet.value=o.wet;for(const e of b){const f=e.m;if(f.envMapIntensity!==void 0&&(f.envMapIntensity=e.env*o.env),!!e.e)if(e.n){const v=e.n.c?d(e.n.c):e.e,C=Math.max(o.lamp,o.win*.9);f.emissive.copy(e.e).lerp(v,Math.min(1,C*1.5)),f.emissiveIntensity=e.ei+(e.n.i-e.ei)*C}else e.glow&&(f.emissiveIntensity=e.ei*o.dayK)}if(S.uSkyR.value.set(o.hor.x*.8+o.fog.r*.2,o.hor.y*.8+o.fog.g*.2,o.hor.z*.8+o.fog.b*.2),w){const e=w.material.uniforms;e.uGlow.value.copy(o.glow),e.uFogK.value=o.fogK,e.zen.value.copy(o.zen),e.hor.value.copy(o.hor),e.gnd.value.set(o.fog.r,o.fog.g,o.fog.b),e.uNight.value=o.night,e.uCloud.value=o.cloud,e.uSunVis.value=o.sunVis,e.uCLit.value.copy(o.cloudLit),e.uCDark.value.copy(o.cloudDark)}y&&y.bloom&&(y.bloom.strength=o.bloom),x.material.uniforms.uCol.value.setRGB(.35+o.dayK*.45,.4+o.dayK*.45,.47+o.dayK*.4),h.material.uniforms.uCol.value.setRGB(.55+o.dayK*.45,.58+o.dayK*.42,.64+o.dayK*.36),x.material.uniforms.uA.value=o.rain,h.material.uniforms.uA.value=o.snow,x.visible=o.rain>.01,h.visible=o.snow>.01}const _=new r.Vector3,W={U:S,state:i,snap(){M(1),E=0},attach(n,e){w=n,y=e,x.visible=h.visible=!1,M(1)},set(n,e,f=!0){if(n&&(i.time=n),e&&(i.wx=e),i.time==="now"&&(i.realTime=P()),i.wx==="now"&&B(),k(),f)try{localStorage.setItem("reutov3d.env",JSON.stringify({time:i.time,wx:i.wx}))}catch{}W.onchange&&W.onchange()},update(n,e){const f=l.getPixelRatio();for(const s of[x,h])s.visible&&(s.material.uniforms.uT.value=e,s.material.uniforms.uCam.value.copy(u.position),s.material.uniforms.uPx.value=f);w&&(w.material.uniforms.uT.value=e),S.uEnvT.value=e,_.set(0,1,0).transformDirection(u.matrixWorldInverse),S.uUp.value.copy(_);const v=performance.now()/1e3,C=Math.min(.5,v-(W._lt||v));if(W._lt=v,E>0){const s=1-Math.exp(-C*2.4);M(s),E-=C,E<=0&&M(1)}if(i.time==="now"&&v-(W._rt||0)>60){W._rt=v;const s=P();s!==i.realTime&&(i.realTime=s,k())}}};let K=!1;async function B(){if(!K){K=!0;try{const n=new AbortController,e=setTimeout(()=>n.abort(),6e3),f=await fetch("https://api.open-meteo.com/v1/forecast?latitude=55.761&longitude=37.859&current=temperature_2m,weather_code&timezone=Europe%2FMoscow",{signal:n.signal});clearTimeout(e);const v=await f.json(),C=v.current.weather_code,s=Math.round(v.current.temperature_2m);i.realWx=ne(C),i.note=`Сейчас в Реутове ${s>0?"+":""}${s}°, ${te(C)}`}catch{i.realWx="clear",i.note="Погоду узнать не удалось, показываю ясно"}K=!1,i.wx==="now"&&k(),W.onchange&&W.onchange()}}const R=new URLSearchParams(location.search);let z={};try{z=JSON.parse(localStorage.getItem("reutov3d.env")||"{}")}catch{}const F=R.get("time")||z.time||"day",G=R.get("wx")||z.wx||"clear";return i.time=$[F]?F:"day",i.wx=j[G]?G:"clear",W.set(null,null,!1),M(1),E=0,W}export{$ as TIME_NAMES,j as WX_NAMES,ie as makeEnv};
