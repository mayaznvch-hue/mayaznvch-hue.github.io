// Общий модуль «список + карта» для приложений на точках OSM.
import { $, esc, pois, locate, makeMap, dot, meIcon, dist, distText, hoursState, hoursHuman, addrOf, walk, minsText, CENTER } from './common.js';

/**
 * cfg = {
 *   match(tags) -> bool | string (строка = ключ группы),
 *   groups: { key: { label, color } },
 *   title(tags) -> string, sub(tags) -> html, hours: bool,
 *   empty: 'текст, если ничего не нашлось', limit: 60
 * }
 */
export async function poiApp(cfg) {
  const listEl = $('#list'), mapEl = $('#map'), noteEl = $('#note');
  const map = makeMap(mapEl, { zoom: 14 });
  const layer = L.layerGroup().addTo(map);
  let routeLine = null;

  const all = (await pois())
    .map((p) => ({ ...p, g: cfg.match(p.tags) }))
    .filter((p) => p.g);
  for (const p of all) if (p.g === true) p.g = Object.keys(cfg.groups)[0];

  let me = { pos: CENTER, real: false };
  const state = { groups: new Set(Object.keys(cfg.groups)), openOnly: false, q: '' };

  // фильтры
  const bar = $('#filters');
  if (Object.keys(cfg.groups).length > 1) {
    for (const [k, g] of Object.entries(cfg.groups)) {
      const n = all.filter((p) => p.g === k).length;
      if (!n) continue;
      const l = document.createElement('label');
      l.className = 'chk';
      l.innerHTML = `<input type="checkbox" checked value="${k}"><span class="pin" style="background:${g.color};width:10px;height:10px;border-width:1px"></span>${esc(g.label)} <span class="muted">${n}</span>`;
      l.querySelector('input').onchange = (e) => { e.target.checked ? state.groups.add(k) : state.groups.delete(k); render(); };
      bar.append(l);
    }
  }
  if (cfg.hours) {
    const l = document.createElement('label');
    l.className = 'chk';
    l.innerHTML = '<input type="checkbox"> только открытые сейчас';
    l.querySelector('input').onchange = (e) => { state.openOnly = e.target.checked; render(); };
    bar.append(l);
  }
  if (cfg.search) {
    const i = document.createElement('input');
    i.type = 'search'; i.placeholder = cfg.search; i.style.minWidth = '200px';
    i.oninput = () => { state.q = i.value.trim().toLowerCase(); render(); };
    bar.append(i);
  }
  const locBtn = document.createElement('button');
  locBtn.className = 'btn'; locBtn.textContent = 'Я здесь: определить место';
  locBtn.onclick = async () => {
    locBtn.disabled = true; locBtn.textContent = 'Определяю…';
    me = await locate();
    locBtn.disabled = false;
    locBtn.textContent = me.real ? 'Обновить место' : 'Попробовать ещё раз';
    noteEl.innerHTML = me.real ? '' : `<div class="status">${me.far ? 'Похоже, вы не в Реутове.' : 'Браузер не дал координаты.'} Считаю расстояния от улицы Победы.</div>`;
    render(true);
  };
  bar.append(locBtn);

  let meMarker = null;
  function render(fit) {
    layer.clearLayers();
    if (routeLine) { routeLine.remove(); routeLine = null; }
    if (meMarker) meMarker.remove();
    meMarker = L.marker(me.pos, { icon: meIcon(), interactive: false }).addTo(map);

    let rows = all.filter((p) => state.groups.has(p.g));
    if (state.q) rows = rows.filter((p) => JSON.stringify(Object.values(p.tags)).toLowerCase().includes(state.q));
    rows = rows.map((p) => ({ ...p, d: dist(me.pos, [p.lat, p.lon]), h: cfg.hours ? hoursState(p.tags.opening_hours) : null }));
    if (state.openOnly) rows = rows.filter((p) => p.h.state === 'open');
    rows.sort((a, b) => a.d - b.d);

    const shown = rows.slice(0, cfg.limit || 60);
    listEl.innerHTML = '';
    if (!shown.length) listEl.innerHTML = `<div class="skeleton">${cfg.empty || 'Ничего не нашлось.'}</div>`;
    $('#count').textContent = rows.length ? `${rows.length} ${cfg.unit ? cfg.unit(rows.length) : ''}${rows.length > shown.length ? `, показаны ближайшие ${shown.length}` : ''}` : '';

    for (const p of rows) {
      const g = cfg.groups[p.g];
      const m = L.marker([p.lat, p.lon], { icon: dot(g.color, p.h && p.h.state === 'closed' ? 10 : 13), opacity: p.h && p.h.state === 'closed' ? 0.55 : 1 })
        .bindPopup(`<b>${esc(cfg.title(p.tags))}</b>${cfg.sub(p.tags)}${p.h ? `<div>${tagFor(p.h)}</div>` : ''}`);
      m.addTo(layer);
      p.marker = m;
    }
    for (const p of shown) {
      const div = document.createElement('div');
      div.style.cursor = 'pointer';
      if (p.h && p.h.state === 'closed') div.style.opacity = '.6';
      const addr = addrOf(p.tags);
      div.innerHTML = `<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">
          <b style="font-weight:600">${esc(cfg.title(p.tags))}</b><span class="muted small" style="white-space:nowrap">${distText(p.d)}</span></div>
        <div class="small">${addr ? esc(addr) + ' · ' : ''}${cfg.sub(p.tags)}</div>
        ${p.h ? `<div class="small" style="margin-top:3px">${tagFor(p.h)} ${p.tags.opening_hours ? `<span class="muted">${hoursHuman(p.tags.opening_hours)}</span>` : ''}</div>` : ''}`;
      div.onclick = async () => {
        map.setView([p.lat, p.lon], 17);
        p.marker.openPopup();
        if (cfg.walk !== false) {
          try {
            const w = await walk(me.pos, [p.lat, p.lon]);
            if (routeLine) routeLine.remove();
            routeLine = L.polyline(w.line, { color: '#c8461f', weight: 4, opacity: 0.85 }).addTo(map);
            map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
            p.marker.setPopupContent(p.marker.getPopup().getContent().split('<div class="walk">')[0] + `<div class="walk small muted">пешком ${distText(w.meters)}, примерно ${minsText(w.minutes)}</div>`).openPopup();
          } catch { /* маршрутизатор не ответил, просто показываем точку */ }
        }
      };
      listEl.append(div);
    }
    if (fit && rows.length) map.setView(me.pos, 15);
  }
  function tagFor(h) {
    if (h.state === 'open') return `<span class="tag ok">открыто</span> ${h.text}`;
    if (h.state === 'closed') return `<span class="tag bad">закрыто</span> ${h.text}`;
    return `<span class="tag mute">${h.text}</span>`;
  }
  render();
  if (cfg.hours) setInterval(render, 60000);
}
