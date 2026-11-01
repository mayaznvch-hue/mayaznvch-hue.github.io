// Скачивает данные OSM по Реутову тайлами через OSM API и собирает data/pois.json.
// Overpass из РФ часто недоступен, поэтому так. Запуск: node tools/fetch_osm.mjs
import fs from 'fs';
const S = 55.738, N = 55.782, W = 37.826, E = 37.894, step = 0.011;
const dir = new URL('../data/osm_tiles/', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tiles = [];
for (let lat = S; lat < N - 1e-9; lat += step) for (let lon = W; lon < E - 1e-9; lon += step)
  tiles.push([+lon.toFixed(4), +lat.toFixed(4), +Math.min(lon + step, E).toFixed(4), +Math.min(lat + step, N).toFixed(4)]);
let ok = 0;
for (const t of tiles) {
  const f = new URL(`t_${t.join('_')}.json`, dir);
  if (fs.existsSync(f) && fs.statSync(f).size > 1000) { ok++; continue; }
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`https://api.openstreetmap.org/api/0.6/map.json?bbox=${t.join(',')}`, { headers: { 'user-agent': 'reutov-city-apps/1.0' }, signal: AbortSignal.timeout(120000) });
      const tx = await r.text();
      if (r.ok && tx.startsWith('{')) { fs.writeFileSync(f, tx); ok++; console.log('tile', t.join(','), tx.length); break; }
      console.log('bad', r.status, tx.slice(0, 80));
    } catch (e) { console.log('err', e.message); }
    await sleep(3000);
  }
  await sleep(800);
}
console.log('tiles', ok, '/', tiles.length);
