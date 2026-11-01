// МКДЦ: макет. Данные о студиях с mkdc-reutov.ru/department/, время из расписания 2025/26 (PDF, приказ № 141).
var BASE = 'https://mkdc-reutov.ru/department/';
var STUDIOS = [
  { n: 'Раннее развитие «Неваляшки»', s: 'rannee-detskoe-razvitie-nevalyashki', f: 'kids', age: 'до 3 лет', d: 'Развивающие занятия для детей до трёх лет.' },
  { n: 'Клуб раннего развития «Бэби-курс»', s: 'klub-rannego-detskogo-razvitiya-bebi-kurs', f: 'kids', age: 'малыши', d: 'Утренние группы по вторникам и четвергам.' },
  { n: 'Студия «Мини-школа»', s: 'mini-shkola', f: 'kids', age: 'дошкольники, 6 лет', d: 'Занимательная математика, игры с заданиями, подготовка к школе.' },
  { n: 'Говорю красиво', s: 'govoryu-krasivo', f: 'kids', age: 'дети', d: 'Постановка речи, пока ребёнок маленький и это проще всего.' },
  { n: 'Хореографическая студия «Колибри»', s: 'khoreograficheskaya-studiya-kolibri', f: 'dance', age: 'дети', d: 'Детский, классический, эстрадный и народный танец.' },
  { n: 'Школа классического танца «Балеринки»', s: 'shkola-klassicheskogo-tantsa-balerinki', f: 'dance', age: 'дети', d: 'Балетный станок, осанка, пластика.' },
  { n: 'Центр современного танца «Арбат»', s: 'tsentr-sovremennogo-tantsa-arbat', f: 'dance', age: '5–14 лет', d: 'Хип-хоп и уличные стили, группы по возрасту.' },
  { n: 'Акробатический рок-н-ролл «Style»', s: 'studiya-akrobaticheskogo-rok-n-rolla-style', f: 'dance', age: 'дети и подростки', d: 'Танец и спорт сразу. Хороший способ стать увереннее и найти друзей.' },
  { n: 'Зумба', s: 'zumba', f: 'dance adult', age: 'взрослые', d: 'Латиноамериканские ритмы вперемешку с аэробикой. Вечером.' },
  { n: 'Школа-театр «Art in Soul»', s: 'shkola-teatr-art-in-soul', f: 'voice', age: '5–25 лет', d: 'Актёрское мастерство, вокал и танец в одной школе. Есть молодёжная группа.' },
  { n: 'Театральная студия «Тимофята»', s: 'teatralnaya-studiya-timofyata', f: 'voice kids', age: '3–10 лет', d: 'Детский театр, играет на праздниках центра и города.' },
  { n: 'Ансамбль русской песни «Славяночка»', s: 'ansambl-slavyanochka', f: 'voice', age: 'от 3 лет и «Славянка» 20+', d: 'Народная песня. С 2019 года звание «Ведущий коллектив».' },
  { n: 'Хор ветеранов «Сударушка»', s: 'gorodskoy-khor-veteranov-sudarushka', f: 'voice adult', age: 'старшее поколение', d: 'Городской хор, поёт с октября 1993 года.' },
  { n: 'Студия рисования «Вдохновение»', s: 'studiya-risovaniya-vdokhnovenie', f: 'art', age: '4–16 лет', d: 'Техники рисунка и живописи, группы по возрасту.' },
  { n: 'Арт-мастерская «Магия творчества»', s: 'art-masterskaya-magiya-tvorchestva', f: 'art', age: '4–10 лет', d: 'Поделки, роспись, декоративно-прикладное творчество.' },
  { n: 'Радиотехническая секция «ТРИОД»', s: 'sektsiya-radiotekhnicheskogo-konstruirovaniya-triod', f: 'art', age: 'четыре группы', d: 'Радиотехника и электроника: как устроены приборы вокруг нас.' },
  { n: 'Школа языков «Talky Planet»', s: 'shkola-inostrannykh-yazykov-talky-planet', f: 'mind', age: 'дети и взрослые', d: 'Английский, китайский и русский язык.' },
  { n: 'Клуб скорочтения «Читаем быстро»', s: 'klub-skorochteniya-chitaem-bystro', f: 'mind kids', age: '6–9 лет', d: 'Мини-группы от 2 до 6 человек: чтение, память, внимание.' },
  { n: 'Шахматный клуб', s: 'shakhmatnyy-klub', f: 'mind', age: 'дети', d: 'Две группы, вечером по понедельникам, средам и пятницам.' },
  { n: 'Айкидо «Самурай»', s: 'aykido-samuray', f: 'sport', age: 'от 6 лет и старше', d: 'Учит двигаться и защищаться без грубой силы.' },
  { n: 'Клуб любителей бега', s: 'klub-lyubiteley-bega', f: 'sport adult', age: 'взрослые', d: 'Тренировки на выносливость в Центральном парке.' },
  { n: 'Скандинавская ходьба', s: 'skandinavskaya-khodba', f: 'sport adult', age: 'взрослые', d: 'С палками по паркам Реутова, на свежем воздухе.' },
  { n: 'Литературное объединение «Исповедь»', s: 'literaturnoe-obedinenie-ispoved', f: 'adult', age: 'взрослые', d: 'Встречи любителей русской словесности.' },
  { n: 'Волонтёрское объединение «Добрый город»', s: 'volonterskoe-obedinenie-dobryy-gorod', f: 'adult', age: 'молодёжь', d: 'Помощь тем, кому она нужна. Набор открыт.' }
];

