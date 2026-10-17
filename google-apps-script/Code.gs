/**
 * Портфолио — приём заявок с формы «Обсудить сайт».
 *
 * Скрипт живёт внутри Google Таблицы «Портфолио — заявки».
 * Каждая заявка становится строкой в таблице и письмом в Gmail.
 *
 * Как установить и обновлять — см. README.md в этой же папке.
 */

// Кому слать письма. Можно несколько адресов через запятую: 'a@gmail.com, b@gmail.com'
const NOTIFY_EMAIL = 'armanmansurov767@gmail.com';

const SHEET_NAME = 'Заявки';
const TIME_ZONE = 'Asia/Almaty';

const HEADERS = [
  'Дата и время', 'Имя', 'Контакт', 'Что нужно', 'Ближе всего', 'О деле', 'Сроки', 'Страница', 'Статус', 'Заметка',
];

const STATUSES = ['Новая', 'Связался', 'Обсуждаем', 'Договорились', 'Отказ'];

/* ---------- Приём заявки ---------- */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const data = parseRequest_(e);

    // Скрытое поле-ловушка: человек его не видит, а спам-бот заполняет.
    if (data.website) return json_({ ok: true });

    const name = clean_(data.name, 80);
    const contact = clean_(data.contact, 120);
    if (name.length < 2 || contact.length < 5) {
      return json_({ ok: false, error: 'validation' });
    }

    const lead = {
      date: new Date(),
      name: name,
      contact: contact,
      kind: clean_(data.kind, 120),
      like: clean_(data.like, 60),
      about: clean_(data.about, 2000),
      when: clean_(data.when, 60),
      page: clean_(data.page, 200),
    };

    const sheet = getSheet_();
    sheet.appendRow([
      lead.date, lead.name, lead.contact, lead.kind, lead.like, lead.about, lead.when, lead.page, STATUSES[0], '',
    ]);

    notify_(lead, sheet.getLastRow());
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

// Открыв адрес скрипта в браузере, можно проверить, что он живой.
function doGet() {
  return json_({ ok: true, service: 'portfolio-leads' });
}

/* ---------- Первый запуск ---------- */

/**
 * Запустите один раз вручную из редактора (кнопка «Выполнить»).
 * Google спросит разрешения, таблица оформится, а на почту придёт тестовое письмо.
 */
function setup() {
  const sheet = getSheet_();
  formatSheet_(sheet);
  notify_({
    date: new Date(), name: 'Тестовая заявка', contact: '+7 701 000 00 00',
    kind: 'сайт компании на несколько страниц', like: 'Halden',
    about: 'Это тестовое письмо. Если вы его видите — почта настроена правильно.',
    when: 'в течение месяца', page: 'setup()',
  }, null);
}

/* ---------- Таблица ---------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
  }
  if (sheet.getRange(1, 1).getValue() !== HEADERS[0]) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function formatSheet_(sheet) {
  const ss = sheet.getParent();
  ss.setSpreadsheetTimeZone(TIME_ZONE);

  const cols = HEADERS.length;
  sheet.getRange(1, 1, 1, cols)
    .setValues([HEADERS])
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#1F2EE0')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, sheet.getMaxRows(), cols).setFontFamily('Arial');

  const widths = [140, 150, 190, 220, 120, 340, 140, 160, 130, 260];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  sheet.getRange('A2:A').setNumberFormat('dd.MM.yyyy HH:mm');
  sheet.getRange('C2:C').setNumberFormat('@');
  sheet.getRange('F2:F').setWrap(true);
  sheet.getRange('J2:J').setWrap(true);

  // Выпадающий список статусов
  sheet.getRange('I2:I').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build()
  );

  // Цвет строки по статусу
  const colors = { 'Новая': '#E3E6FF', 'Связался': '#FFF4CC', 'Обсуждаем': '#E8EEF9', 'Договорились': '#DFF2E1', 'Отказ': '#EEEEEE' };
  const rowRange = sheet.getRange(2, 1, sheet.getMaxRows() - 1, cols);
  const rules = Object.keys(colors).map((s) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$I2="' + s + '"')
      .setBackground(colors[s])
      .setRanges([rowRange])
      .build()
  );
  sheet.setConditionalFormatRules(rules);
}

/* ---------- Письмо ---------- */

