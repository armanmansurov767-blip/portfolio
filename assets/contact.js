/* =========================================================
   «Обсудить сайт»: из ответов собирается письмо.
   Сервера нет: письмо уходит через почтовую программу или мессенджер посетителя.
   ========================================================= */
(function () {
  const form = document.getElementById('brief');
  if (!form) return;
  const C = window.PORTFOLIO || {};
  const out = document.getElementById('letter');
  const note = document.getElementById('note');
  const mail = document.getElementById('sendMail');
  const tg = document.getElementById('sendTg');
  const wa = document.getElementById('sendWa');
  const copy = document.getElementById('copy');
  const first = (C.name || '').split(' ')[0];

  function compose() {
    const d = new FormData(form);
    const v = (k) => (d.get(k) || '').toString().trim();
    const lines = [`Здравствуйте${first ? ', ' + first : ''}!`];
    if (v('who')) lines.push(`Меня зовут ${v('who')}.`);
    lines.push(v('kind') ? `Мне нужен сайт: ${v('kind')}.` : null);
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
      hint.textContent = '\nОтвечайте на вопросы — письмо будет дописываться само.';
      out.appendChild(hint);
    }
    const body = encodeURIComponent(text);
    mail.href = `mailto:${C.email || ''}?subject=${encodeURIComponent('Нужен сайт')}&body=${body}`;
    if (C.telegram) { tg.hidden = false; tg.href = `https://t.me/${C.telegram}?text=${body}`; }
    if (C.whatsapp) { wa.hidden = false; wa.href = `https://wa.me/${C.whatsapp}?text=${body}`; }
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  mail.addEventListener('click', () => { note.textContent = 'Открывается ваша почта. Если ничего не произошло, скопируйте текст и отправьте на ' + (C.email || '') + '.'; });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(compose().text);
      note.textContent = 'Текст скопирован. Вставьте его в письмо или сообщение' + (C.email ? ' на ' + C.email : '') + '.';
    } catch (err) {
      note.textContent = 'Не получилось скопировать. Выделите текст письма и скопируйте вручную.';
    }
  });
  render();
})();
