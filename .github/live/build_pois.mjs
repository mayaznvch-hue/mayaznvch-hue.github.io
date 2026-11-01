// Собирает data/pois.json из тайлов data/osm_tiles (узлы и центры полигонов с нужными тегами).
// Запуск: node tools/build_pois.mjs
import fs from 'fs';
const dir = 'data/osm_tiles/';
const nodes = new Map(), ways = new Map();
for (const f of fs.readdirSync(dir)) {
  const j = JSON.parse(fs.readFileSync(dir + f, 'utf8'));
  for (const e of j.elements) {
    if (e.type === 'node') nodes.set(e.id, e);
    else if (e.type === 'way') ways.set(e.id, e);
  }
}
const KEEP = {
  amenity: /^(pharmacy|clinic|hospital|doctors|dentist|post_office|bank|atm|library|school|kindergarten|townhall|police|fire_station|arts_centre|community_centre|theatre|cinema|marketplace|recycling|toilets|fuel|charging_station|place_of_worship|social_facility|veterinary|parcel_locker|cafe|restaurant|fast_food|vending_machine|bicycle_rental|parking|courthouse|college|university)$/,
  leisure: /^(playground|park|sports_centre|pitch|fitness_station|fitness_centre|dog_park|swimming_pool|stadium|garden)$/,
  shop: /./, office: /^(government)$/, historic: /./, tourism: /^(museum|artwork|attraction|viewpoint|hotel|information)$/,
  highway: /^(bus_stop)$/, railway: /^(station|subway_entrance)$/, public_transport: /^(station)$/, healthcare: /./, craft: /./,
};
const want = (t) => t && Object.entries(KEEP).some(([k, re]) => t[k] && re.test(t[k]));
const out = [];
for (const n of nodes.values()) if (want(n.tags)) out.push({ id: 'n' + n.id, lat: n.lat, lon: n.lon, tags: n.tags });
for (const w of ways.values()) {
  if (!want(w.tags)) continue;
  const pts = w.nodes.map((id) => nodes.get(id)).filter(Boolean);
  if (!pts.length) continue;
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length, lon = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
  out.push({ id: 'w' + w.id, lat: +lat.toFixed(6), lon: +lon.toFixed(6), tags: w.tags, area: true });
}
const res = out.filter((p) => p.lat > 55.738 && p.lat < 55.782 && p.lon > 37.826 && p.lon < 37.894);
fs.writeFileSync('data/pois.json', JSON.stringify({ generated: new Date().toISOString(), source: 'OpenStreetMap contributors, ODbL', items: res }));
const c = {}; let oh = 0;
for (const p of res) {
  const t = p.tags;
  const k = t.amenity || t.leisure || (t.shop && 'shop:' + t.shop) || t.highway || t.historic || t.tourism || t.railway || t.office || t.healthcare || t.craft;
  c[k] = (c[k] || 0) + 1; if (t.opening_hours) oh++;
}
console.log(res.length, 'with hours', oh);
console.log(Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 45).map((x) => x.join(':')).join(' '));
