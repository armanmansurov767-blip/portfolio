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
  const first = (C.name || '').split(' ')[0];
  const v = (k) => (new FormData(form).get(k) || '').toString().trim();

  function compose() {
    const lines = [`Здравствуйте${first ? ', ' + first : ''}!`];
    if (v('who')) lines.push(`Меня зовут ${v('who')}.`);
    lines.push(v('kind') ? `Мне нужен ${v('kind') === 'чат-бот в мессенджере' ? 'чат-бот в мессенджере' : 'сайт: ' + v('kind')}.` : null);
    lines.push(v('like') ? `Из ваших работ ближе всего ${v('like')}.` : null);
    lines.push(v('about') ? `О деле: ${v('about')}` : null);
    lines.push(v('when') ? `По срокам: ${v('when')}.` : null);
    lines.push(v('reach') ? `Связаться со мной можно так: ${v('reach')}.` : null);
    const filled = lines.filter(Boolean);
    return { text: filled.join('\n'), empty: filled.length < 2 };
  }

  function render() {
    const { text, empty } = compose();
    out.textContent = text;
    if (empty) {
      const hint = document.createElement('mark');
      hint.textContent = '\nОтвечайте на вопросы — заявка будет дописываться сама.';
      out.appendChild(hint);
    }
    const body = encodeURIComponent(text);
    mail.href = `mailto:${C.email || ''}?subject=${encodeURIComponent('Нужен сайт')}&body=${body}`;
    if (C.telegram) { tg.hidden = false; tg.href = `https://t.me/${C.telegram}?text=${body}`; }
    if (C.whatsapp) { wa.hidden = false; wa.href = `https://wa.me/${C.whatsapp}?text=${body}`; }
  }

  /* ---------- Проверка полей ---------- */
  const RULES = {
    who: [(s) => s.length >= 2, 'Напишите, как к вам обращаться.'],
    reach: [(s) => s.length >= 5, 'Оставьте телефон, Telegram или почту, чтобы я мог ответить.'],
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
      note.textContent = 'Заполните имя и контакт — без них я не смогу ответить.';
      return;
    }
    if (!C.leadsEndpoint) {
      note.textContent = 'Отправка заявок пока не подключена. Отправьте текст почтой или скопируйте его ниже.';
      return;
    }
    busy = true;
    send.setAttribute('aria-busy', 'true');
    send.textContent = 'Отправляю…';
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
      note.textContent = `Заявка отправлена. Я свяжусь с вами: ${v('reach')}.`;
      send.textContent = 'Заявка отправлена';
      send.disabled = true;
    } catch (err) {
      note.textContent = 'Не получилось отправить заявку. Проверьте интернет и попробуйте ещё раз — или отправьте текст сами, ссылки ниже.';
      send.textContent = 'Отправить заявку';
      busy = false;
    } finally {
      send.removeAttribute('aria-busy');
    }
  });

  form.addEventListener('input', render);
  mail.addEventListener('click', () => { note.classList.remove('is-ok'); note.textContent = 'Открывается ваша почта. Если ничего не произошло, скопируйте текст и отправьте на ' + (C.email || '') + '.'; });
  copy.addEventListener('click', async () => {
    note.classList.remove('is-ok');
    try {
      await navigator.clipboard.writeText(compose().text);
      note.textContent = 'Текст скопирован. Вставьте его в письмо или сообщение' + (C.email ? ' на ' + C.email : '') + '.';
    } catch (err) {
      note.textContent = 'Не получилось скопировать. Выделите текст заявки и скопируйте вручную.';
    }
  });
  render();
})();
