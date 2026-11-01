import * as THREE from 'three';

// Карта: x на восток, y на север (метры от центра здания Победы, 6).
// В three.js: (x, высота, -y).
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9bccb);
scene.fog = new THREE.Fog(0xa9bccb, 180, 620);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.3, 2000);

scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x6b6450, 1.1));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.set(-160, 220, 90);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 700 });
sun.shadow.bias = -0.0004;
scene.add(sun);

const P = (x, y, h = 0) => new THREE.Vector3(x, h, -y);

// ---------- текстуры ----------
function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// окно в ячейке 3.2 × 3 м
function windowTex(wall, glass, frame) {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    g.fillStyle = frame; g.fillRect(16, 14, 32, 34);
    g.fillStyle = glass; g.fillRect(19, 17, 26, 28);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(19, 17, 26, 6);
    g.fillStyle = frame; g.fillRect(31, 17, 2, 28);
  });
}

const palettes = {
  panel: ['#d8d2c4', '#4b5560', '#f1efe9'],
  yellow: ['#d9b96a', '#4a525a', '#efe9da'],
  brick: ['#9a5a46', '#3e464e', '#e8e2d6'],
  white: ['#e6e3dc', '#52606b', '#ffffff'],
  grey: ['#a9a8a2', '#3f474f', '#d8d6cf'],
};
const wallMats = {};
for (const [k, [w, gl, fr]] of Object.entries(palettes)) {
  const t = windowTex(w, gl, fr);
  t.repeat.set(1 / 3.2, 1 / 3);
  wallMats[k] = new THREE.MeshLambertMaterial({ map: t });
}
const roofMat = new THREE.MeshLambertMaterial({ color: 0x77736c });

// ---------- данные ----------
const data = await (await fetch('scene.json')).json();
const MKDC_ID = 133201687;
const labels = []; // [Vector3, текст, радиус]

// земля
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ color: 0x7f8a63 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function shapeFrom(pts) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  return s;
}
function centroid(pts) {
  let x = 0, y = 0;
  for (const p of pts) { x += p[0]; y += p[1]; }
  return [x / pts.length, y / pts.length];
}

// площади
const areaColors = {
  park: 0x6f8a52, grass: 0x7c9659, wood: 0x5d7646, residential: 0x93968a, commercial: 0x9a978f,
  industrial: 0x8d8a84, parking: 0x6c6e70, pitch: 0x5f8f54, religious: 0x8f9a7a, kindergarten: 0x8aa06a, clinic: 0x949488,
};
for (const a of data.areas) {
  if (a.t === 'tree_row' || a.p.length < 4) continue;
  const col = areaColors[a.t] ?? 0x8b9177;
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shapeFrom(a.p)), new THREE.MeshLambertMaterial({ color: col }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = a.t === 'parking' || a.t === 'pitch' ? 0.04 : 0.02;
  m.receiveShadow = true;
  scene.add(m);
  if (a.name) { const [cx, cy] = centroid(a.p); labels.push([P(cx, cy, 2), a.name, 45]); }
}

// дороги
const roadW = { tertiary: 10, residential: 7, service: 4.5, footway: 2.2, path: 1.8, cycleway: 2, steps: 2.5 };
const roadCol = { tertiary: 0x4f5255, residential: 0x55585b, service: 0x5d6063, footway: 0xa49d90, path: 0x9b9384, cycleway: 0x8a5a4c, steps: 0xb0aaa0 };
const roadY = { tertiary: 0.09, residential: 0.08, service: 0.07, footway: 0.1, path: 0.1, cycleway: 0.1, steps: 0.11 };
const roadGeoms = {};
function ribbon(pts, w, y, out) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = P(pts[i][0], pts[i][1], y), b = P(pts[i + 1][0], pts[i + 1][1], y);
    const d = new THREE.Vector3().subVectors(b, a); d.y = 0; d.normalize();
    const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(w / 2);
    const ext = d.clone().multiplyScalar(w / 2.2);
    const a2 = a.clone().sub(ext), b2 = b.clone().add(ext);
    const q = [a2.clone().add(n), a2.clone().sub(n), b2.clone().add(n), b2.clone().sub(n)];
    out.push(...q[0].toArray(), ...q[1].toArray(), ...q[2].toArray(), ...q[1].toArray(), ...q[3].toArray(), ...q[2].toArray());
  }
}
for (const r of data.roads) {
  if (r.area) continue;
  const t = roadW[r.t] ? r.t : 'service';
  (roadGeoms[t] ??= []);
  ribbon(r.p, roadW[t], roadY[t], roadGeoms[t]);
  if (r.name && r.p.length > 1) {
    const mid = r.p[Math.floor(r.p.length / 2)];
    labels.push([P(mid[0], mid[1], 2), r.name, 25]);
  }
}
for (const [t, arr] of Object.entries(roadGeoms)) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: roadCol[t], side: THREE.DoubleSide }));
  m.receiveShadow = true;
  scene.add(m);
}

