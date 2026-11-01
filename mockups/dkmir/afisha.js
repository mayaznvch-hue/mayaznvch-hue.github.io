// Афиша ДК «Мир». Данные — с главной dkreutov.ru и RSS-ленты сайта (ноябрь 2026).
// В оригинале у «Синего трактора» год 2026 — опечатка, в RSS 8 января 2027.
// «Берёзка» на главной без даты, дата 9 декабря взята из заголовка RSS.
var DK = 'https://www.dkreutov.ru';
var EVENTS = [
  {d:'2026-11-02', end:'2026-11-08', t:'Ярмарка «Поздняя осень»', img:'fair11_26.jpg', note:'пн–сб 11:00–18:45, вс 11:00–16:00, организатор «Интероптторг»'},
  {d:'2026-11-14', time:'12:00', t:'«Денискины рассказы»', img:'denstory26.jpg', buy:'https://biletof.com/action/?frame=1&ra=20350', more:'/index.php/1132-deniskiny-rasskazy-14-noyabrya-2026'},
  {d:'2026-11-18', time:'20:00', t:'Игорь Николаев', img:'Nikolaev2026.jpg', buy:'https://gorkassa.ru/events/igor-nikolaev-reutov-3778/', more:'/index.php/1118-nikolaev-18-noyabrya-2026', note:'«Лучшие и новые песни», 12+'},
  {d:'2026-11-20', time:'19:00', t:'«Мёртвые души»', img:'deadsouls26.jpg', buy:'https://vseconcerty.intickets.ru/seance/71039580/', more:'/index.php/1111-mertvye-dushi-20-noyabrya-2026'},
  {d:'2026-11-21', time:'12:00', t:'«Весёлая карусель»', img:'carousel26.jpg', buy:'https://mskcirk.intickets.ru/seance/74966975', more:'/index.php/1140-vesjolaya-karusel-21-noyabrya-2026'},
  {d:'2026-11-21', time:'18:00', t:'«Двенадцать месяцев»', img:'12month26.jpg', buy:'https://iframeab-pre3127.intickets.ru/seance/72919118/#abiframe', more:'/index.php/1129-12-mesyatsev-21-noyabrya-2026'},
  {d:'2026-11-23', time:'19:00', t:'«Маленькие комедии»', img:'littlecomedy26.jpg', more:'/index.php/1138-malenkie-komedii-23-noyabrya-2026'},
  {d:'2026-11-27', time:'19:00', t:'«Песняры»', img:'pesnyars26.jpg', buy:'https://vseconcerty.intickets.ru/seance/71843426/', more:'/index.php/1133-pesnyary-27-noyabrya-2026'},
  {d:'2026-11-28', time:'12:00', t:'«Маленькое снежное чучело»', img:'chuchelo26.jpg', buy:'https://qtickets.ru/event/264484', more:'/index.php/1145-malenkoe-snezhnoe-chuchelo-28-noyabrya-2026'},
  {d:'2026-11-30', end:'2026-12-06', t:'Ярмарка «Встречаем зиму»', img:'fair1126.jpg', note:'пн–сб 11:00–18:45, вс 11:00–16:00, организатор «Интероптторг»'},
  {d:'2026-12-07', time:'19:00', t:'«Анна Каренина»', img:'annakar26.jpg', buy:'https://simbilet.ru/plays/9441.anna-karenina-4', more:'/index.php/1139-anna-karenina-7-dekabrya-2026'},
  {d:'2026-12-09', time:'19:00', t:'«Берёзка»', img:'berezka.jpg', buy:'https://iframeab-pre2402.intickets.ru/seance/77035350', more:'/index.php/1147-berezka-9-dekabrya-2026'},
  {d:'2026-12-13', time:'12:00', t:'«Зайцы»', img:'reb26.jpg', buy:'https://biletof.com/action/?frame=1&ra=20025', more:'/index.php/1141-zajtsy-13-dekabrya-2026'},
  {d:'2026-12-13', time:'18:00', t:'«Щелкунчик»', img:'shelk26.jpg', buy:'https://vseconcerty.intickets.ru/seance/70922676/', more:'/index.php/1135-shchelkunchik-17-dekabrya-2026'},
  {d:'2026-12-19', time:'17:00', t:'«Новогодний переполох»', img:'NYStir26.jpg', buy:'https://iframeab-pre4796.intickets.ru/seance/76340907/#abiframe', more:'/index.php/1136-novogodnij-perepolokh-19-dekabrya-2026'},
  {d:'2027-01-02', time:'19:00', t:'Олег Митяев', img:'mityaev27.jpg', buy:'https://gorkassa.ru/events/oleg-mityaev-reutov-2247/', more:'/index.php/1151-oleg-mityaev-2-yanvarya-2027'},
  {d:'2027-01-03', time:'12:00', t:'Новогодняя ёлка «Баба Яга против»', img:'yaga26.jpg', buy:'https://mskcirk.intickets.ru/seance/76906503', more:'/index.php/1150-baba-yaga-protiv-03-yanvarya-2027'},
  {d:'2027-01-04', time:'19:00', t:'Александр Пушной', img:'pushnoy27.jpg', buy:'https://gorkassa.ru/events/aleksandr-pushnoy-reutov-2663/', more:'/index.php/1152-aleksandr-pushnoj-4-yanvarya-2027'},
  {d:'2027-01-05', time:'12:00', t:'«Снежная королева»', img:'snowqueen27.jpg', buy:'https://iframeab-pre10046.intickets.ru/seance/72423000/', more:'/index.php/1148-snezhnaya-koroleva-5-yanvarya-2027'},
  {d:'2027-01-05', time:'18:00', t:'«Раневская»', img:'ranevskaya.jpg', buy:'https://iframeab-pre10046.intickets.ru/seance/76702551/', more:'/index.php/1146-ranevskaya-5-yanvarya-2026'},
  {d:'2027-01-07', time:'19:00', t:'«Моя Мишель»', img:'my_mishel26.jpg', buy:'https://gorkassa.ru/events/moya-mishel-reutov-1333/', more:'/index.php/1117-moya-mishel-7-yanvarya-2027'},
  {d:'2027-01-08', time:'12:00', t:'«Синий трактор»', img:'blue_tract26.jpg', buy:'https://biletof.com/action/?frame=1&ra=20027', more:'/index.php/1144-sinij-traktor-8-yanvarya-2027'},
  {d:'2027-02-22', time:'15:00', t:'Представление световых кукол', img:'lightpup27.jpg', buy:'https://iframeab-pre10046.intickets.ru/seance/72423000/', more:'/index.php/1149-predstavlenie-svetovykh-kukol-22-fevralya-2027'},
  {d:'2027-03-25', time:'20:00', t:'Стас Пьеха', img:'Peha26.jpg', buy:'https://gorkassa.ru/events/stas-peha-reutov-1870/', more:'/index.php/1142-stas-pekha-25-marta-2026'}
];

