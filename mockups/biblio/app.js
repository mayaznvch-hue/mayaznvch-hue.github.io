// Библиотеки Реутова: макет. Адреса, телефоны и часы отдела обслуживания взяты со страницы biblreut.ru/index/biblioteki/0-5.
// hours: индекс = день недели (0 = вс). null = выходной. Время по Москве.
var BRANCHES = [
  {
    name: 'Центральная городская библиотека', short: 'Центральная городская',
    addr: 'ул. Ленина, д. 2', zip: '143964', tel: '8 (495) 528-64-11', telHref: '+74955286411',
    vk: 'https://vk.com/public217667525', page: 'http://biblreut.ru/index/bibl1/0-11',
    hours: [[11, 18], [11, 18], [11, 19], [11, 19], [11, 19], [11, 19], [11, 18]],
    clubs: 'кружки и студии каждый день 9:00–21:00',
    head: 'Ахрамеева Галина Анатольевна'
  },
  {
    name: 'Центральная детская библиотека', short: 'Центральная детская',
    addr: 'ул. Ленина, д. 2', zip: '143964', tel: '8 (495) 528-56-19', telHref: '+74955285619',
    vk: 'https://vk.com/public212331818', page: 'http://biblreut.ru/index/bibl2/0-12',
    hours: [null, null, [11, 19], [11, 19], [11, 19], [11, 19], [11, 18]],
    clubs: 'кружки и студии каждый день 9:00–21:00',
    head: 'Евдокименко Татьяна Владимировна'
  },
  {
    name: 'Библиотека на Юбилейном', short: 'На Юбилейном',
    addr: 'Юбилейный пр-т, д. 38', zip: '143969', tel: '8 (495) 791-12-19', telHref: '+74957911219',
    vk: 'https://vk.com/club146985547',
    hours: [null, null, [11, 19], [11, 19], [11, 19], [11, 19], [10, 17]],
    clubs: 'кружки и студии каждый день 9:00–21:00',
    head: 'Зайнутдинова Ксения Насимовна'
  },
  {
    name: 'Библиотека на Некрасова', short: 'На Некрасова',
    addr: 'ул. Н. А. Некрасова, д. 18', zip: '143968', tel: '8 (495) 528-76-01', telHref: '+74955287601',
    vk: 'https://vk.com/reutbib_nekrasova',
    hours: [null, [11, 19], [11, 19], [11, 19], [11, 19], [11, 19], null],
    clubs: 'кружки: пн–пт 9:00–21:00, сб–вс 12:00–15:00',
    head: 'Рязанцева Светлана Ивановна'
  },
  {
    name: 'Библиотека на Молодежной', short: 'На Молодежной',
    addr: 'ул. Молодежная, д. 4', zip: '143965', tel: '8 (495) 791-36-80', telHref: '+74957913680',
    vk: 'https://vk.com/public217671084',
    hours: [null, [11, 19], [11, 19], [11, 19], [11, 19], [11, 19], null],
    clubs: 'кружки: пн–пт 15:00–21:00, сб 12:00–15:00',
    head: 'Чеглакова Анна Сергеевна'
  }
];
var DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
var DAYS_FULL = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];

function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function hh(h) { return (h < 10 ? '0' : '') + h + ':00'; }

// текущее время в Москве, независимо от часового пояса компьютера
function moscowNow() {
  var d = new Date();
  var utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 3600000);
}

// санитарный день: последний день месяца, когда библиотека работает
function isSanitary(b, d) {
  var y = d.getFullYear(), m = d.getMonth();
  var last = new Date(y, m + 1, 0);
  while (!b.hours[last.getDay()]) last.setDate(last.getDate() - 1);
  return last.getDate() === d.getDate();
}

function status(b, now) {
  var h = b.hours[now.getDay()];
  var t = now.getHours() + now.getMinutes() / 60;
  if (h && isSanitary(b, now)) return { open: false, text: 'Сегодня санитарный день' };
  if (h && t >= h[0] && t < h[1]) {
    var left = h[1] - t;
    return { open: true, text: 'Открыто до ' + hh(h[1]) + (left <= 1 ? ', скоро закрываемся' : '') };
  }
  if (h && t < h[0]) return { open: false, text: 'Закрыто, откроемся в ' + hh(h[0]) };
  // ищем следующий рабочий день
  for (var i = 1; i <= 7; i++) {
    var nd = new Date(now); nd.setDate(now.getDate() + i);
    var nh = b.hours[nd.getDay()];
    if (nh && !isSanitary(b, nd)) {
      return { open: false, text: 'Закрыто, откроемся ' + (i === 1 ? 'завтра' : (nd.getDay() === 2 ? 'во ' : 'в ') + DAYS_FULL[nd.getDay()]) + ' в ' + hh(nh[0]) };
    }
  }
  return { open: false, text: 'Закрыто' };
}