// дома
function pickPalette(b) {
  if (b.type === 'church') return 'white';
  if (b.type === 'industrial' || b.type === 'garages') return 'grey';
  const lv = b.lv ?? 3;
  if (/казарм/i.test(b.name || '')) return 'brick';
  if (lv >= 9) return (b.id % 2) ? 'panel' : 'white';
  if (lv >= 4) return (b.id % 3 === 0) ? 'yellow' : 'brick';
  return (b.id % 2) ? 'yellow' : 'grey';
}
const blocks = []; // для простых столкновений: [minX,maxX,minZ,maxZ,h]
for (const b of data.buildings) {
  if (b.id === MKDC_ID) continue;
  let h = parseFloat(b.h) || (b.lv ? b.lv * 3 + 0.8 : 7);
  if (b.type === 'garages' || b.type === 'garage') h = 3;
  const pts = b.p.slice(0, -1);
  if (pts.length < 3) continue;
  const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), { depth: h, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, [roofMat, wallMats[pickPalette(b)]]);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  if (b.type === 'church') addDome(centroid(pts), h);
  const box = new THREE.Box3().setFromObject(m);
  blocks.push([box.min.x, box.max.x, box.min.z, box.max.z, h]);
  if (b.name) { const [cx, cy] = centroid(pts); labels.push([P(cx, cy, h + 2), b.name + (b.num ? `, д. ${b.num}` : ''), 40]); }
}
function addDome([x, y], h) {
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a449, metalness: 0.8, roughness: 0.3 });
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4, 16), wallMats.white);
  drum.position.copy(P(x, y, h + 2));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold);
  dome.scale.y = 1.4; dome.position.copy(P(x, y, h + 4));
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), gold);
  cross.position.copy(P(x, y, h + 8.6));
  scene.add(drum, dome, cross);
}

// деревья
const treeSpots = [];
function inPoly(x, y, pts) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (const a of data.areas) {
  if (a.t === 'tree_row') {
    for (let i = 0; i < a.p.length - 1; i++) {
      const [x1, y1] = a.p[i], [x2, y2] = a.p[i + 1];
      const L = Math.hypot(x2 - x1, y2 - y1);
      for (let s = 0; s < L; s += 7) treeSpots.push([x1 + ((x2 - x1) * s) / L, y1 + ((y2 - y1) * s) / L]);
    }
  } else if (['wood', 'park', 'grass'].includes(a.t)) {
    const xs = a.p.map((p) => p[0]), ys = a.p.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const step = a.t === 'wood' ? 6 : 11;
    for (let x = x0; x < x1; x += step) for (let y = y0; y < y1; y += step) {
      const jx = x + (rnd() - 0.5) * step * 0.8, jy = y + (rnd() - 0.5) * step * 0.8;
      if (inPoly(jx, jy, a.p) && rnd() > 0.25) treeSpots.push([jx, jy]);
    }
  }
}
// убираем деревья, попавшие в дома и на проезжую часть у фасада
const treeOk = ([x, y]) => !blocks.some(([a, b, c, d]) => { const v = P(x, y); return v.x > a - 1 && v.x < b + 1 && v.z > c - 1 && v.z < d + 1; })
  && !inPoly(x, y, data.buildings.find((b) => b.id === MKDC_ID).p);
