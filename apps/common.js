// Общие помощники для приложений. Без сборщика: подключается как обычный модуль.
export const CENTER = [55.7612, 37.8590]; // ул. Победы, у МКДЦ
export const TZ = 'Europe/Moscow';

export function header(title) {
  const el = document.createElement('header');
  el.className = 'top';
  el.innerHTML = `<div class="in"><a class="logo" href="/">Реутов <b>по делу</b></a><span class="crumb">${title}</span></div>`;
  document.body.prepend(el);
  const f = document.createElement('footer');
  f.className = 'wrap foot';
  f.style.paddingTop = '0';
  f.innerHTML = `<div class="foot">${document.body.dataset.source || ''}</div>`;
  document.body.append(f);
}

export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function api(path) {
  const r = await fetch(path);
  const j = await r.json().catch(() => ({ error: 'сервер вернул не JSON' }));
  if (!r.ok || j.error) throw new Error(j.error || `ошибка ${r.status}`);
  return j;
}

let poiPromise;
export function pois() {
  poiPromise ??= fetch('/data/pois.json').then((r) => r.json()).then((j) => j.items);
  return poiPromise;
}

// Московское время независимо от часового пояса устройства
export function mskNow(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second, wd: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) };
}
export const hhmm = (iso) => new Date(iso).toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
export const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
export function minsText(m) {
  m = Math.round(m);
  if (m < 60) return `${m} ${plural(m, 'минута', 'минуты', 'минут')}`;
  const h = Math.floor(m / 60), r = m % 60;
  return `${h} ч${r ? ' ' + r + ' мин' : ''}`;
}

export function dist(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
export const distText = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} м` : `${(m / 1000).toFixed(1).replace('.', ',')} км`);

// Геолокация. Если отказали или человек не в Реутове, берём центр города.
export function locate() {
  return new Promise((res) => {
    if (!navigator.geolocation) return res({ pos: CENTER, real: false });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = [p.coords.latitude, p.coords.longitude];
        res(dist(pos, CENTER) < 8000 ? { pos, real: true } : { pos: CENTER, real: false, far: true });
      },
      () => res({ pos: CENTER, real: false }),
      { timeout: 8000, maximumAge: 120000 },
    );
  });
}

export function makeMap(el, { zoom = 14, center = CENTER } = {}) {
  const map = L.map(el, { zoomControl: true, attributionControl: true }).setView(center, zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">участники OpenStreetMap</a>',
  }).addTo(map);
  return map;
}
export const dot = (color, size = 14) => L.divIcon({ className: '', html: `<div class="pin" style="background:${color};width:${size}px;height:${size}px"></div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
export const meIcon = () => L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

export async function walk(from, to) {
  const j = await api(`/api/route?from=${from[1].toFixed(6)},${from[0].toFixed(6)}&to=${to[1].toFixed(6)},${to[0].toFixed(6)}`);
  const r = j.routes[0];
  // OSRM на демо-серверах часто отдаёт «пешее» время по профилю машины. Считаем сами: 4,8 км/ч.
  return { meters: r.distance, minutes: r.distance / 80, line: r.geometry.coordinates.map(([lo, la]) => [la, lo]) };
}

// ---------- часы работы OSM ----------
// Понимает самые частые формы: 24/7, «Mo-Fr 08:00-20:00; Sa 10:00-18:00; Su off», перечисления, ночные интервалы.
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_RU = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
function parseDays(s) {
  const set = new Set();
  for (const part of s.split(',')) {
    const [a, b] = part.split('-').map((x) => DAYS.indexOf(x.trim()));
    if (a < 0) return null;
    if (b === undefined) set.add(a);
    else if (b < 0) return null;
    else for (let i = a; ; i = (i + 1) % 7) { set.add(i); if (i === b) break; }
  }
  return set;
}
export function parseHours(str) {
  if (!str) return null;
  const s = str.trim();
  if (s === '24/7') return { always: true, week: Array.from({ length: 7 }, () => [[0, 1440]]) };
  const week = Array.from({ length: 7 }, () => null);
  for (let rule of s.split(';')) {
    rule = rule.trim();
    if (!rule || /^PH/.test(rule)) continue;
    const m = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)?\s*(.*)$/);
    if (!m) return null;
    const days = m[1] ? parseDays(m[1]) : new Set([0, 1, 2, 3, 4, 5, 6]);
    if (!days) return null;
    const rest = m[2].trim();
    let spans;
    if (/^(off|closed)$/i.test(rest)) spans = [];
    else if (rest === '24/7' || rest === '00:00-24:00') spans = [[0, 1440]];
    else {
      spans = [];
      for (const t of rest.split(',')) {
        const q = t.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})\+?$/);
        if (!q) return null;
        const a = +q[1] * 60 + +q[2];
        let b = +q[3] * 60 + +q[4];
        if (b <= a) b += 1440; // через полночь
        spans.push([a, b]);
      }
    }
    for (const d of days) week[d] = spans;
  }
  return { always: false, week };
}
const tm = (m) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
// Возвращает {state: 'open'|'closed'|'unknown', text}
export function hoursState(str, now = mskNow()) {
  const p = parseHours(str);
  if (!p) return { state: 'unknown', text: str ? 'часы в непривычном формате' : 'часы не указаны' };
  if (p.always) return { state: 'open', text: 'круглосуточно' };
  const cur = now.h * 60 + now.min;
  const today = p.week[now.wd], yest = p.week[(now.wd + 6) % 7];
  for (const [a, b] of yest || []) if (b > 1440 && cur < b - 1440) return { state: 'open', text: `до ${tm(b)}` };
  for (const [a, b] of today || []) {
    if (cur >= a && cur < b) {
      const left = b - cur;
      return { state: 'open', text: b - a >= 1440 ? 'круглосуточно' : left <= 45 ? `закроется через ${left} мин` : `до ${tm(b)}` };
    }
  }
  for (const [a] of today || []) if (a > cur) return { state: 'closed', text: `откроется в ${tm(a)}` };
  for (let k = 1; k <= 7; k++) {
    const d = (now.wd + k) % 7, sp = p.week[d];
    if (sp && sp.length) return { state: 'closed', text: `откроется ${k === 1 ? 'завтра' : 'в ' + DAY_RU[d]} в ${tm(sp[0][0])}` };
  }
  if (p.week.every((x) => x === null)) return { state: 'unknown', text: 'часы не указаны' };
  return { state: 'closed', text: 'закрыто' };
}
export function hoursHuman(str) {
  const p = parseHours(str);
  if (!p) return esc(str || '');
  if (p.always) return 'круглосуточно';
  const out = [];
  let i = 0;
  const key = (sp) => (sp === null ? '?' : sp.map(([a, b]) => tm(a) + '–' + tm(b)).join(', ') || 'выходной');
  while (i < 7) {
    let j = i;
    while (j + 1 < 7 && key(p.week[j + 1]) === key(p.week[i])) j++;
    if (p.week[i] !== null) out.push(`${DAY_RU[i]}${j > i ? '–' + DAY_RU[j] : ''} ${key(p.week[i])}`);
    i = j + 1;
  }
  return out.join('; ').replace(/00:00–24:00/g, 'круглосуточно');
}

export function addrOf(t) {
  const s = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ');
  return s.replace(/^улица /, 'ул. ').replace(/^проспект /, 'пр-т ').replace(/^шоссе /, 'ш. ');
}