var MON = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
var WD = ['вс','пн','вт','ср','чт','пт','сб'];

function parse(s){ var p = s.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

function dateBlock(e){
  var a = parse(e.d);
  if (e.end){
    var b = parse(e.end);
    var span = a.getMonth() === b.getMonth()
      ? a.getDate() + '–' + b.getDate()
      : a.getDate() + '.' + (a.getMonth()+1) + '–' + b.getDate() + '.' + (b.getMonth()+1);
    var mon = a.getMonth() === b.getMonth() ? MON[b.getMonth()] : MON[a.getMonth()] + ' — ' + MON[b.getMonth()];
    if (a.getMonth() !== b.getMonth()) span = a.getDate() + '–' + b.getDate();
    return {big: span, small: mon, wd: 'каждый день', range: true};
  }
  return {big: String(a.getDate()), small: MON[a.getMonth()], wd: WD[a.getDay()] + (e.time ? ', ' + e.time : '')};
}

function links(e){
  var h = '';
  if (e.buy) h += '<a class="btn btn--sm" href="' + esc(e.buy) + '" target="_blank" rel="noopener">Билеты</a>';
  else if (!e.end) h += '<a class="btn btn--sm btn--ghost" href="tel:+74955281757">Билеты в кассе</a>';
  if (e.more) h += '<a class="lnk" href="' + DK + esc(e.more) + '" target="_blank" rel="noopener">Подробнее</a>';
  return h;
}

function render(){
  // «сегодня» — по часам посетителя; для макета берём не раньше 1 ноября 2026
  var now = new Date(); var floor = new Date(2026, 10, 1);
  if (now < floor) now = floor;
  now.setHours(0,0,0,0);
  var future = EVENTS.filter(function(e){ return parse(e.end || e.d) >= now; });
  if (!future.length) future = EVENTS.slice(-3);

  var lead = document.getElementById('lead');
  var top = future.slice(0, 3);
  lead.innerHTML = top.map(function(e, i){
    var db = dateBlock(e);
    return '<article class="ticket' + (i === 0 ? ' ticket--main' : '') + '">' +
      '<div class="ticket__date"><span class="ticket__big' + (db.range ? ' ticket__big--range' : '') + '">' + db.big + '</span><span class="ticket__mon">' + db.small + '</span><span class="ticket__wd">' + db.wd + '</span></div>' +
      '<div class="ticket__body"><p class="ticket__kicker">' + (i === 0 ? 'Ближайшее' : 'Следом') + '</p><h2 class="ticket__title">' + esc(e.t) + '</h2>' +
      (e.note ? '<p class="ticket__note">' + esc(e.note) + '</p>' : '') +
      '<div class="ticket__links">' + links(e) + '</div></div>' +
      '<img class="ticket__img" src="img/' + e.img + '" alt="Афиша: ' + esc(e.t) + '"' + (i ? ' loading="lazy"' : '') + '>' +
      '</article>';
  }).join('');

  var shown = future.slice(3);
  var list = document.getElementById('events');
  list.innerHTML = shown.map(function(e){
    var a = parse(e.d), db = dateBlock(e);
    var m = a.getFullYear() === 2027 && a.getMonth() > 0 ? 'later' : String(a.getMonth());
    return '<li class="ev" data-m="' + m + '">' +
      '<div class="ev__date"><b>' + db.big + '</b> ' + db.small + '<span>' + db.wd + '</span></div>' +
      '<img class="ev__img" src="img/' + e.img + '" alt="" loading="lazy">' +
      '<h3 class="ev__title">' + esc(e.t) + '</h3>' +
      (e.note ? '<p class="ev__note">' + esc(e.note) + '</p>' : '') +
      '<div class="ev__links">' + links(e) + '</div></li>';
  }).join('');
}

function bindMonths(){
  var btns = document.querySelectorAll('.month');
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      btns.forEach(function(x){ x.classList.toggle('is-on', x === b); });
      var m = b.dataset.m;
      document.querySelectorAll('.ev').forEach(function(li){
        li.hidden = !(m === 'all' || li.dataset.m === m);
      });
    });
  });
}

function bindRider(){
  var tabs = document.querySelectorAll('.rider__tabs [role=tab]');
  tabs.forEach(function(t){
    t.addEventListener('click', function(){
      tabs.forEach(function(x){ x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      document.querySelectorAll('.rider__panel').forEach(function(p){ p.hidden = p.dataset.p !== t.dataset.t; });
    });
  });
}

function bindBurger(){
  var b = document.querySelector('.burger'), n = document.getElementById('nav');
  b.addEventListener('click', function(){
    var open = n.classList.toggle('is-open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  n.addEventListener('click', function(e){ if (e.target.tagName === 'A') { n.classList.remove('is-open'); b.setAttribute('aria-expanded','false'); } });
}

render(); bindMonths(); bindRider(); bindBurger();