const spots = treeSpots.filter(treeOk);
{
  const n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.25, 3, 6), new THREE.MeshLambertMaterial({ color: 0x5b4636 }), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.6, 0), new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
  const autumn = [0x6d7f3f, 0x8c8a3c, 0xa8782f, 0x7a6a36, 0x5e7a45, 0xb3893a];
  const mtx = new THREE.Matrix4(), col = new THREE.Color();
  spots.forEach(([x, y], i) => {
    const s = 0.8 + rnd() * 0.6;
    mtx.compose(P(x, y, 1.5 * s), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); trunk.setMatrixAt(i, mtx);
    mtx.compose(P(x, y, 4.6 * s), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(), rnd() * 6, 0)), new THREE.Vector3(s, s * 1.15, s)); crown.setMatrixAt(i, mtx);
    crown.setColorAt(i, col.setHex(autumn[Math.floor(rnd() * autumn.length)]));
  });
  trunk.castShadow = crown.castShadow = true;
  scene.add(trunk, crown);
}

// ---------- молодёжный центр ----------
// Фасад смотрит на юго-запад, на улицу Победы. Края фасада по OSM: (-28,-2.5) и (-0.9,-27).
const mk = data.buildings.find((b) => b.id === MKDC_ID);
{
  const base = new THREE.ExtrudeGeometry(shapeFrom(mk.p.slice(0, -1)), { depth: 12, bevelEnabled: false });
  base.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(base, [new THREE.MeshLambertMaterial({ color: 0x8e8b84 }), new THREE.MeshLambertMaterial({ color: 0xc9c6b8 })]);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
}
const L0 = [-28, -2.5], R0 = [-0.9, -27];
const facadeW = Math.hypot(R0[0] - L0[0], R0[1] - L0[1]);
const facade = new THREE.Group();
facade.position.copy(P((L0[0] + R0[0]) / 2, (L0[1] + R0[1]) / 2));
{
  // наружу: в сторону улицы Победы (на юго-запад)
  const along = P(R0[0] - L0[0], R0[1] - L0[1]).normalize();
  let out = new THREE.Vector3(-along.z, 0, along.x);
  const toStreet = P(-40, -40).sub(facade.position);
  if (out.dot(toStreet) < 0) out.negate();
  const upv = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3().crossVectors(upv, out).normalize();
  facade.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, upv, out));
}
scene.add(facade);