// [студия, кабинет, Пн, Вт, Ср, Чт, Пт, Сб]; '' = нет занятий
var SCHED = [
  ['«Бэби-курс»', '65', '', '10:00–12:00', '', '10:00–12:00', '', ''],
  ['«Мини-школа»', '65', '16:30–19:30', '17:30–19:30', '16:30–19:30', '17:30–19:30', '', ''],
  ['Скорочтение «Читаем быстро»', '65', '', '16:30–17:30', '', '16:30–17:30', '', ''],
  ['Логопед', '21', '15:00–20:00', '15:00–20:00', '15:00–20:00', '15:00–20:00', '', '12:00–15:00'],
  ['Рисование «Вдохновение»', '18', '', '16:00–20:00', '16:00–20:00', '16:00–20:00', '', '12:00–16:00'],
  ['«ТРИОД»', '18', '14:30–19:30', '', '', '', '14:30–19:30', ''],
  ['«Магия творчества»', '23', '16:30–19:30', '', '', '', '16:30–19:30', ''],
  ['Talky Planet', '22, 24', '14:30–20:30', '14:30–20:30', '14:30–20:30', '14:30–20:30', '14:30–20:30', '10:00–14:30'],
  ['Айкидо «Самурай»', '60', '09:00–19:30', '16:00–21:30', '09:00–19:30', '16:00–21:30', '09:00–19:30', '10:15–15:30'],
  ['«Art in Soul»', '23, 9', 'с 15:00', 'с 15:00', 'с 15:00', 'с 15:00', 'с 15:00', '09:00–15:00'],
  ['Шахматный клуб', '61', '18:00–20:00', '', '18:00–20:00', '', '18:00–20:00', ''],
  ['«Тимофята»', '9', '16:00–20:00', '', '', '16:00–20:00', '', ''],
  ['«Славяночка»', 'арт. 5–6', 'по группам', 'по группам', 'по группам', 'по группам', 'по группам', 'по группам'],
  ['Хор «Сударушка»', '46', '11:00–14:00', '10:00–14:00', '11:00–14:00', '11:00–14:00', '', '11:00–13:00']
];

function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

// studios list
var list = document.getElementById('studios');
list.innerHTML = STUDIOS.map(function (x) {
  return '<li data-f="' + x.f + '"><a href="' + BASE + x.s + '/"><span class="studios__age">' + esc(x.age) + '</span><b>' + esc(x.n) + '</b><span class="studios__d">' + esc(x.d) + '</span></a></li>';
}).join('');

document.querySelectorAll('.chip').forEach(function (b) {
  b.addEventListener('click', function () {
    document.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-on', c === b); });
    var f = b.dataset.f;
    list.querySelectorAll('li').forEach(function (li) {
      li.hidden = !(f === 'all' || li.dataset.f.split(' ').indexOf(f) > -1);
    });
  });
});

// schedule
var tbody = document.querySelector('#sched tbody');
tbody.innerHTML = SCHED.map(function (r) {
  var cells = r.slice(2).map(function (t, i) {
    return '<td data-d="' + (i + 1) + '"' + (t ? '' : ' class="is-empty"') + '>' + (t ? esc(t) : '<span aria-label="нет занятий">—</span>') + '</td>';
  }).join('');
  return '<tr><th scope="row">' + esc(r[0]) + '</th><td class="room">' + esc(r[1]) + '</td>' + cells + '</tr>';
}).join('');

var table = document.getElementById('sched');
function showDay(d) {
  document.querySelectorAll('.days button').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.d === d); });
  table.classList.toggle('one-day', d > 0);
  table.querySelectorAll('[data-d]').forEach(function (td) { td.classList.toggle('is-day', +td.dataset.d === d); });
  table.querySelectorAll('thead th').forEach(function (th, i) { th.classList.toggle('is-day', i - 1 === d); });
  if (d > 0) {
    tbody.querySelectorAll('tr').forEach(function (tr) { tr.hidden = tr.querySelector('td[data-d="' + d + '"]').classList.contains('is-empty'); });
  } else {
    tbody.querySelectorAll('tr').forEach(function (tr) { tr.hidden = false; });
  }
}
document.querySelectorAll('.days button').forEach(function (b) { b.addEventListener('click', function () { showDay(+b.dataset.d); }); });
var today = new Date().getDay();
// на телефоне сразу открываем сегодняшний день, на десктопе всю неделю
var isPhone = window.matchMedia('(max-width: 760px)').matches;
showDay(isPhone ? (today === 0 ? 1 : today) : 0);
var todayBtn = document.querySelector('.days button[data-d="' + today + '"]');
if (today > 0 && todayBtn) todayBtn.insertAdjacentHTML('beforeend', '<small> сегодня</small>');

// form (заглушка)
var sel = document.getElementById('f-studio');
sel.innerHTML = '<option value="">Выберите студию</option>' + STUDIOS.map(function (x) { return '<option>' + esc(x.n) + '</option>'; }).join('');
document.getElementById('form').addEventListener('submit', function (e) {
  e.preventDefault();
  var msg = document.getElementById('form-msg');
  if (!this.checkValidity()) { msg.textContent = 'Заполните студию, имя, телефон и отметьте согласие.'; msg.className = 'form__msg is-err'; return; }
  msg.textContent = 'Это макет, заявка никуда не ушла. Позвоните, пожалуйста: +7 (498) 661-96-04.';
  msg.className = 'form__msg is-ok';
});

// mobile menu
var burger = document.querySelector('.burger'), nav = document.getElementById('nav');
burger.addEventListener('click', function () {
  var open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
  burger.textContent = open ? 'Закрыть' : 'Меню';
});
nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); burger.textContent = 'Меню'; } });
