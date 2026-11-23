/* =========================================================
   «Обсудить сайт»: из ответов собирается заявка.
   «Отправить заявку» шлёт её Google-скрипту: он пишет строку в таблицу и письмо в Gmail
   (google-apps-script/Code.gs). Почта, Telegram и копирование текста — запасные пути.
   ========================================================= */
(function () {
  const form = document.getElementById('brief');
  if (!form) return;
  const C = window.PORTFOLIO || {};
  const out = document.getElementById('letter');
  const note = document.getElementById('note');
  const send = document.getElementById('send');
  const mail = document.getElementById('sendMail');
  const tg = document.getElementById('sendTg');
  const wa = document.getElementById('sendWa');
  const copy = document.getElementById('copy');
  const I = window.I18N || { lang: 'ru', t: (x) => x };
  const t = I.t;
  const first = t((C.name || '').split(' ')[0]);
  const v = (k) => (new FormData(form).get(k) || '').toString().trim();

  // Письмо пишется на языке страницы; в таблицу уходят русские значения как есть (см. отправку ниже)
  const LETTER = {
    ru: {
      hello: (n) => `Здравствуйте${n ? ', ' + n : ''}!`,
      who: (x) => `Меня зовут ${x}.`,
      kind: (x, bot) => `Мне нужен ${bot ? 'чат-бот в мессенджере' : 'сайт: ' + x}.`,
      like: (x) => `Из ваших работ ближе всего ${x}.`,
      about: (x) => `О деле: ${x}`,
      when: (x) => `По срокам: ${x}.`,
      reach: (x) => `Связаться со мной можно так: ${x}.`,
    },
    en: {
      hello: (n) => `Hello${n ? ', ' + n : ''}!`,
      who: (x) => `My name is ${x}.`,
      kind: (x) => `I need: ${x}.`,
      like: (x) => `The closest of your projects to what I want: ${x}.`,
      about: (x) => `About my business: ${x}`,
      when: (x) => `Timing: ${x}.`,
      reach: (x) => `You can reach me here: ${x}.`,
    },
    kk: {
      hello: (n) => `Сәлеметсіз бе${n ? ', ' + n : ''}!`,
      who: (x) => `Менің атым ${x}.`,
      kind: (x) => `Маған қажет: ${x}.`,
      like: (x) => `Жұмыстарыңыздың ішінде маған ең жақыны: ${x}.`,
      about: (x) => `Бизнесім туралы: ${x}`,
      when: (x) => `Мерзімі: ${x}.`,
      reach: (x) => `Менімен былай байланысуға болады: ${x}.`,
    },
  };

  function compose() {
    const L = LETTER[I.lang] || LETTER.ru;
    const lines = [L.hello(first)];
    if (v('who')) lines.push(L.who(v('who')));
    lines.push(v('kind') ? L.kind(t(v('kind')), v('kind') === 'чат-бот в мессенджере') : null);
    lines.push(v('like') ? L.like(t(v('like'))) : null);
    lines.push(v('about') ? L.about(v('about')) : null);
    lines.push(v('when') ? L.when(t(v('when'))) : null);
    lines.push(v('reach') ? L.reach(v('reach')) : null);
    const filled = lines.filter(Boolean);
    return { text: filled.join('\n'), empty: filled.length < 2 };
  }

  function render() {
    const { text, empty } = compose();
    out.textContent = text;
    if (empty) {
      const hint = document.createElement('mark');
      hint.textContent = '\n' + t('Отвечайте на вопросы — заявка будет дописываться сама.');
      out.appendChild(hint);
    }
    const body = encodeURIComponent(text);
    mail.href = `mailto:${C.email || ''}?subject=${encodeURIComponent(t('Нужен сайт'))}&body=${body}`;
    if (C.telegram) { tg.hidden = false; tg.href = `https://t.me/${C.telegram}?text=${body}`; }
    if (C.whatsapp) { wa.hidden = false; wa.href = `https://wa.me/${C.whatsapp}?text=${body}`; }
  }

  /* ---------- Проверка полей ---------- */
  const RULES = {
    who: [(s) => s.length >= 2, t('Напишите, как к вам обращаться.')],
    reach: [(s) => s.length >= 5, t('Оставьте телефон, Telegram или почту, чтобы я мог ответить.')],
  };
  function check(name) {
    const field = form.elements[name];
    const ok = RULES[name][0](field.value.trim());
    field.setAttribute('aria-invalid', String(!ok));
    document.getElementById(name + 'Err').textContent = ok ? '' : RULES[name][1];
    return ok;
  }
  Object.keys(RULES).forEach((name) => {
    form.elements[name].addEventListener('input', () => {
      if (form.elements[name].getAttribute('aria-invalid') === 'true') check(name);
    });
  });

  /* ---------- Отправка ---------- */
  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const bad = Object.keys(RULES).filter((name) => !check(name));
    if (bad.length) {
      form.elements[bad[0]].focus();
      note.classList.remove('is-ok');
      note.textContent = t('Заполните имя и контакт — без них я не смогу ответить.');
      return;
    }
    if (!C.leadsEndpoint) {
      note.textContent = t('Отправка заявок пока не подключена. Отправьте текст почтой или скопируйте его ниже.');
      return;
    }
    busy = true;
    send.setAttribute('aria-busy', 'true');
    send.textContent = t('Отправляю…');
    note.classList.remove('is-ok');
    note.textContent = '';
    try {
      const res = await fetch(C.leadsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // простой запрос: Google-скрипт не принимает предварительные CORS-запросы
        body: JSON.stringify({
          name: v('who'), contact: v('reach'), kind: v('kind'), like: v('like'),
          about: v('about'), when: v('when'), website: v('website'), page: location.href,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'server');
      note.classList.add('is-ok');
      note.textContent = t('Заявка отправлена. Я свяжусь с вами: {reach}.', { reach: v('reach') });
      send.textContent = t('Заявка отправлена');
      send.disabled = true;
    } catch (err) {
      note.textContent = t('Не получилось отправить заявку. Проверьте интернет и попробуйте ещё раз — или отправьте текст сами, ссылки ниже.');
      send.textContent = t('Отправить заявку');
      busy = false;
    } finally {
      send.removeAttribute('aria-busy');
    }
  });

  form.addEventListener('input', render);
  mail.addEventListener('click', () => { note.classList.remove('is-ok'); note.textContent = C.email ? t('Открывается ваша почта. Если ничего не произошло, скопируйте текст и отправьте на {email}.', { email: C.email }) : t('Открывается ваша почта. Если ничего не произошло, скопируйте текст и отправьте мне.'); });
  copy.addEventListener('click', async () => {
    note.classList.remove('is-ok');
    try {
      await navigator.clipboard.writeText(compose().text);
      note.textContent = C.email ? t('Текст скопирован. Вставьте его в письмо или сообщение на {email}.', { email: C.email }) : t('Текст скопирован. Вставьте его в письмо или сообщение.');
    } catch (err) {
      note.textContent = t('Не получилось скопировать. Выделите текст заявки и скопируйте вручную.');
    }
  });
  render();
})();