const C = {
  stone: new THREE.MeshLambertMaterial({ color: 0xc9c6b8 }),
  pil: new THREE.MeshLambertMaterial({ color: 0xbdb3b8 }),
  orange: new THREE.MeshLambertMaterial({ color: 0xde4f2b }),
  plinth: new THREE.MeshLambertMaterial({ color: 0x8a4a42 }),
  bronze: new THREE.MeshStandardMaterial({ color: 0xa99a55, metalness: 0.75, roughness: 0.35 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b3640, metalness: 0.6, roughness: 0.2 }),
  rail: new THREE.MeshStandardMaterial({ color: 0x9aa0a4, metalness: 0.8, roughness: 0.4 }),
  stepM: new THREE.MeshLambertMaterial({ color: 0xb9b4a8 }),
};
// зеркальное остекление с оранжевыми переплётами
function glazing(cols, rows) {
  const t = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#8fb1c6'); gr.addColorStop(0.5, '#5d7e95'); gr.addColorStop(1, '#a9c4d3');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#de4f2b'; g.lineWidth = 7;
    g.strokeRect(0, 0, w, h);
    g.lineWidth = 4;
    for (let i = 1; i < cols; i++) { g.beginPath(); g.moveTo((w * i) / cols, 0); g.lineTo((w * i) / cols, h); g.stroke(); }
    for (let j = 1; j < rows; j++) { g.beginPath(); g.moveTo(0, (h * j) / rows); g.lineTo(w, (h * j) / rows); g.stroke(); }
  }, false);
  return new THREE.MeshStandardMaterial({ map: t, metalness: 0.55, roughness: 0.15 });
}
let cur = facade;
function box(w, h, d, mat, x, y, z, parent = cur) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  parent.add(m); return m;
}
function plane(w, h, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); cur.add(m); return m;
}
const hw = facadeW / 2;
// крылья: от края центрального выступа (9.3 м от оси) до углов
for (const s of [-1, 1]) {
  box(9, 1.2, 0.5, C.plinth, s * 13.8, 0.6, 0.2);
  plane(4.2, 9.6, glazing(4, 8), s * 13.8, 6.6, 0.47);
  for (const px of [10.2, 11.3, 16.3, hw - 0.4]) box(0.8, 11.6, 0.8, C.pil, s * px, 5.8, 0.4);
  for (let i = 0; i < 2; i++) plane(0.9, 0.5, C.dark, s * (12.5 + i * 2.6), 0.6, 0.47);
  box(9, 0.5, 0.9, C.stone, s * 13.8, 12.1, 0.3);
}
// центральный выступ: по OSM вынесен на 6.6 м к улице
const cg = new THREE.Group(); cg.position.z = 6.6; facade.add(cg); cur = cg;
// центральная часть
box(18.6, 2.6, 7.2, C.stone, 0, 13.3, -3.4);
// вход-лоджия
plane(9, 3.6, glazing(6, 2), 0, 1.95, 0.05);
plane(9, 4.8, glazing(6, 3), 0, 8.2, 0.05);
// круглые окна
for (const s of [-1, 1]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.16, 8, 28), C.orange);
  ring.position.set(s * 5.6, 10.8, 0.1); cg.add(ring);
  const gl = new THREE.Mesh(new THREE.CircleGeometry(0.95, 28), C.dark);
  gl.position.set(s * 5.6, 10.8, 0.05); cg.add(gl);
}
// внешние колонны с «манжетами»
for (const s of [-1, 1]) {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 13.6, 18), C.orange);
  col.position.set(s * 7.4, 6.8, 2.4); col.castShadow = true; cg.add(col);
  for (const y of [4.4, 8.6, 12.8]) box(1.2, 0.45, 1.2, C.orange, s * 7.4, y, 2.4);
}
// внутренние колонны под балконом
for (const s of [-1, 1]) {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 7.2, 16), C.orange);
  col.position.set(s * 3.6, 3.6, 4.0); col.castShadow = true; cg.add(col);
}
// балкон и красная вывеска на его парапете
box(11.4, 0.35, 4.7, C.stone, 0, 3.85, 2.35);
const signTex = canvasTex(1024, 96, (g, w, h) => {
  g.fillStyle = '#d42a1e'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = '600 64px "Golos Text", Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('МОЛОДЕЖНЫЙ  ЦЕНТР', w / 2, h / 2 + 3);
}, false);
const sign = box(11.4, 1.05, 0.25, [C.orange, C.orange, C.orange, C.orange, new THREE.MeshBasicMaterial({ map: signTex }), C.orange], 0, 4.55, 4.62);
for (let i = 0; i <= 18; i++) box(0.05, 0.9, 0.05, C.rail, -5.5 + i * (11 / 18), 5.55, 4.6);
box(11.2, 0.07, 0.07, C.rail, 0, 6.0, 4.6);
// бронзовый полуцилиндр и стеклянная пирамида
{
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 10, 24, 1, false, 0, Math.PI), C.bronze);
  cyl.rotation.set(0, 0, Math.PI / 2);
  cyl.position.set(0, 14.6, -0.6); cyl.castShadow = true; cg.add(cyl);
  const pyrGeo = new THREE.ConeGeometry(4.2, 4.2, 4, 1);
  pyrGeo.rotateY(Math.PI / 4);
  const pyr = new THREE.Mesh(pyrGeo, new THREE.MeshStandardMaterial({ color: 0x9cc0d6, metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.55 }));
  pyr.position.set(0, 14.6 + 2.1, -4.2); cg.add(pyr);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(pyrGeo), new THREE.LineBasicMaterial({ color: 0xde4f2b }));
  edges.position.copy(pyr.position); cg.add(edges);
  for (let k = 1; k < 4; k++) {
    const r = 4.2 * (1 - k / 4);
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([0, 1, 2, 3].map((i) => new THREE.Vector3(Math.cos(i * Math.PI / 2) * r, 0, Math.sin(i * Math.PI / 2) * r))), new THREE.LineBasicMaterial({ color: 0xde4f2b }));
    ring.rotation.y = Math.PI / 4; ring.position.set(0, 14.6 + 4.2 * k / 4, -4.2); cg.add(ring);
  }
}
// лестница, пандус, поручни
for (let i = 0; i < 6; i++) box(12.5, 0.15 * (6 - i), 0.45, C.stepM, 0, 0.075 * (6 - i), 4.9 + i * 0.45);
box(2.4, 0.5, 6, C.stepM, -8.4, 0.25, 6.2).rotation.x = -0.08;
box(0.06, 0.06, 6, C.rail, -9.5, 1.2, 6.2);
for (let i = 0; i < 4; i++) box(0.05, 1.0, 0.05, C.rail, -9.5, 0.7, 3.6 + i * 1.8);
// мемориальная доска у входа
box(0.9, 0.6, 0.06, C.bronze, -5.2, 2.0, 1.95);
cur = facade;
// ёлки и фонари перед фасадом
const fir = new THREE.MeshLambertMaterial({ color: 0x2f4a33 });
for (const s of [-1, 1]) {
  for (let k = 0; k < 3; k++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.8 - k * 0.45, 2.6, 8), fir);
    c.position.set(s * 14, 1.6 + k * 1.5, 12); c.castShadow = true; facade.add(c);
  }
  box(0.12, 6, 0.12, C.dark, s * 17, 3, 15);
  box(0.9, 0.18, 0.35, C.dark, s * 17, 6, 15);
}
facade.updateMatrixWorld(true);
const facadeTarget = facade.localToWorld(new THREE.Vector3(0, 7, 6));
labels.push([facade.localToWorld(new THREE.Vector3(0, 8, 6)), 'Молодёжный центр (МКДЦ), Победы, 6', 70]);
blocks.push((() => { const b = new THREE.Box3(); mk.p.forEach(([x, y]) => b.expandByPoint(P(x, y))); return [b.min.x, b.max.x, b.min.z, b.max.z, 20]; })());

