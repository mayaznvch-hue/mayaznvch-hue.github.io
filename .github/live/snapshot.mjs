// Снимок /api/trains и /api/news для статической версии сайта.
// Запуск: node tools/snapshot.mjs <папка>  (server.mjs должен работать на :8080)
import fs from 'node:fs';
const out = process.argv[2] || 'data/api';
fs.mkdirSync(out, { recursive: true });
const jobs = { 'trains-to-moscow': '/api/trains?dir=to-moscow', 'trains-from-moscow': '/api/trains?dir=from-moscow', 'trains-east': '/api/trains?dir=east', news: '/api/news' };
let ok = 0;
for (const [name, path] of Object.entries(jobs)) {
  try {
    const r = await fetch('http://127.0.0.1:8080' + path, { signal: AbortSignal.timeout(60000) });
    const j = await r.json();
    if (!r.ok || j.error || !(j.items?.length)) throw new Error(j.error || 'пусто');
    const f = `${out}/${name}.json`;
    let old = null; try { old = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
    if (!old || JSON.stringify(old.items) !== JSON.stringify(j.items)) fs.writeFileSync(f, JSON.stringify(j));
    ok++; console.log('ok', name, j.items.length);
  } catch (e) { console.log('fail', name, e.message); }
}
process.exit(ok ? 0 : 1);
