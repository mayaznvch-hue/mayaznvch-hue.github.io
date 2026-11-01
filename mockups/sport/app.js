(function () {
  var YEAR = 2026;
  var DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var state = {year: null, kind: '', addr: ''};

  function ymap(k) {
    var a = ADDR[k];
    return 'https://yandex.ru/maps/?pt=' + a.lon + ',' + a.lat + '&z=17&l=map&text=' + encodeURIComponent('Реутов, ' + a.name);
  }
  document.querySelectorAll('.maplink').forEach(function (a) { a.href = ymap(a.dataset.k); a.target = '_blank'; a.rel = 'noopener'; });

  // возраст группы в годах (на 2026)
  function ages(gr) { return gr.a ? gr.a : [YEAR - gr.y[1], YEAR - gr.y[0]]; }
  function ageText(gr) {
    var r = ages(gr);
    return r[1] >= 99 ? 'от ' + r[0] + ' лет' : r[0] + '–' + r[1] + ' лет';
  }

  // годы рождения: 2021 (5 лет) ... 2008 и взрослые
  var fy = $('#f-year');
  var years = [''];
  for (var y = 2021; y >= 2008; y--) years.push(y);
  years.push('adult');
  fy.innerHTML = years.map(function (v) {
    var t = v === '' ? 'любой' : v === 'adult' ? 'взрослый' : v;
    return '<button data-v="' + v + '"' + (v === '' ? ' class="is-on"' : '') + '>' + t + '</button>';
  }).join('');

  function chips(el, key) {
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      el.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      state[key] = b.dataset.v;
      render();
    });
  }
  chips(fy, 'year'); chips($('#f-kind'), 'kind'); chips($('#f-addr'), 'addr');

  function match(sp) {
    if (state.kind && sp.kind !== state.kind) return null;
    if (state.addr && sp.addr !== state.addr) return null;
    if (!state.year) return {groups: sp.groups || null, sure: true};
    var age = state.year === 'adult' ? 18 : YEAR - (+state.year);
    if (sp.groups) {
      var g = sp.groups.filter(function (gr) {
        if (gr.y && state.year !== 'adult') return +state.year >= gr.y[0] && +state.year <= gr.y[1];
        var r = ages(gr); return age >= r[0] && age <= r[1];
      });
      return g.length ? {groups: g, sure: true} : null;
    }
    if (state.year === 'adult') return null;
    if (sp.from == null) return {groups: null, sure: false};
    return age >= sp.from ? {groups: null, sure: true} : null;
  }

  function sched(s) {
    return s.map(function (d) { return '<span><b>' + d[0] + '</b> ' + d[1] + '</span>'; }).join('');
  }

  function render() {
    var out = [];
    SPORTS.forEach(function (sp) {
      var m = match(sp); if (!m) return;
      var a = ADDR[sp.addr];
      var h = '<li class="res">';
      h += sp.img ? '<img class="res__img" src="' + sp.img + '" alt="" loading="lazy">' : '<div class="res__img res__img--none" aria-hidden="true">' + esc(sp.name.charAt(0)) + '</div>';
      h += '<div class="res__body"><h3>' + esc(sp.name) + '</h3>';
      h += '<p class="res__where"><a href="#a-' + sp.addr + '">' + esc(a.name) + '</a>' + (sp.fromNote ? ' · ' + esc(sp.fromNote) : '') + '</p>';
      if (m.groups) {
        h += '<ul class="grp">' + m.groups.map(function (gr) {
          return '<li><span class="grp__name">' + esc(gr.g) + (gr.y ? ' <i>(' + ageText(gr) + ')</i>' : '') + '</span><span class="grp__time">' + sched(gr.s) + '</span></li>';
        }).join('') + '</ul>';
      } else {
        h += '<p class="res__note">' + esc(sp.note || 'Расписание групп на сайте не опубликовано, его называют по телефону.') + '</p>';
      }
      if (!m.sure) h += '<p class="res__warn">Возьмут ли в этом возрасте, уточните по телефону.</p>';
      h += '<dl class="res__dl"><div><dt>Тренеры</dt><dd>' + esc(sp.coaches) + '</dd></div><div><dt>Платно</dt><dd>' + esc(sp.price) + '</dd></div></dl>';
      h += '<p class="res__act"><a class="btn" href="tel:' + SCHOOL.tel + '">Записаться по телефону</a>' + (sp.url ? '<a class="more" href="' + SCHOOL.site + sp.url + '">Страница отделения</a>' : '') + '</p>';
      h += '</div></li>';
      out.push(h);
    });
    $('#results').innerHTML = out.join('') || '<li class="empty">Под эти условия ничего не нашлось. Попробуйте другой адрес или позвоните: <a href="tel:' + SCHOOL.tel + '">' + SCHOOL.phone + '</a>.</li>';
    var n = out.length;
    $('#count').textContent = n ? 'Подходит: ' + n + ' ' + plural(n, 'секция', 'секции', 'секций') : '';
  }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; }
  render();

  // расписание: таблица по дням
  var withSched = SPORTS.filter(function (s) { return s.groups; });
  var tabs = $('#sched-tabs');
  tabs.innerHTML = withSched.map(function (s, i) {
    return '<button role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + esc(s.name) + '</button>';
  }).join('');
  function table(sp) {
    var h = '<div class="tbl-wrap"><table class="week"><thead><tr><th scope="col">Группа</th>' + DAYS.map(function (d) { return '<th scope="col">' + d + '</th>'; }).join('') + '</tr></thead><tbody>';
    sp.groups.forEach(function (gr) {
      h += '<tr><th scope="row">' + esc(gr.g) + '<small>' + esc(gr.t) + '</small></th>';
      DAYS.forEach(function (d) {
        var hit = gr.s.filter(function (x) { return x[0] === d; });
        h += hit.length ? '<td data-d="' + d + '">' + hit.map(function (x) { return x[1]; }).join('<br>') + '</td>' : '<td class="off" data-d="' + d + '"></td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    if (sp.extra) h += '<p class="week__extra">' + esc(sp.extra) + '</p>';
    h += '<p class="week__src">ул. Октября, 3А. Источник: <a href="' + SCHOOL.site + sp.url + '">страница отделения</a>.</p>';
    return h;
  }
  function showTab(i) {
    tabs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.i == i); });
    $('#sched-body').innerHTML = table(withSched[i]);
  }
  tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showTab(+b.dataset.i); });
  showTab(0);

  // схема адресов: проекция координат в квадрат 400×400
  (function () {
    var ks = ['pob', 'okt', 'str'];
    var lat0 = 55.7554, lon0 = 37.8536, kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110540;
    var mpp = 1800 / 340; // метров на единицу
    var g = '';
    ks.forEach(function (k, i) {
      var a = ADDR[k];
      var x = 200 + (a.lon - lon0) * kx / mpp, y = 200 - (a.lat - lat0) * ky / mpp;
      var right = x > 250;
      g += '<a href="#a-' + k + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="17" fill="' + (k === 'okt' ? '#d23a1d' : '#14182b') + '"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (y + 6).toFixed(1) + '" text-anchor="middle" font-size="17" font-weight="700" fill="#fff">' + (i + 1) + '</text>' +
        '<text x="' + (right ? x - 26 : x + 26).toFixed(1) + '" y="' + (y + 5).toFixed(1) + '" text-anchor="' + (right ? 'end' : 'start') + '" font-size="15" fill="#14182b">' + a.name + '</text></a>';
    });
    $('#plan-pts').innerHTML = g;
    $('#scale-line').setAttribute('x2', (500 / mpp).toFixed(1));
  })();

  // мобильное меню
  var mb = $('.menu-btn'), nav = $('#nav');
  mb.addEventListener('click', function () {
    var o = nav.classList.toggle('is-open'); mb.setAttribute('aria-expanded', o);
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('is-open'); mb.setAttribute('aria-expanded', false); } });
})();