// ---------- мемориалы ----------
const findPt = (re) => data.points.find((p) => re.test(p.tags.name || ''));
const flamePt = findPt(/Вечный огонь/)?.p ?? [-13.7, -80.1];
const granite = new THREE.MeshStandardMaterial({ color: 0x3a2a28, roughness: 0.45, metalness: 0.1 });
let flameLight, flames = [];
{
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 1.1 : 2.6, a = Math.PI / 2 + (i * Math.PI) / 5;
    i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const sg = new THREE.ExtrudeGeometry(star, { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 });
  sg.rotateX(-Math.PI / 2);
  const s = new THREE.Mesh(sg, granite);
  s.position.copy(P(flamePt[0], flamePt[1], 0.35)); s.castShadow = true; scene.add(s);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.2, 0.3, 40), new THREE.MeshLambertMaterial({ color: 0x8e8a82 }));
  plate.position.copy(P(flamePt[0], flamePt[1], 0.15)); plate.receiveShadow = true; scene.add(plate);
  const fm = [0xffd27a, 0xff9a3c, 0xff5a1f].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.45 - i * 0.1, 1.6 - i * 0.3, 10, 1, true), fm[i]);
    f.position.copy(P(flamePt[0], flamePt[1], 1.5)); scene.add(f); flames.push(f);
  }
  flameLight = new THREE.PointLight(0xff8a3a, 6, 18, 1.6);
  flameLight.position.copy(P(flamePt[0], flamePt[1], 2.2)); scene.add(flameLight);
  labels.push([P(flamePt[0], flamePt[1], 2), 'Вечный огонь, сквер Победы', 30]);
}
// БТР
const btr = findPt(/Бронетранспорт/);
if (btr) {
  const olive = new THREE.MeshLambertMaterial({ color: 0x4f5a37 });
  const g = new THREE.Group(); g.position.copy(P(btr.p[0], btr.p[1], 0)); g.rotation.y = 0.7;
  box(2.8, 1.5, 7.4, olive, 0, 1.9, 0, g);
  box(2.4, 0.9, 3, olive, 0, 3.0, -0.6, g);
  box(1.0, 0.6, 1.0, olive, 0, 3.7, -0.4, g);
  box(0.12, 0.12, 2, C.dark, 0, 3.75, 1.0, g);
  box(3.6, 0.6, 9, new THREE.MeshLambertMaterial({ color: 0x9b968c }), 0, 0.3, 0, g);
  for (const sx of [-1.45, 1.45]) for (const z of [-2.6, -0.9, 0.9, 2.6]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 14), C.dark);
    w.rotation.z = Math.PI / 2; w.position.set(sx, 1.2, z); g.add(w);
  }
  scene.add(g);
  labels.push([P(btr.p[0], btr.p[1], 3), 'БТР на аллее Героев', 25]);
}
// стелы аллеи Героев (безымянные узлы historic=memorial рядом)
for (const p of data.points) {
  if (p.tags.historic === 'memorial' && !p.tags.name && !p.tags.memorial) {
    box(0.9, 1.9, 0.25, granite, 0, 0, 0, scene).position.copy(P(p.p[0], p.p[1], 1.0));
  }
}
labels.push([P(12, -118, 2), 'Аллея Героев', 22]);
// памятник Ленину
const lenin = findPt(/Ленину/);
if (lenin) {
  const g = new THREE.Group(); g.position.copy(P(lenin.p[0], lenin.p[1]));
  box(2, 3, 2, new THREE.MeshLambertMaterial({ color: 0x8a8780 }), 0, 1.5, 0, g);
  const fig = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.4, 4, 8), new THREE.MeshLambertMaterial({ color: 0x9fa19c }));
  fig.position.y = 4; g.add(fig); scene.add(g);
  labels.push([P(lenin.p[0], lenin.p[1], 4), 'Памятник В. И. Ленину, 1925', 25]);
}
// колокол «Реут»
const bell = findPt(/Колокол/);
if (bell) {
  const g = new THREE.Group(); g.position.copy(P(bell.p[0], bell.p[1]));
  for (const s of [-1, 1]) box(0.4, 4, 0.4, granite, s * 1.4, 2, 0, g);
  box(3.4, 0.4, 0.5, granite, 0, 4.1, 0, g);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 1.1, 18, 1, true), C.bronze);
  b.material.side = THREE.DoubleSide; b.position.y = 3.3; g.add(b); scene.add(g);
  labels.push([P(bell.p[0], bell.p[1], 3), 'Колокол «Реут», самая высокая точка города', 25]);
}