// По тому, что клиент написал в поле «Как с вами связаться», подбираем способы ответить
function contactLinks_(contact) {
  const c = String(contact).replace(/^'/, '').trim();
  const links = [];
  const email = c.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  const tg = c.match(/(?:t\.me\/|^@)([A-Za-z0-9_]{4,32})/);
  const digits = c.replace(/\D/g, '');
  if (email) links.push(['mailto:' + email[0], 'Написать на почту']);
  if (tg) links.push(['https://t.me/' + tg[1], 'Написать в Telegram']);
  if (!email && !tg && digits.length >= 10 && digits.length <= 15) {
    links.push(['tel:+' + digits, 'Позвонить']);
    links.push(['https://wa.me/' + digits, 'Написать в WhatsApp']);
  }
  return { links: links, email: email ? email[0] : '' };
}

function notify_(lead, rowNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUrl = ss.getUrl() + (rowNumber ? '#gid=' + ss.getSheetByName(SHEET_NAME).getSheetId() + '&range=A' + rowNumber : '');
  const plain = (s) => String(s).replace(/^'/, ''); // апостроф-защита нужна только в таблице
  const when = Utilities.formatDate(lead.date, TIME_ZONE, 'dd.MM.yyyy, HH:mm');
  const reach = contactLinks_(lead.contact);

  const rows = [
    ['Имя', lead.name],
    ['Контакт', lead.contact],
    ['Что нужно', lead.kind],
    ['Ближе всего', lead.like],
    ['О деле', lead.about],
    ['Сроки', lead.when],
  ].filter((r) => r[1]).map((r) => [r[0], plain(r[1])]);

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const table = rows.map((r) =>
    '<tr><td style="padding:8px 16px 8px 0;color:#555A6C;white-space:nowrap;vertical-align:top">' + esc(r[0]) +
    '</td><td style="padding:8px 0;color:#0B0D17">' + esc(r[1]).replace(/\n/g, '<br>') + '</td></tr>'
  ).join('');

  const btn = (href, label, dark) =>
    '<a href="' + href + '" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;' +
    (dark ? 'background:#1F2EE0;color:#ffffff' : 'border:1.5px solid #1F2EE0;color:#1F2EE0') + '">' + label + '</a>';

  const buttons = reach.links.map((l, i) => btn(l[0], l[1], i === 0)).join('') + btn(sheetUrl, 'Открыть в таблице', !reach.links.length);

  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;max-width:560px">' +
    '<p style="margin:0 0 4px;color:#1F2EE0;font-weight:700;font-size:13px">Новая заявка с портфолио</p>' +
    '<h2 style="margin:0 0 4px;font-size:22px;color:#0B0D17">' + esc(plain(lead.name)) + (lead.kind ? ' — ' + esc(plain(lead.kind)) : '') + '</h2>' +
    '<p style="margin:0 0 18px;color:#555A6C">' + when + '</p>' +
    '<table style="border-collapse:collapse;margin-bottom:22px">' + table + '</table>' +
    buttons +
    '<p style="margin:18px 0 0;color:#555A6C;font-size:13px">Когда свяжетесь с клиентом, поменяйте статус заявки в таблице.</p>' +
    '</div>';

  const text = rows.map((r) => r[0] + ': ' + r[1]).join('\n') + '\n\nТаблица: ' + sheetUrl;

  const mail = {
    to: NOTIFY_EMAIL || Session.getEffectiveUser().getEmail(),
    subject: 'Новая заявка с портфолио: ' + plain(lead.name) + (lead.kind ? ' — ' + plain(lead.kind) : ''),
    body: text,
    htmlBody: html,
    name: 'Портфолио — заявки',
  };
  // «Ответить» в Gmail сразу пишет клиенту, если он оставил почту
  if (reach.email) mail.replyTo = reach.email;
  MailApp.sendEmail(mail);
}

/* ---------- Вспомогательное ---------- */

function parseRequest_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { /* не JSON — берём параметры формы */ }
  }
  return (e && e.parameter) || {};
}

// Обрезает лишнее и защищает таблицу: текст, начинающийся с = + - @, не станет формулой.
function clean_(value, max) {
  let s = String(value == null ? '' : value).trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