// строка часов: склеиваем одинаковые дни подряд (пн-пт и т.п.)
function hoursRows(b) {
  var order = [1, 2, 3, 4, 5, 6, 0], rows = [];
  order.forEach(function (d) {
    var h = b.hours[d], key = h ? h.join('-') : 'off', last = rows[rows.length - 1];
    if (last && last.key === key) last.to = d; else rows.push({ key: key, from: d, to: d, h: h });
  });
  return rows.map(function (r) {
    var days = r.from === r.to ? DAYS[r.from] : DAYS[r.from] + '–' + DAYS[r.to];
    return '<tr><th scope="row">' + days + '</th><td>' + (r.h ? hh(r.h[0]) + '–' + hh(r.h[1]) : 'выходной') + '</td></tr>';
  }).join('');
}

function render() {
  var now = moscowNow();
  var today = now.getDay();
  var NOM = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  document.getElementById('now-time').textContent = NOM[today] + ', ' + (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

  document.getElementById('now-list').innerHTML = BRANCHES.map(function (b) {
    var s = status(b, now);
    return '<li class="' + (s.open ? 'is-open' : 'is-closed') + '"><span class="dot" aria-hidden="true"></span><span><b>' + esc(b.short) + '</b><br><small>' + esc(b.addr) + '</small></span><span class="st">' + esc(s.text) + '</span></li>';
  }).join('');

  document.getElementById('branches').innerHTML = BRANCHES.map(function (b) {
    var s = status(b, now);
    return '<article class="br">' +
      '<h3>' + (b.page ? '<a href="' + b.page + '">' + esc(b.name) + '</a>' : esc(b.name)) + '</h3>' +
      '<p class="br__st ' + (s.open ? 'is-open' : 'is-closed') + '"><span class="dot" aria-hidden="true"></span>' + esc(s.text) + '</p>' +
      '<p class="br__addr">' + esc(b.addr) + '<br><a href="tel:' + b.telHref + '" class="br__tel">' + esc(b.tel) + '</a></p>' +
      '<table class="br__hours"><caption>Выдача книг</caption>' + hoursRows(b) + '</table>' +
      '<p class="br__clubs">' + esc(b.clubs) + '</p>' +
      '<p class="br__links"><a href="https://yandex.ru/maps/?text=' + encodeURIComponent('Реутов, ' + b.addr) + '">На карте</a> · <a href="' + b.vk + '">ВКонтакте</a></p>' +
      '<p class="br__head">Заведующая: ' + esc(b.head) + '</p>' +
      '</article>';
  }).join('');
  // шестая ячейка сетки — фото входа, чтобы не было дыры
  var tpl = document.getElementById('cgb-tpl');
  if (tpl) document.getElementById('branches').appendChild(tpl.content.cloneNode(true));
  // подсветка сегодняшнего дня в таблицах (если он внутри диапазона)
  document.querySelectorAll('.br__hours th').forEach(function (th) {
    var t = th.textContent, parts = t.split('–'), order = [1, 2, 3, 4, 5, 6, 0];
    var a = order.indexOf(DAYS.indexOf(parts[0])), z = order.indexOf(DAYS.indexOf(parts[1] || parts[0])), x = order.indexOf(today);
    if (x >= a && x <= z) th.parentNode.classList.add('is-today');
  });
}
render();
setInterval(render, 60000);

// примеры запросов
document.querySelectorAll('.ex').forEach(function (b) {
  b.addEventListener('click', function () { var q = document.getElementById('q'); q.value = b.textContent; q.focus(); });
});

// версия для слабовидящих
var root = document.documentElement;
function saveA11y() { localStorage.setItem('cbs-a11y', JSON.stringify({ size: root.dataset.size || '', contrast: root.dataset.contrast || '' })); }
function syncA11y() {
  document.querySelectorAll('[data-size]').forEach(function (b) { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', (root.dataset.size || '') === b.dataset.size); });
  document.querySelectorAll('[data-contrast]').forEach(function (b) { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', (root.dataset.contrast || '') === b.dataset.contrast); });
}
document.querySelectorAll('.a11y button').forEach(function (b) {
  b.addEventListener('click', function () {
    if ('size' in b.dataset) { if (b.dataset.size) root.dataset.size = b.dataset.size; else delete root.dataset.size; }
    if ('contrast' in b.dataset) { if (b.dataset.contrast) root.dataset.contrast = b.dataset.contrast; else delete root.dataset.contrast; }
    syncA11y(); saveA11y();
  });
});
syncA11y();

// акции с прошедшей датой помечаем, чтобы не вводить в заблуждение
document.querySelectorAll('[data-end]').forEach(function (el) {
  if (moscowNow() > new Date(el.dataset.end + 'T23:59:59+03:00')) el.textContent += ' · акция завершена';
});