// фонари вдоль улицы Победы
{
  const lamp = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 7, 6), C.dark, 200);
  let n = 0; const mtx = new THREE.Matrix4();
  for (const r of data.roads) {
    if (r.name !== 'улица Победы') continue;
    for (let i = 0; i < r.p.length - 1; i++) {
      const [x1, y1] = r.p[i], [x2, y2] = r.p[i + 1], L = Math.hypot(x2 - x1, y2 - y1);
      const nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
      for (let s = 0; s < L && n < 200; s += 28) {
        const x = x1 + ((x2 - x1) * s) / L + nx * 5.5, y = y1 + ((y2 - y1) * s) / L + ny * 5.5;
        mtx.makeTranslation(...P(x, y, 3.5).toArray()); lamp.setMatrixAt(n++, mtx);
      }
    }
  }
  lamp.count = n; scene.add(lamp);
}

// ---------- управление ----------
const startEl = document.getElementById('start'), hud = document.getElementById('hud'), placeEl = document.getElementById('place');
const card = document.getElementById('card'), help = document.getElementById('help');
let yaw = 0, pitch = 0, orbit = false, orbitA = 0, started = false;
const keys = {};
const isTouch = matchMedia('(pointer: coarse)').matches;

function lookAt(pos, target) {
  camera.position.copy(pos);
  const d = new THREE.Vector3().subVectors(target, pos).normalize();
  yaw = Math.atan2(-d.x, -d.z); pitch = Math.asin(d.y);
}
const views = {
  1: () => lookAt(facade.localToWorld(new THREE.Vector3(6, 3.5, 42)), facadeTarget),
  2: () => lookAt(P(flamePt[0] - 4, flamePt[1] - 9, 2.2), facadeTarget),
  3: () => lookAt(facade.localToWorld(new THREE.Vector3(-30, 95, 75)), facade.localToWorld(new THREE.Vector3(0, 0, -10))),
};
views[1]();

