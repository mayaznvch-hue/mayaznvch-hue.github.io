// Сервер «Реутов по делу»: раздаёт public/ и data/, проксирует внешние API с кэшем.
// Запуск: node server.mjs  →  http://localhost:8080
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 8080;
const UA = 'reutov-city-apps/1.0 (+https://github.com/reutov-city-apps)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const cache = new Map();
async function cached(key, ttlSec, fn) {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  try {
    const value = await fn();
    cache.set(key, { value, until: Date.now() + ttlSec * 1000 });
    return value;
  } catch (e) {
    if (hit) return { ...hit.value, stale: true }; // лучше старые данные, чем пустой экран
    throw e;
  }
}
async function get(url, { ua = UA, timeout = 20000, type = 'text' } = {}) {
  const r = await fetch(url, { headers: { 'user-agent': ua, accept: '*/*' }, signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw new Error(`${new URL(url).host} ответил ${r.status}`);
  return type === 'json' ? r.json() : r.text();
}

// ---------- электрички (tutu.ru) ----------
const ST = { reutov: 56708, moscow: 20000 };
function nextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('tutu.ru поменял вёрстку');
  return JSON.parse(m[1]);
}
async function tripTrains(from, to) {
  const html = await get(`https://www.tutu.ru/rasp.php?st1=${from}&st2=${to}`, { ua: BROWSER_UA });
  const sd = nextData(html).props.pageProps.backendData.serverSearchData;
  const c = sd.dictionary.common, e = sd.dictionary.etrain;
  const name = (id) => e.points[id]?.name?.nominative ?? '';
  return Object.values(c.segments)
    .map((s) => {
      const v = e.voyages[s.voyageNumber] || {};
      return {
        dep: s.departureDateTime, arr: s.arrivalDateTime, min: s.duration,
        from: name(s.departureGeoPointId), to: name(s.arrivalGeoPointId),
        number: v.number, routeFrom: name(v.initialDepartureId), routeTo: name(v.finalArrivalId),
        kind: e.vehicles[s.vehicleId]?.name || 'Электричка',
        track: v.platformDeparture?.trackNumber || '',
      };
    })
    .sort((a, b) => a.dep.localeCompare(b.dep));
}
async function stationBoard() {
  const html = await get(`https://www.tutu.ru/station.php?nnst=${ST.reutov}`, { ua: BROWSER_UA });
  const vals = nextData(html).props.pageProps.values;
  const v = Object.values(vals).find((x) => x && x.timetable);
  return v.timetable.map((r) => ({
    dep: r.departureDateTime, number: r.train.number, kind: r.train.name || 'Электричка',
    routeFrom: r.train.route.departure.name, routeTo: r.train.route.arrival.name,
    note: r.warning?.text || '', days: r.schedule,
  }));
}
const trains = {
  'to-moscow': () => tripTrains(ST.reutov, ST.moscow),
  'from-moscow': () => tripTrains(ST.moscow, ST.reutov),
  east: async () => (await stationBoard()).filter((t) => !/Москва|Каланч|Апрелевка|Одинцово|Усово|Очаково|Солнечная|Поклонная|Крёкшино|Нахабино|Звенигород/.test(t.routeTo)),
};

// ---------- погода ----------
async function weather() {
  const met = await get('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=55.761&lon=37.859', { type: 'json' });
  let air = null;
  try {
    air = await get('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=55.761&longitude=37.859&current=pm2_5,pm10,european_aqi,nitrogen_dioxide,birch_pollen,grass_pollen,ragweed_pollen,alder_pollen&timezone=Europe%2FMoscow', { type: 'json', timeout: 12000 });
  } catch { /* у open-meteo бывают таймауты из РФ, погода важнее */ }
  const series = met.properties.timeseries.slice(0, 48).map((t) => ({
    time: t.time,
    temp: t.data.instant.details.air_temperature,
    wind: t.data.instant.details.wind_speed,
    gust: t.data.instant.details.wind_speed_of_gust ?? null,
    hum: t.data.instant.details.relative_humidity,
    pressure: t.data.instant.details.air_pressure_at_sea_level,
    symbol: t.data.next_1_hours?.summary.symbol_code ?? t.data.next_6_hours?.summary.symbol_code,
    rain: t.data.next_1_hours?.details.precipitation_amount ?? null,
  }));
  return { updated: met.properties.meta.updated_at, series, air: air?.current ?? null };
}

// ---------- новости ----------
function rssItems(xml, source) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)) {
    const pick = (tag) => {
      const r = m[0].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return r ? r[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    };
    const decode = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&mdash;/g, '—');
    const text = decode(decode(pick('description'))).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const date = new Date(pick('pubDate'));
    items.push({ source, title: decode(pick('title')), link: decode(pick('link')), date: isNaN(date) ? null : date.toISOString(), text: text.slice(0, 260) });
  }
  return items;
}
async function mkdcNews() {
  const html = await get('https://mkdc-reutov.ru/press-center/news/', { ua: BROWSER_UA });
  const seen = new Set(), out = [];
  for (const m of html.matchAll(/<a[^>]+href="(\/press-center\/news\/[^"#?]+\/)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const title = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || title.length < 12 || seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push({ source: 'МКДЦ', title, link: 'https://mkdc-reutov.ru' + m[1], date: null, text: '' });
  }
  return out.slice(0, 12);
}
const FEEDS = [
  ['ПроРеутов', 'https://proreutov.ru/rss'],
  ['Библиотека', 'https://biblreut.ru/news/rss'],
  ['ДК «Мир»', 'https://www.dkreutov.ru/index.php?format=feed&type=rss'],
];
async function news() {
  const parts = await Promise.allSettled([
    ...FEEDS.map(([n, u]) => get(u, { ua: BROWSER_UA }).then((x) => rssItems(x, n))),
    mkdcNews(),
  ]);
  const items = parts.flatMap((p) => (p.status === 'fulfilled' ? p.value : []));
  const errors = parts.map((p, i) => (p.status === 'rejected' ? (FEEDS[i]?.[0] ?? 'МКДЦ') : null)).filter(Boolean);
  return { items, errors };
}

// ---------- прочее ----------
const ROUTES = {
  '/api/trains': async (q) => {
    const dir = q.get('dir') || 'to-moscow';
    if (!trains[dir]) throw new Error('неизвестное направление');
    return cached('trains:' + dir, 600, async () => ({ dir, fetched: new Date().toISOString(), items: await trains[dir]() }));
  },
  '/api/weather': () => cached('weather', 900, weather),
  '/api/news': () => cached('news', 1200, news),
  '/api/cbr': () => cached('cbr', 3600, () => get('https://www.cbr-xml-daily.ru/daily_json.js', { type: 'json' })),
  '/api/dayoff': async (q) => {
    const y = +q.get('year') || new Date().getFullYear();
    return cached('dayoff:' + y, 86400, async () => ({ year: y, days: await get(`https://isdayoff.ru/api/getdata?year=${y}&pre=1`) }));
  },
  '/api/route': async (q) => {
    const from = q.get('from'), to = q.get('to');
    if (!/^[\d.]+,[\d.]+$/.test(from) || !/^[\d.]+,[\d.]+$/.test(to)) throw new Error('нужны from и to как lon,lat');
    return cached(`route:${from}:${to}`, 86400, async () => {
      const urls = [
        `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${from};${to}?overview=full&geometries=geojson`,
        `https://router.project-osrm.org/route/v1/foot/${from};${to}?overview=full&geometries=geojson`,
      ];
      let last;
      for (const u of urls) { try { return await get(u, { type: 'json', timeout: 12000 }); } catch (e) { last = e; } }
      throw last;
    });
  },
};

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (ROUTES[u.pathname]) {
    try {
      const data = await ROUTES[u.pathname](u.searchParams);
      res.writeHead(200, { 'content-type': TYPES['.json'], 'cache-control': 'no-store' });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(502, { 'content-type': TYPES['.json'] });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  let p = decodeURIComponent(u.pathname);
  const base = p.startsWith('/data/') ? ROOT : path.join(ROOT, 'public');
  let file = path.normalize(path.join(base, p));
  if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (p.startsWith('/data/osm_tiles')) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Нет такой страницы'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`Реутов по делу: http://localhost:${PORT}`));
