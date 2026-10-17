/* =========================================================
   Демо Telegram-бота Halden прямо на странице.
   Повторяет настоящего бота (telegram-bot/bot.js в репозитории Halden) шаг в шаг:
   имя → телефон → экспедиция → даты → проверка → отправка.
   Всё происходит в браузере: заявка никуда не уходит, справа показано, как её увидел бы менеджер.
   ========================================================= */
(function () {
  const root = document.getElementById('tg');
  if (!root) return;
  const feed = root.querySelector('.tg__feed');
  const keys = root.querySelector('.tg__keys');
  const form = root.querySelector('.tg__input');
  const input = form.querySelector('input');
  const status = root.querySelector('.tg__status');
  const lead = document.getElementById('botLead');
  const leadMsg = document.getElementById('botLeadMsg');
  const leadRow = document.getElementById('botLeadRow');

  // Те же направления, что в боте и на сайте Halden
  const TRIPS = [
    ['glaciers', 'Ледники Исландии'],
    ['volcanoes', 'Вулканы Камчатки'],
    ['dunes', 'Дюны Намибии'],
    ['islands', 'Фарерские острова'],
    ['nordics', 'Скандинавия'],
    ['patagonia', 'Патагония'],
    ['himalaya', 'Гималаи'],
    ['oceania', 'Океания'],
    ['other', 'Пока не знаю — нужна консультация'],
  ];
  const TRIP_TITLE = Object.fromEntries(TRIPS);

  // Тест для тех, кто не может выбрать, — те же вопросы и баллы, что в боте (QUIZ в bot.js)
  const QUIZ = [
    { q: 'Какая природа зовёт сильнее?', a: [
      ['Лёд и ледники', { glaciers: 3, nordics: 2, patagonia: 2 }],
      ['Вулканы и гейзеры', { volcanoes: 3, oceania: 2, glaciers: 1 }],
      ['Пустыня и пески', { dunes: 3 }],
      ['Океан, скалы и острова', { islands: 3, oceania: 2, nordics: 1 }],
      ['Высокие горы', { himalaya: 3, patagonia: 2 }],
    ] },
    { q: 'Какая погода вам комфортнее?', a: [
      ['Холод и ветер не пугают', { glaciers: 2, nordics: 2, patagonia: 1, himalaya: 1, volcanoes: 1 }],
      ['Прохладно и свежо', { islands: 2, volcanoes: 1, patagonia: 1, oceania: 1 }],
      ['Жара и солнце', { dunes: 3, oceania: 1 }],
    ] },
    { q: 'Какой темп по душе?', a: [
      ['Спокойный: прогулки и виды', { islands: 2, nordics: 2, oceania: 1 }],
      ['Активный: несколько часов на тропе', { volcanoes: 2, patagonia: 2, glaciers: 1, oceania: 1 }],
      ['Серьёзные треки на высоте', { himalaya: 3, patagonia: 1, volcanoes: 1 }],
      ['Внедорожники и ночи под звёздами', { dunes: 3 }],
    ] },
    { q: 'Сколько дней готовы выделить?', a: [
      ['Около недели', { islands: 2, glaciers: 2, nordics: 1, dunes: 1 }],
      ['Дней десять', { volcanoes: 2, patagonia: 2, dunes: 1 }],
      ['Две недели и больше', { himalaya: 2, oceania: 2, patagonia: 1 }],
    ] },
  ];
  const TRIP_PITCH = {
    glaciers: 'Восемь дней среди древнего льда: голубые гроты, лагуна с айсбергами и ночёвки у края крупнейшего ледника Европы.',
    volcanoes: 'Десять дней: восхождение на Авачинский, кратер Мутновского, лавовые поля Толбачика и Долина гейзеров с вертолёта.',
    dunes: 'Девять дней в пустыне Намиб: рассвет на гребне Дюны 45, белая глина Дедфлея и ночи под самым тёмным небом планеты.',
    islands: 'Семь дней на восемнадцати островах Северной Атлантики: скалы в полкилометра, тупики и деревни, куда ведёт одна тропа.',
    nordics: 'Исландия, Норвегия, Фареры и Шпицберген — север, где летом не заходит солнце, а зимой небо горит сиянием.',
    patagonia: 'Чили и Аргентина на краю континента: башни Торрес-дель-Пайне, пик Фицрой и ледник Перито-Морено.',
    himalaya: 'Непал, Индия и Бутан: тропы шерпов к Эвересту, кольцо Аннапурны и монастыри Ладакха над облаками.',
    oceania: 'Новая Зеландия, Тасмания и Фиджи: фьорды, действующие вулканы и острова, куда добираются под парусом.',
  };
  const DEMO_PHONE = '+7 701 234 56 78';

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let session = null; // { step, name, phone, trip, dates }

  /* ---------- Сообщения и кнопки ---------- */
  const scrollDown = () => feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });

  // Сообщение бота; inline — ряды кнопок [[текст, данные]] под ним
  function bot(html, inline) {
    const msg = document.createElement('div');
    msg.className = 'tg-b tg-b--bot';
    fill(msg, html, inline);
    feed.appendChild(msg);
    scrollDown();
    return msg;
  }
  function fill(msg, html, inline) {
    msg.innerHTML = '';
    const text = document.createElement('div');
    text.className = 'tg-b__text';
    text.innerHTML = html; // всё, что ввёл посетитель, экранировано через esc()
    msg.appendChild(text);
    if (!inline) return;
    const kb = document.createElement('div');
    kb.className = 'tg-ik';
    inline.forEach((row) => {
      const r = document.createElement('div');
      row.forEach(([label, data]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', () => later(() => onCallback(data, msg)));
        r.appendChild(b);
      });
      kb.appendChild(r);
    });
    msg.appendChild(kb);
  }
  function me(text) {
    const msg = document.createElement('div');
    msg.className = 'tg-b tg-b--me';
    msg.textContent = text;
    feed.appendChild(msg);
    scrollDown();
  }
  // Нижние кнопки, как клавиатура над полем ввода в Telegram
  function setKeys(list) {
    keys.innerHTML = '';
    list.forEach(([label, action]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', action);
      keys.appendChild(b);
    });
  }
  // «Печатает…» и небольшая пауза, чтобы ответ не появлялся мгновенно
  function later(fn) {
    status.textContent = 'печатает…';
    setTimeout(() => { status.textContent = 'бот'; fn(); }, 420);
  }
  function say(text) {
    me(text);
    later(() => onMessage(text));
  }
  const startKey = () => setKeys([['/start', () => say('/start')]]);

  /* ---------- Логика бота ---------- */
  function tripKeyboard() {
    const rows = [];
    const regular = TRIPS.filter(([slug]) => slug !== 'other');
    for (let i = 0; i < regular.length; i += 2) rows.push(regular.slice(i, i + 2).map(([slug, title]) => [title, 'trip:' + slug]));
    rows.push([[TRIP_TITLE.other, 'trip:other']]);
    return rows;
  }
  function summary(s) {
    return [
      `<b>Имя:</b> ${esc(s.name)}`,
      `<b>Телефон:</b> ${esc(s.phone)}`,
      `<b>Экспедиция:</b> ${esc(s.trip)}`,
      `<b>Даты:</b> ${esc(s.dates)}`,
      s.quizAnswers ? `<b>Ответы теста:</b> ${esc(s.quizAnswers.join(', '))}` : null,
    ].filter(Boolean).join('\n');
  }
  function quizQuestion(i) {
    const { q, a } = QUIZ[i];
    return [`🧭 <b>Вопрос ${i + 1} из ${QUIZ.length}</b>\n\n${q}`, a.map(([label], k) => [[label, `quiz:a:${i}:${k}`]])];
  }
  function quizResult(scores) {
    const [first, second] = TRIPS.filter(([slug]) => slug !== 'other')
      .map(([slug], order) => ({ slug, score: scores[slug] || 0, order }))
      .sort((x, y) => y.score - x.score || x.order - y.order);
    return [
      `🧭 <b>Вам больше всего подойдёт: ${esc(TRIP_TITLE[first.slug])}</b>\n\n${esc(TRIP_PITCH[first.slug])}\n\nЗапасной вариант — ${esc(TRIP_TITLE[second.slug])}.`,
      [
        [[`✅ Выбираю: ${TRIP_TITLE[first.slug]}`, 'trip:' + first.slug]],
        [[`Лучше второй: ${TRIP_TITLE[second.slug]}`, 'trip:' + second.slug]],
        [['🔄 Пройти тест заново', 'quiz:go']],
        [['Пусть подскажет менеджер', 'quiz:skip']],
      ],
    ];
  }
  function askName(greeting) {
    session = { step: 'name' };
    setKeys([]);
    bot((greeting ? greeting + '\n\n' : '') + 'Как вас зовут?');
    input.focus({ preventScroll: true });
  }
  function askTrip() {
    bot('Какая экспедиция вам интересна?', tripKeyboard());
  }
  function gotPhone(phone) {
    session.phone = phone;
    session.step = 'trip';
    setKeys([]);
    bot('Номер записал ✓');
    askTrip();
  }

  function onMessage(raw) {
    const text = raw.trim();
    if (text === '/start') return askName('Здравствуйте! Я бот <b>Halden</b>. Помогу оставить заявку на экспедицию — это займёт минуту.');
    if (text === '/cancel') {
      session = null;
      startKey();
      return bot('Заявка отменена. Чтобы начать заново, отправьте /start.');
    }
    const s = session;
    if (!s) { startKey(); return bot('Чтобы оставить заявку на экспедицию, отправьте /start.'); }

    switch (s.step) {
      case 'name':
        if (text.length < 2 || text.startsWith('/') || text.length > 100) return bot('Напишите, пожалуйста, ваше имя.');
        s.name = text;
        s.step = 'phone';
        bot(`Приятно познакомиться, ${esc(s.name)}! Оставьте номер телефона: нажмите кнопку ниже или напишите его сообщением.`);
        // В Telegram эта кнопка отправляет номер из профиля; в демо — пример номера
        return setKeys([['📱 Отправить мой номер', () => { me(`📱 ${DEMO_PHONE}`); later(() => gotPhone(DEMO_PHONE)); }]]);
      case 'phone': {
        const digits = text.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) return bot('Похоже, в номере ошибка. Напишите его полностью, например: +7 701 234 56 78');
        return gotPhone(text);
      }
      case 'trip':
        return askTrip();
      case 'dates':
        if (!text || text.startsWith('/') || text.length > 200) return bot('Напишите, когда хотите поехать, например: «март 2027» или «10–20 июля».');
        s.dates = text;
        s.step = 'confirm';
        return bot(`Проверьте заявку:\n\n${summary(s)}`, [[['✅ Отправить заявку', 'send']], [['✏️ Заполнить заново', 'restart']]]);
      case 'confirm':
        return bot('Нажмите «Отправить заявку» под сообщением выше или «Заполнить заново».');
    }
  }

  function onCallback(data, msg) {
    const s = session;
    if (data === 'restart') {
      msg.querySelector('.tg-ik')?.remove();
      return askName('Хорошо, начнём заново.');
    }
    // «Пока не знаю»: вместо того чтобы сразу записать консультацию, предлагаем тест
    if (data === 'trip:other' && s && s.step === 'trip') {
      return fill(msg, 'Помогу выбрать: ответьте на четыре коротких вопроса, и я подскажу, какая экспедиция вам ближе.',
        [[['🧭 Пройти тест', 'quiz:go']], [['Пусть подскажет менеджер', 'quiz:skip']]]);
    }
    if (data === 'quiz:go' && s && s.step === 'trip') {
      s.quiz = { i: 0, scores: {}, answers: [] };
      return fill(msg, ...quizQuestion(0));
    }
    const answer = data.match(/^quiz:a:(\d+):(\d+)$/);
    if (answer && s && s.step === 'trip' && s.quiz && Number(answer[1]) === s.quiz.i && QUIZ[s.quiz.i].a[Number(answer[2])]) {
      const [label, points] = QUIZ[s.quiz.i].a[Number(answer[2])];
      for (const [slug, n] of Object.entries(points)) s.quiz.scores[slug] = (s.quiz.scores[slug] || 0) + n;
      s.quiz.answers.push(label.toLowerCase());
      s.quiz.i += 1;
      if (s.quiz.i < QUIZ.length) return fill(msg, ...quizQuestion(s.quiz.i));
      s.quizAnswers = s.quiz.answers; // попадут в заявку менеджеру
      return fill(msg, ...quizResult(s.quiz.scores));
    }
    if (data === 'quiz:skip' && s && s.step === 'trip') {
      data = 'trip:other';
      s.quizAnswers = null;
    }

    if (data.startsWith('trip:') && s && s.step === 'trip' && TRIP_TITLE[data.slice(5)]) {
      s.trip = TRIP_TITLE[data.slice(5)];
      s.step = 'dates';
      fill(msg, `Экспедиция: <b>${esc(s.trip)}</b>`);
      bot('Когда хотите поехать? Напишите месяц или даты, например: «март 2027» или «10–20 июля».');
      return input.focus({ preventScroll: true });
    }
    if (data === 'send' && s && s.step === 'confirm') {
      session = null;
      msg.querySelector('.tg-ik')?.remove();
      bot('Спасибо! Заявка отправлена — мы свяжемся с вами в ближайшее время.\n\nЕсли захотите оставить ещё одну, отправьте /start.');
      startKey();
      return showLead(s);
    }
    toast('Эта кнопка уже неактуальна. Отправьте /start, чтобы начать заново.');
  }

  // Всплывающая подсказка, как ответ на нажатие старой кнопки в Telegram
  function toast(text) {
    const t = document.createElement('div');
    t.className = 'tg__toast';
    t.textContent = text;
    root.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  /* ---------- Что видит менеджер ---------- */
  function showLead(s) {
    if (!lead) return;
    leadMsg.innerHTML = `🧭 <b>Новая заявка из Телеграма</b>\n\n${summary(s)}\n<b>Телеграм:</b> вы\n\n📋 Записана в таблицу`;
    const when = new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    leadRow.innerHTML = '';
    const wishes = 'Телеграм: вы' + (s.quizAnswers ? '. Ответы теста: ' + s.quizAnswers.join(', ') : '');
    [when, s.name, s.phone, s.trip, s.dates, wishes, 'Телеграм-бот'].forEach((v) => {
      const td = document.createElement('td');
      td.textContent = v;
      leadRow.appendChild(td);
    });
    lead.hidden = false;
    lead.classList.remove('is-new');
    void lead.offsetWidth; // перезапуск подсветки при повторной заявке
    lead.classList.add('is-new');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    say(text);
  });

  // Перед первым сообщением Telegram показывает описание бота и кнопку «Запустить»
  bot('<b>Что умеет этот бот?</b>\nHalden — экспедиции к ледникам, вулканам, дюнам и островам. Оставьте заявку за минуту, и мы свяжемся с вами.');
  setKeys([['Запустить', () => say('/start')]]);
})();