function lockMouse() { try { const r = renderer.domElement.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
function begin() {
  started = true; startEl.style.display = 'none';
  hud.style.display = help.style.display = 'block';
  if (isTouch) setupTouch(); else lockMouse();
}
startEl.addEventListener('click', begin);
renderer.domElement.addEventListener('click', () => { if (started && !isTouch && !document.pointerLockElement) lockMouse(); });
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * 0.0022; pitch -= e.movementY * 0.0022;
  pitch = Math.max(-1.5, Math.min(1.5, pitch));
});
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!started) return;
  if (e.code === 'KeyO') orbit = !orbit;
  if (e.code === 'KeyI') card.style.display = card.style.display === 'block' ? 'none' : 'block';
  if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) { orbit = false; views[e.code.slice(-1)](); }
  if (e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', (e) => (keys[e.code] = false));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function setupTouch() {
  document.getElementById('touch').style.display = 'flex';
  const L = [['', ''], ['▲', 'KeyW'], ['', ''], ['◀', 'KeyA'], ['▼', 'KeyS'], ['▶', 'KeyD']];
  const R = [['↑', 'Space'], ['⟲', 'TurnL'], ['⟳', 'TurnR'], ['↓', 'KeyC'], ['O', 'KeyO'], ['i', 'KeyI']];
  for (const [id, set] of [['padL', L], ['padR', R]]) {
    const pad = document.getElementById(id);
    for (const [t, code] of set) {
      const b = document.createElement('button'); b.textContent = t;
      if (!code) b.style.visibility = 'hidden';
      b.addEventListener('touchstart', (e) => { e.preventDefault(); keys[code] = true; if (code === 'KeyO') orbit = !orbit; if (code === 'KeyI') card.style.display = card.style.display === 'block' ? 'none' : 'block'; });
      b.addEventListener('touchend', (e) => { e.preventDefault(); keys[code] = false; });
      pad.appendChild(b);
    }
  }
  let last = null;
  renderer.domElement.addEventListener('touchstart', (e) => (last = e.touches[0]));
  renderer.domElement.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (last) { yaw -= (t.clientX - last.clientX) * 0.005; pitch = Math.max(-1.5, Math.min(1.5, pitch - (t.clientY - last.clientY) * 0.005)); }
    last = t;
  });
}

const clock = new THREE.Clock();
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
const orbitC = facade.localToWorld(new THREE.Vector3(0, 0, -10));
function step() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (orbit) {
    orbitA += dt * 0.18;
    const p = orbitC.clone().add(new THREE.Vector3(Math.sin(orbitA) * 75, 32, Math.cos(orbitA) * 75));
    lookAt(p, orbitC.clone().setY(8));
  } else {
    if (keys.TurnL) yaw += dt * 1.4;
    if (keys.TurnR) yaw -= dt * 1.4;
    const speed = (keys.ShiftLeft || keys.ShiftRight ? 60 : 18) * dt;
    fwd.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const mv = new THREE.Vector3();
    if (keys.KeyW) mv.add(fwd);
    if (keys.KeyS) mv.sub(fwd);
    if (keys.KeyD) mv.add(right);
    if (keys.KeyA) mv.sub(right);
    if (keys.Space) mv.add(up);
    if (keys.KeyC || keys.ControlLeft) mv.sub(up);
    if (mv.lengthSq()) {
      const next = camera.position.clone().addScaledVector(mv.normalize(), speed);
      next.y = Math.max(1.7, Math.min(400, next.y));
      const hit = blocks.some(([a, b, c, d, h]) => next.x > a - 0.6 && next.x < b + 0.6 && next.z > c - 0.6 && next.z < d + 0.6 && next.y < h + 0.6);
      if (!hit) camera.position.copy(next);
      else { const slide = camera.position.clone(); slide.y = next.y; camera.position.copy(slide); }
    }
  }
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

  flames.forEach((f, i) => { const k = 1 + Math.sin(t * (9 + i * 3)) * 0.12 + Math.sin(t * 23 + i) * 0.06; f.scale.set(1, k, 1); f.rotation.y = t * (1 + i); });
  flameLight.intensity = 5 + Math.sin(t * 13) * 1.2 + Math.sin(t * 31) * 0.6;

  if (started) {
    let best = null, bd = Infinity;
    for (const [p, txt, r] of labels) { const d = p.distanceTo(camera.position); if (d < r && d < bd) { bd = d; best = txt; } }
    placeEl.style.display = best ? 'block' : 'none';
    if (best) placeEl.textContent = best;
    const toMk = Math.round(camera.position.distanceTo(facadeTarget));
    hud.innerHTML = `Высота <b>${camera.position.y.toFixed(0)} м</b> · до центра <b>${toMk} м</b>${orbit ? ' · облёт' : ''}`;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(step);
}
step();
window.__ready = true;
window.__view = (k) => { orbit = false; views[k](); };
window.__cam = camera;
