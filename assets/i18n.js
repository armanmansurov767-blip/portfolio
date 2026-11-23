/* =========================================================
   Языки сайта: русский (основной), английский, казахский.

   Как это устроено
   — Русский текст остаётся в HTML как есть и служит ключом: ниже для каждой русской фразы
     записан перевод [русский, английский, казахский]. Нашлась фраза — подставляется перевод.
   — Скрипт подключается в <head> (выбирает язык) и запускается в конце <body> (подменяет текст),
     то есть до анимаций: их расчёты уже видят итоговый текст.
   — Строки, которые создают скрипты (шапка, подвал, форма), берут перевод через I18N.t('русская фраза').
   — Язык выбирается так: ?lang=en в адресе → сохранённый выбор → язык браузера → русский.
   — Окна и ссылки на сайты работ получают ?lang= с языком портфолио: сами сайты тоже на трёх языках.
   — Не переводятся: названия работ, демо-бот Halden (настоящий бот говорит по-русски),
     окна-макеты внутри «сайта в разборе» и вкладки браузера в окнах работ — это содержимое самих сайтов.

   Правите русский текст на странице — поправьте и его ключ здесь, иначе перевод пропадёт
   и на странице останется русский. Увидеть такие места: открыть страницу с ?lang=en и ввести
   в консоли I18N.missing.
   ========================================================= */
(function () {
  const LANGS = ['ru', 'en', 'kk'];
  const STORE = 'portfolio-lang';
  const root = document.documentElement;

  const save = (l) => { try { localStorage.setItem(STORE, l); } catch (e) { /* приватный режим */ } };
  function pick() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (LANGS.includes(q)) { save(q); return q; }
    } catch (e) { /* старый браузер */ }
    try {
      const s = localStorage.getItem(STORE);
      if (LANGS.includes(s)) return s;
    } catch (e) { /* приватный режим */ }
    for (const l of (navigator.languages || [navigator.language || ''])) {
      const code = String(l).slice(0, 2).toLowerCase();
      if (LANGS.includes(code)) return code;
    }
    return 'ru';
  }
  const lang = pick();
  const col = lang === 'en' ? 1 : 2;

  /* ---------- Словарь: [русский, английский, казахский] ---------- */
  const T = [
    /* Заголовки и описания страниц */
    [`Арман Мансуров — сайты, которые хочется листать`, `Arman Mansurov — websites you’ll want to scroll`, `Арман Мансуров — парақтап көргіңіз келетін сайттар`],
    [`Делаю сайты и чат-ботов для бизнеса: с характером, живой анимацией и заявками в вашу таблицу или мессенджер. Три работы, каждую можно открыть и полистать.`, `I build websites and chatbots for business: with character, lively animation, and leads delivered to your spreadsheet or messenger. Three projects, each one you can open and scroll through.`, `Бизнеске арналған сайттар мен чат-боттар жасаймын: өзіндік сипаты, жанды анимациясы бар, ал өтінімдер кестеңізге немесе мессенджеріңізге түседі. Үш жұмыс, әрқайсысын ашып, парақтап көруге болады.`],
    [`листва. — работа Армана Мансурова`, `Listva — a project by Arman Mansurov`, `Листва — Арман Мансуровтың жұмысы`],
    [`Сайт турагентства осенних туров: пять страниц, каталог с фильтрами, расчёт цены и заявки в Google Таблицу. Можно открыть и полистать.`, `Website of an autumn-tours travel agency: five pages, a catalog with filters, price calculation and requests into a Google Sheet. You can open it and scroll through.`, `Күзгі турлар туристік агенттігінің сайты: бес бет, сүзгілері бар каталог, баға есебі және Google Кестесіне түсетін өтінімдер. Ашып, парақтап көруге болады.`],
    [`Halden — работа Армана Мансурова`, `Halden — a project by Arman Mansurov`, `Halden — Арман Мансуровтың жұмысы`],
    [`Сайт экспедиционного турагентства: тринадцать страниц, выпадающее меню, заявки в Google Таблицу. Можно открыть и полистать.`, `Website of an expedition travel agency: thirteen pages, a dropdown menu, requests into a Google Sheet. You can open it and scroll through.`, `Экспедициялық туристік агенттіктің сайты: он үш бет, ашылмалы мәзір, Google Кестесіне түсетін өтінімдер. Ашып, парақтап көруге болады.`],
    [`Vela 14 — работа Армана Мансурова`, `Vela 14 — a project by Arman Mansurov`, `Vela 14 — Арман Мансуровтың жұмысы`],
    [`Одностраничный сайт-презентация: ноутбук разбирается на детали, пока вы листаете. Трёхмерная модель собрана кодом. Можно открыть и полистать.`, `A one-page presentation site: a laptop comes apart into its components as you scroll. The three-dimensional model is built in code. You can open it and scroll through.`, `Бір беттік таныстыру сайты: сіз парақтаған сайын ноутбук бөлшектерге бөлінеді. Үшөлшемді модель кодпен жиналған. Ашып, парақтап көруге болады.`],
    [`Обсудить сайт — Арман Мансуров`, `Discuss a site — Arman Mansurov`, `Сайтты талқылау — Арман Мансуров`],
    [`Ответьте на четыре вопроса — получится готовое письмо. Отправьте его удобным способом, и я отвечу, какой сайт вам подойдёт.`, `Answer four questions and you get a ready-made message. Send it however is convenient, and I’ll reply with which site suits you.`, `Төрт сұраққа жауап беріңіз — дайын хат шығады. Оны ыңғайлы тәсілмен жіберіңіз, мен сізге қандай сайт жарайтынын жауап беремін.`],

    /* Имя */
    [`Арман Мансуров`, `Arman Mansurov`, `Арман Мансуров`],
    [`Арман`, `Arman`, `Арман`],

    /* Шапка, меню, подвал (создаются скриптом) */
    [`Перейти к содержимому`, `Skip to content`, `Мазмұнға өту`],
    [`Работы`, `Projects`, `Жұмыстар`],
    [`Обсудить сайт`, `Discuss your site`, `Сайтты талқылау`],
    [`Меню`, `Menu`, `Мәзір`],
    [`Закрыть`, `Close`, `Жабу`],
    [`Главная`, `Home`, `Басты бет`],
    [`Подвал`, `Footer`, `Төменгі колонтитул`],
    [`Язык`, `Language`, `Тіл`],
    [`Листва, Halden и Vela 14 — концепты: компании, цены и отзывы в них вымышлены. Сами сайты настоящие, их можно открыть и полистать.`, `Listva, Halden and Vela 14 are concepts: the companies, prices and reviews in them are fictional. The sites themselves are real — you can open them and scroll through.`, `Листва, Halden және Vela 14 — концепттер: олардағы компаниялар, бағалар мен пікірлер ойдан шығарылған. Сайттардың өзі нақты, оларды ашып, парақтап көруге болады.`],

    /* Главная: сцена */
    [`Сайты,`, `Sites`, `Парақтап`],
    [`которые`, `you’ll`, `көргіңіз`],
    [`хочется`, `want to`, `келетін`],
    [`листать`, `scroll`, `сайттар`],
    [`Меня зовут Арман. Делаю сайты и чат-ботов для бизнеса: с характером, живой анимацией и заявками, которые приходят вам в таблицу или в мессенджер.`, `My name is Arman. I build websites and chatbots for business: with character, lively animation, and leads that land in your spreadsheet or messenger.`, `Менің атым Арман. Бизнеске арналған сайттар мен чат-боттар жасаймын: өзіндік сипаты, жанды анимациясы бар, ал өтінімдер тікелей кестеңізге немесе мессенджеріңізге келеді.`],
    [`Листайте вниз — три сайта листаются вместе с вами`, `Scroll down — three sites scroll along with you`, `Төмен жылжыңыз — үш сайт сізбен бірге жылжиды`],
    [`Турагентство осенних туров`, `Autumn tours travel agency`, `Күзгі турлар туристік агенттігі`],
    [`Сайт, который продаёт осень. Листья падают прямо на первом экране, туры фильтруются по месяцу и бюджету, а цена пересчитывается на странице тура.`, `A website that sells autumn. Leaves fall right on the first screen, tours filter by month and budget, and the price recalculates on the tour page.`, `Күзді сататын сайт. Жапырақтар бірінші экранның өзінде түседі, турлар айы мен бюджеті бойынша сүзіледі, ал баға тур бетінде қайта есептеледі.`],
    [`Страниц`, `Pages`, `Беттер`],
    [`Каталог`, `Catalog`, `Каталог`],
    [`Фильтры по региону, формату, месяцу и бюджету`, `Filters by region, format, month and budget`, `Аймақ, формат, ай және бюджет бойынша сүзгілер`],
    [`Заявки`, `Leads`, `Өтінімдер`],
    [`В Google Таблицу и на почту`, `To a Google Sheet and by email`, `Google Кестесіне және поштаға`],
    [`Открыть листву`, `Open Listva`, `Листваны ашу`],
    [`Сайт в новой вкладке`, `Site in a new tab`, `Сайт жаңа қойындыда`],
    [`листва. — открыть работу`, `Listva — open the project`, `Листва — жұмысты ашу`],
    [`Открыть`, `Open`, `Ашу`],
    [`Главная страница сайта «листва.»: ветка в осенних листьях, календарь сезона, карточки туров`, `Home page of the “листва.” website: a branch in autumn leaves, a season calendar, tour cards`, `«листва.» сайтының басты беті: күзгі жапырақты бұтақ, маусым күнтізбесі, тур карталары`],
    [`Экспедиционное турагентство`, `Expedition travel agency`, `Экспедициялық туристік агенттік`],
    [`Экспедиции на край света на тринадцати страницах. Крупные фотографии, спокойная тёмная палитра и форма, после которой заявка сразу попадает в таблицу.`, `Expeditions to the edge of the world across thirteen pages. Large photographs, a calm dark palette, and a form that sends the request straight into a spreadsheet.`, `Он үш беттегі дүниенің шетіне экспедициялар. Үлкен фотосуреттер, байсалды қою палитра және жіберілген өтінім бірден кестеге түсетін форма.`],
    [`Разделы`, `Sections`, `Бөлімдер`],
    [`Стихии, форматы путешествий, регионы`, `Elements, travel formats, regions`, `Табиғат күштері, саяхат форматтары, аймақтар`],
    [`Открыть Halden`, `Open Halden`, `Halden сайтын ашу`],
    [`Halden — открыть работу`, `Halden — open the project`, `Halden — жұмысты ашу`],
    [`Главная страница сайта Halden: ледниковая река в вулканической долине, маршруты и регионы`, `Home page of the Halden website: a glacial river in a volcanic valley, routes and regions`, `Halden сайтының басты беті: жанартау аңғарындағы мұздық өзені, маршруттар мен аймақтар`],
    [`Презентация ноутбука в 3D`, `A 3D laptop presentation`, `Ноутбуктың 3D таныстырылымы`],
    [`Ноутбук, который разбирается, пока вы листаете. Крышка открывается, девять слоёв расходятся, и у каждой детали подписано, за что она отвечает.`, `A laptop that comes apart as you scroll. The lid opens, nine layers fan out, and every part is labeled with what it does.`, `Сіз парақтаған сайын бөлшектеліп кететін ноутбук. Қақпағы ашылады, тоғыз қабат жан-жаққа жайылады, әр бөлшектің нені атқаратыны жазылып тұрады.`],
    [`Глав`, `Chapters`, `Тараулар`],
    [`10, от открытия крышки до сборки`, `10, from opening the lid to assembly`, `10: қақпақты ашудан бастап жинауға дейін`],
    [`Модель`, `Model`, `Модель`],
    [`Трёхмерная, собрана кодом из отдельных деталей`, `Three-dimensional, built in code from separate parts`, `Үшөлшемді, жеке бөлшектерден кодпен жиналған`],
    [`Прокрутка`, `Scrolling`, `Жылжыту`],
    [`Вперёд — разбор, назад — сборка`, `Forward takes it apart, back puts it together`, `Алға — бөлшектеу, артқа — жинау`],
    [`Открыть Vela 14`, `Open Vela 14`, `Vela 14 сайтын ашу`],
    [`Vela 14 — открыть работу`, `Vela 14 — open the project`, `Vela 14 — жұмысты ашу`],
    [`Сайт Vela 14: закрытый ноутбук на чёрном фоне`, `The Vela 14 website: a closed laptop on a black background`, `Vela 14 сайты: қара фондағы жабық ноутбук`],
    [`Работы на сцене`, `Projects on stage`, `Сахнадағы жұмыстар`],

    /* Главная: с чем помогаю */
    [`С чем я помогаю`, `What I help with`, `Қандай мәселеде көмектесемін`],
    [`Сайт и бот нужны не сами по себе, а чтобы убрать конкретную неприятность. Вот с какими приходят чаще всего.`, `A site or a bot isn’t needed for its own sake, but to remove a specific headache. Here are the ones people come with most often.`, `Сайт пен бот өздігінен керек емес, нақты бір қиындықты шешу үшін керек. Мына мәселелермен жиі келеді.`],
    [`Люди заходят на сайт и уходят`, `People visit the site and leave`, `Адамдар сайтқа кіріп, шығып кетеді`],
    [`Делаю сайт, на котором за десять секунд понятно, что вы предлагаете и куда нажать. Каталог, фильтры и расчёт цены ведут человека к заявке.`, `I build a site where, within ten seconds, it’s clear what you offer and where to click. The catalog, filters and price calculation lead a person to a request.`, `Не ұсынатыныңыз және қайда басу керегі он секундта түсінікті болатын сайт жасаймын. Каталог, сүзгілер және баға есебі адамды өтінімге жетелейді.`],
    [`Сайт выглядит как у всех`, `The site looks like everyone else’s`, `Сайт бәрінікі сияқты көрінеді`],
    [`Рисую вид под ваш продукт: свои цвета и шрифты, анимация по прокрутке. Если продукт нужно рассмотреть, как ноутбук в Vela 14, собираю трёхмерную модель.`, `I design the look around your product: its own colors and fonts, scroll animation. If the product needs a close look, like the laptop in Vela 14, I build a three-dimensional model.`, `Сайттың келбетін өніміңізге арнап сызамын: өз түстері мен қаріптері, жылжытқанда жүретін анимация. Өнімді мұқият қарау керек болса, Vela 14-тегі ноутбук сияқты, үшөлшемді модель жасаймын.`],
    [`Заявки теряются в чатах и звонках`, `Requests get lost in chats and calls`, `Өтінімдер чаттар мен қоңыраулар арасында жоғалады`],
    [`Каждая заявка с формы попадает строкой в вашу Google Таблицу и письмом на почту. Видно, кто написал и когда.`, `Every request from the form lands as a row in your Google Sheet and as an email. You can see who wrote and when.`, `Формадағы әр өтінім Google Кестеңізге жол болып, поштаңызға хат болып түседі. Кімнің және қашан жазғаны көрінеді.`],
    [`Менеджер отвечает на одни и те же вопросы`, `Your manager answers the same questions over and over`, `Менеджер бірдей сұрақтарға қайта-қайта жауап береді`],
    [`Делаю чат-бота в мессенджере. Он показывает каталог, помогает выбрать, принимает заявку и отвечает на частые вопросы в любое время суток. Заявка сразу уходит менеджеру.`, `I build a chatbot for a messenger. It shows the catalog, helps people choose, takes a request and answers frequent questions at any hour. The request goes straight to the manager.`, `Мессенджерге чат-бот жасаймын. Ол каталогты көрсетеді, таңдауға көмектеседі, өтінімді қабылдайды және жиі қойылатын сұрақтарға тәулік бойы жауап береді. Өтінім бірден менеджерге барады.`],
    [`Самый простой путь: запускается быстро, пользоваться ботом бесплатно. Подходит, если ваши клиенты уже пишут вам в Telegram.`, `The simplest route: it launches fast, and using the bot is free. It suits you if your customers already message you on Telegram.`, `Ең оңай жол: тез іске қосылады, ботты пайдалану тегін. Клиенттеріңіз сізге Telegram-да жазып жүрсе, дәл сол жарайды.`],
    [`Через официальную платформу WhatsApp Business от Meta. Нужны бизнес-аккаунт Meta и отдельный номер, а Meta сама проверяет компанию, это занимает время. Помогу с настройкой и напишу бота.`, `Through Meta’s official WhatsApp Business platform. You need a Meta business account and a separate phone number, and Meta verifies the company itself, which takes time. I’ll help with the setup and write the bot.`, `Meta-ның ресми WhatsApp Business платформасы арқылы. Meta бизнес-аккаунты және бөлек нөмір керек, ал компанияны Meta өзі тексереді, бұл уақыт алады. Баптауға көмектесемін және ботты жазамын.`],
    [`Бот работает на сервере, это отдельный недорогой хостинг. Подберу и подключу.`, `The bot runs on a server — a separate, inexpensive hosting plan. I’ll pick it and set it up.`, `Бот серверде жұмыс істейді, бұл бөлек арзан хостинг. Таңдап, қосып беремін.`],
    [`Попробовать бота прямо здесь`, `Try the bot right here`, `Ботты дәл осы жерде сынап көріңіз`],

    /* Главная: демо-бот */
    [`Поговорите с ботом прямо здесь`, `Talk to the bot right here`, `Ботпен дәл осы жерде сөйлесіңіз`],
    [`Это копия Telegram-бота, которого я сделал для Halden. За минуту он собирает заявку: имя, телефон, экспедицию и даты. Кто не знает, куда хочет, проходит короткий тест, и бот советует экспедицию. Заявка сразу попадает в Google Таблицу и менеджеру в Telegram.`, `This is a copy of the Telegram bot I built for Halden. In a minute it collects a request: name, phone, expedition and dates. Anyone who doesn’t know where they want to go takes a short quiz, and the bot suggests an expedition. The request lands straight in a Google Sheet and with the manager in Telegram.`, `Бұл мен Halden үшін жасаған Telegram-боттың көшірмесі. Ол бір минутта өтінім жинайды: аты, телефоны, экспедиция және күндер. Қайда барғысы келетінін білмейтін адам қысқа тесттен өтеді, бот экспедиция ұсынады. Өтінім бірден Google Кестесіне және менеджерге Telegram арқылы түседі.`],
    [`Нажимайте кнопки и пишите, как в настоящем Telegram. В демо заявка никуда не уходит: всё остаётся в вашем браузере.`, `Press the buttons and type as in the real Telegram. The demo bot speaks Russian, just like the real one. Nothing is sent anywhere: it all stays in your browser.`, `Түймелерді басып, нағыз Telegram-дағыдай жазыңыз. Демо-бот нағыз бот сияқты орыс тілінде сөйлейді. Өтінім ешқайда жіберілмейді: бәрі браузеріңізде қалады.`],
    [`Открыть бота в Telegram`, `Open the bot in Telegram`, `Ботты Telegram-да ашу`],
    [`Так заявку увидит менеджер в Telegram`, `This is how the manager sees the request in Telegram`, `Менеджер өтінімді Telegram-да осылай көреді`],
    [`И строкой в Google Таблице`, `And as a row in the Google Sheet`, `Және Google Кестесінде жол ретінде`],

    /* Главная: сайт в разборе */
    [`Что внутри каждого сайта`, `What’s inside every site`, `Әр сайттың ішінде не бар`],
    [`Разберём первый экран «листвы» на слои. За каждый отвечаю я, вам не нужно искать отдельно дизайнера, копирайтера и программиста.`, `Let’s take Listva’s first screen apart into layers. I handle each one, so you don’t need to look separately for a designer, a copywriter and a developer.`, `Листваның бірінші экранын қабаттарға бөліп көрейік. Әрқайсысына өзім жауап беремін, дизайнерді, копирайтерді және бағдарламашыны бөлек іздеудің қажеті жоқ.`],
    [`Структура`, `Structure`, `Құрылым`],
    [`Сначала решаем, какие страницы нужны и что на каждой. Посетитель должен за десять секунд понять, что вы предлагаете и куда нажать.`, `First we decide which pages are needed and what goes on each. In ten seconds a visitor should understand what you offer and where to click.`, `Алдымен қандай беттер керек екенін және әрқайсысында не болатынын шешеміз. Келуші он секундта не ұсынатыныңызды және қайда басу керегін түсінуі тиіс.`],
    [`Картинка`, `Visuals`, `Көрнекілік`],
    [`Фотографии и графика под ваш продукт. По ним сайт узнают и запоминают.`, `Photographs and graphics for your product. They’re how people recognize and remember the site.`, `Өніміңізге арналған фотосуреттер мен графика. Сайтты солар арқылы танып, есте сақтайды.`],
    [`Текст`, `Copy`, `Мәтін`],
    [`Заголовки простыми словами: что это, для кого и сколько стоит.`, `Headlines in plain words: what it is, who it’s for and what it costs.`, `Қарапайым сөздермен жазылған тақырыптар: бұл не, кімге арналған және қанша тұрады.`],
    [`Меню и кнопки`, `Menu and buttons`, `Мәзір және түймелер`],
    [`Меню, фильтры, расчёт цены. Всё удобно нажимать пальцем на телефоне.`, `Menu, filters, price calculation. Everything is easy to tap with a finger on a phone.`, `Мәзір, сүзгілер, баға есебі. Бәрін телефонда саусақпен басуға ыңғайлы.`],
    [`Движение`, `Motion`, `Қозғалыс`],
    [`Анимация помогает рассмотреть продукт и не мешает читать. Если у посетителя анимация отключена в системе, сайт остаётся спокойным.`, `Animation helps people look at the product and doesn’t get in the way of reading. If a visitor has animation turned off in their system, the site stays calm.`, `Анимация өнімді қарауға көмектеседі, оқуға кедергі жасамайды. Келушінің жүйесінде анимация өшірулі болса, сайт тыныш қалпында қалады.`],
    [`Форма проверяет поля и отправляет заявку в вашу Google Таблицу и на почту. Ни одно обращение не теряется.`, `The form validates the fields and sends the request to your Google Sheet and email. No enquiry gets lost.`, `Форма өрістерді тексеріп, өтінімді Google Кестеңізге және поштаңызға жібереді. Бірде-бір өтінім жоғалмайды.`],

    /* Главная: как идёт работа, отзывы, призыв */
    [`От разговора до первых заявок`, `From the first conversation to the first requests`, `Әңгімеден алғашқы өтінімдерге дейін`],
    [`Четыре шага. На каждом вы видите результат и можете поменять направление.`, `Four steps. At each one you see the result and can change direction.`, `Төрт қадам. Әрқайсысында нәтижені көресіз және бағытты өзгерте аласыз.`],
    [`Цена и сроки договорные.`, `Price and timing are negotiable.`, `Баға мен мерзім келісімге байланысты.`],
    [`Одному хватит одной страницы, другому нужны каталог, анимация и бот. Поэтому сначала разговор, потом точная цифра и дата.`, `One person needs a single page, another needs a catalog, animation and a bot. So first we talk, then I give an exact figure and date.`, `Біреуге бір бет жетеді, екіншісіне каталог, анимация және бот керек. Сондықтан алдымен әңгіме, содан кейін нақты сома мен күн.`],
    [`Знакомство`, `Getting acquainted`, `Танысу`],
    [`Вы рассказываете о бизнесе и клиентах. Я задаю вопросы и предлагаю, какие страницы нужны.`, `You tell me about your business and customers. I ask questions and suggest which pages you need.`, `Сіз бизнесіңіз бен клиенттеріңіз туралы айтасыз. Мен сұрақ қойып, қандай беттер керегін ұсынамын.`],
    [`Первый экран`, `First screen`, `Бірінші экран`],
    [`Собираю главный экран и показываю вам. Здесь проще всего сказать «не то» — и я переделаю, пока не станет «то».`, `I build the main screen and show it to you. This is the easiest moment to say “not that” — and I’ll redo it until it’s “that”.`, `Басты экранды жинап, сізге көрсетемін. Дәл осы кезде «бұл емес» деп айту оңай, мен «міне, дәл осы» болғанша қайта жасаймын.`],
    [`Весь сайт`, `The whole site`, `Бүкіл сайт`],
    [`Достраиваю остальные страницы, анимацию, версию для телефона и форму заявок.`, `I build out the remaining pages, the animation, the phone version and the request form.`, `Қалған беттерді, анимацияны, телефон нұсқасын және өтінім формасын аяқтаймын.`],
    [`Запуск`, `Launch`, `Іске қосу`],
    [`Публикую сайт, подключаю заявки к вашей таблице и почте и показываю, где менять тексты и цены.`, `I publish the site, connect requests to your spreadsheet and email, and show you where to change texts and prices.`, `Сайтты жариялаймын, өтінімдерді кестеңіз бен поштаңызға қосамын және мәтіндер мен бағаларды қайдан өзгертуге болатынын көрсетемін.`],
    [`Что говорят клиенты`, `What clients say`, `Клиенттер не дейді`],
    [`Отзывы слово в слово. По ссылке под каждым можно зайти к клиенту и спросить у него самого.`, `Reviews word for word. Under each one there’s a link to the client, so you can ask them yourself.`, `Пікірлер сөзбе-сөз берілген. Әрқайсысының астындағы сілтеме арқылы клиентке өтіп, одан өзінен сұрауға болады.`],
    [`Какой сайт нужен вам?`, `What site do you need?`, `Сізге қандай сайт керек?`],
    [`Расскажите, чем занимаетесь. Отвечу, какой сайт или бот подойдёт. Цена и сроки договорные: назову их, когда пойму задачу.`, `Tell me what you do. I’ll reply with which site or bot would suit you. Price and timing are negotiable: I’ll name them once I understand the task.`, `Немен айналысатыныңызды айтыңыз. Қандай сайт немесе бот жарайтынын жауап беремін. Баға мен мерзім келісімге байланысты: міндетті түсінгеннен кейін айтамын.`],

    /* Страницы работ */
    [`Концепт: турагентство осенних туров`, `Concept: an autumn tours travel agency`, `Концепт: күзгі турлар туристік агенттігі`],
    [`Агентство возит из Алматы и Астаны смотреть осень: клёны Киото, виноград Кахетии, шары Каппадокии. Сайт устроен так, чтобы человек выбрал тур, увидел цену и оставил заявку без единого звонка.`, `The agency takes people from Almaty and Astana to see autumn: the maples of Kyoto, the vineyards of Kakheti, the balloons of Cappadocia. The site is built so a person can pick a tour, see the price and leave a request without a single call.`, `Агенттік адамдарды Алматы мен Астанадан күзді көруге апарады: Киотоның үйеңкілері, Кахетияның жүзімдіктері, Каппадокияның әуе шарлары. Сайт адам турды таңдап, бағасын көріп, бірде-бір қоңырау шалмай өтінім қалдыратындай етіп жасалған.`],
    [`5: главная, каталог, тур, отзывы, о компании`, `5: home, catalog, tour, reviews, about`, `5: басты бет, каталог, тур, пікірлер, компания туралы`],
    [`8 туров, цены в тенге`, `8 tours, prices in tenge`, `8 тур, бағасы теңгемен`],
    [`Телефон`, `Phone`, `Телефон`],
    [`Отдельная вёрстка, кнопки под палец`, `Separate layout, finger-sized buttons`, `Бөлек беттеу, саусаққа лайықты түймелер`],
    [`Размер экрана`, `Screen size`, `Экран өлшемі`],
    [`Компьютер`, `Desktop`, `Компьютер`],
    [`Открыть сайт в новой вкладке`, `Open the site in a new tab`, `Сайтты жаңа қойындыда ашу`],
    [`Сайт «листва.»`, `The “листва.” website`, `«листва.» сайты`],
    [`Первый экран сайта «листва.»`, `First screen of the “листва.” website`, `«листва.» сайтының бірінші экраны`],
    [`Включить сайт`, `Start the site`, `Сайтты қосу`],
    [`Это не картинка. Нажмите, и сайт заработает прямо в окне.`, `This isn’t an image. Click, and the site comes to life right in the window.`, `Бұл сурет емес. Басыңыз, сайт терезенің ішінде жұмыс істей бастайды.`],
    [`Что здесь сделано`, `What’s been done here`, `Мұнда не жасалған`],
    [`Каталог, в котором легко выбрать`, `A catalog that makes choosing easy`, `Таңдау оңай каталог`],
    [`Туры фильтруются по региону, формату отдыха и месяцу. Ползунок бюджета сразу убирает то, что не по карману, — посетитель не тратит время на лишние карточки.`, `Tours filter by region, type of trip and month. The budget slider instantly removes whatever is out of reach, so visitors don’t waste time on irrelevant cards.`, `Турлар аймағы, демалыс форматы және айы бойынша сүзіледі. Бюджет жүгірткісі қалтаға салмақ түсіретінді бірден алып тастайды, сондықтан келуші артық карточкаларға уақыт жоғалтпайды.`],
    [`Каталог туров с фильтрами по региону, формату, месяцу и бюджету`, `Tour catalog with filters by region, format, month and budget`, `Аймақ, формат, ай және бюджет бойынша сүзгілері бар тур каталогы`],
    [`Страница тура отвечает на все вопросы`, `The tour page answers every question`, `Тур беті барлық сұраққа жауап береді`],
    [`Длительность, маршрут, даты вылета, размер группы и цена видны сразу под фотографией. Ниже — программа по дням, отели и пакеты с расчётом итоговой суммы.`, `Duration, route, departure dates, group size and price are visible right under the photo. Below are the day-by-day program, hotels and packages with a total price calculation.`, `Ұзақтығы, маршруты, ұшу күндері, топ көлемі және баға фотосуреттің дәл астында көрінеді. Төменде күн сайынғы бағдарлама, қонақүйлер және қорытынды соманы есептейтін пакеттер.`],
    [`Страница тура в Японию: фотография храма, длительность, маршрут и цена`, `A tour page for Japan: a photo of a temple, duration, route and price`, `Жапонияға тур беті: ғибадатхана фотосуреті, ұзақтығы, маршруты және бағасы`],
    [`Отзывы, которым проще поверить`, `Reviews that are easier to trust`, `Сенуге оңай пікірлер`],
    [`Средняя оценка, распределение по звёздам и фильтры. Видно не только похвалу, но и общую картину.`, `Average rating, distribution by stars and filters. You see not only the praise but the whole picture.`, `Орташа баға, жұлдыздар бойынша бөліну және сүзгілер. Тек мақтау емес, жалпы көрініс те көрінеді.`],
    [`Страница отзывов со средней оценкой`, `The reviews page with an average rating`, `Орташа бағасы бар пікірлер беті`],
    [`Следующая работа`, `Next project`, `Келесі жұмыс`],

    [`Концепт: экспедиционное турагентство`, `Concept: an expedition travel agency`, `Концепт: экспедициялық туристік агенттік`],
    [`Агентство водит небольшие группы на ледники, вулканы и далёкие острова. Сайту нужно было внушить доверие ещё до первого разговора: большие спокойные фотографии, ясные программы по дням и одна понятная кнопка на каждой странице.`, `The agency leads small groups to glaciers, volcanoes and remote islands. The site had to inspire trust before the first conversation: large calm photographs, clear day-by-day programs and one obvious button on every page.`, `Агенттік шағын топтарды мұздықтарға, жанартауларға және алыс аралдарға апарады. Сайт алғашқы әңгімеге дейін-ақ сенім ұялатуы керек еді: үлкен байсалды фотосуреттер, күн сайынғы түсінікті бағдарламалар және әр бетте бір түсінікті түйме.`],
    [`13: стихии, форматы путешествий, регионы, история, заявка`, `13: elements, travel formats, regions, story, request`, `13: табиғат күштері, саяхат форматтары, аймақтар, тарих, өтінім`],
    [`Выпадающее на компьютере, отдельное для телефона`, `A dropdown on desktop, a separate one for phones`, `Компьютерде ашылмалы, телефонға бөлек`],
    [`Палитра`, `Palette`, `Палитра`],
    [`Тёмная, чтобы фотографии светились`, `Dark, so the photographs glow`, `Қою, фотосуреттер жарқырап тұруы үшін`],
    [`Сайт Halden`, `The Halden website`, `Halden сайты`],
    [`Первый экран сайта Halden`, `First screen of the Halden website`, `Halden сайтының бірінші экраны`],
    [`У каждой стихии своя страница`, `Each element has its own page`, `Әр табиғат күшінің өз беті бар`],
    [`Ледники, вулканы, дюны и острова. На странице — где это, сколько дней, сколько стоит и что происходит в каждый из них.`, `Glaciers, volcanoes, dunes and islands. The page tells you where it is, how many days, what it costs and what happens on each of them.`, `Мұздықтар, жанартаулар, құмдақтар және аралдар. Бетте: ол қайда, неше күн, қанша тұрады және әр күні не болады.`],
    [`Страница экспедиции на ледники`, `The glacier expedition page`, `Мұздықтарға экспедиция беті`],
    [`Два формата: с группой или в одиночку`, `Two formats: with a group or solo`, `Екі формат: топпен немесе жалғыз`],
    [`Отдельные страницы для походов в малых группах и индивидуальных экспедиций. Посетитель сразу попадает туда, где говорят о его случае.`, `Separate pages for small-group hikes and individual expeditions. The visitor lands straight where their situation is addressed.`, `Шағын топтық жорықтарға және жеке экспедицияларға бөлек беттер. Келуші дәл өз жағдайы туралы айтылатын жерге бірден түседі.`],
    [`Страница походов в малых группах`, `The small-group hikes page`, `Шағын топтық жорықтар беті`],
    [`Заявка доходит до человека`, `The request reaches a real person`, `Өтінім адамға жетеді`],
    [`Форма проверяет обязательные поля, а после отправки заявка появляется строкой в Google Таблице и письмом на почте.`, `The form checks the required fields, and once submitted the request appears as a row in a Google Sheet and as an email.`, `Форма міндетті өрістерді тексереді, ал жібергеннен кейін өтінім Google Кестесінде жол болып, поштада хат болып пайда болады.`],
    [`Страница заявки с формой`, `The request page with a form`, `Формасы бар өтінім беті`],

    [`Концепт: презентация ноутбука`, `Concept: a laptop presentation`, `Концепт: ноутбук таныстырылымы`],
    [`Сайт для продукта, который нужно рассмотреть. Пока вы листаете, ноутбук открывается, расслаивается на детали и собирается обратно. У каждой детали подписано, за что она отвечает.`, `A site for a product that needs a close look. As you scroll, the laptop opens, separates into layers and puts itself back together. Every part is labeled with what it does.`, `Мұқият қарау керек өнімге арналған сайт. Сіз парақтаған сайын ноутбук ашылады, қабаттарға бөлінеді және қайта жиналады. Әр бөлшектің нені атқаратыны жазылып тұрады.`],
    [`Страница`, `Page`, `Бет`],
    [`Одна, из десяти глав`, `One, made of ten chapters`, `Біреу, он тараудан тұрады`],
    [`Подача`, `Style`, `Стиль`],
    [`Чёрный фон и студийный свет, как на настоящей съёмке`, `A black background and studio lighting, like a real photo shoot`, `Қара фон және студиялық жарық, нағыз түсірілімдегідей`],
    [`Сайт Vela 14`, `The Vela 14 website`, `Vela 14 сайты`],
    [`Первый экран сайта Vela 14`, `First screen of the Vela 14 website`, `Vela 14 сайтының бірінші экраны`],
    [`Экран раскладывается на слои`, `The screen splits into layers`, `Экран қабаттарға жіктеледі`],
    [`Стекло, матрица, подсветка и алюминиевая крышка расходятся в стороны. Сложное устройство объясняется одним движением.`, `The glass, the panel, the backlight and the aluminum lid fan out to the sides. A complex device is explained in one motion.`, `Шыны, матрица, жарықтандыру және алюминий қақпақ жан-жаққа жайылады. Күрделі құрылғы бір қозғалыспен түсіндіріледі.`],
    [`Экран ноутбука, разложенный на слои, с подписями`, `A laptop screen laid out in layers, with labels`, `Қабаттарға жіктелген, жазулары бар ноутбук экраны`],
    [`Девять слоёв от клавиш до днища`, `Nine layers from the keys to the base`, `Пернелерден түбіне дейінгі тоғыз қабат`],
    [`Главный кадр: ноутбук разобран целиком, от каждой детали идёт линия к подписи. Подписи следуют за деталями, пока модель движется.`, `The key frame: the laptop fully disassembled, with a line running from each part to its label. The labels follow the parts as the model moves.`, `Басты кадр: ноутбук толық бөлшектенген, әр бөлшектен жазуға сызық жүргізілген. Модель қозғалғанда жазулар бөлшектердің соңынан еріп жүреді.`],
    [`Ноутбук в разборе: девять слоёв с подписями`, `The disassembled laptop: nine layers with labels`, `Бөлшектелген ноутбук: жазулары бар тоғыз қабат`],
    [`Крупный план чипа`, `Close-up of the chip`, `Чиптің ірі пландағы көрінісі`],
    [`Камера подлетает к плате, и на первый план выходит чип с памятью и накопителем.`, `The camera swoops in to the board, and the chip with memory and storage comes to the front.`, `Камера платаға жақындап, жады мен жинақтауышы бар чип алғы планға шығады.`],
    [`Крупный план платы и чипа`, `Close-up of the board and the chip`, `Плата мен чиптің ірі пландағы көрінісі`],

    /* Страница «Обсудить сайт» */
    [`Обсудим ваш сайт`, `Let’s talk about your site`, `Сайтыңызды талқылайық`],
    [`Ответьте на несколько вопросов, и из ответов соберётся заявка. Нажмите «Отправить заявку» — она придёт мне, и я свяжусь с вами. Цена и сроки договорные: обсудим их в ответе.`, `Answer a few questions and your answers will assemble into a request. Press “Send request” — it comes to me and I’ll get in touch. Price and timing are negotiable: we’ll discuss them in my reply.`, `Бірнеше сұраққа жауап беріңіз, жауаптарыңыздан өтінім жиналады. «Өтінімді жіберу» түймесін басыңыз — ол маған келеді, мен сізбен байланысамын. Баға мен мерзім келісімге байланысты: оны жауабымда талқылаймыз.`],
    [`Какой сайт нужен`, `What kind of site do you need`, `Қандай сайт керек`],
    [`Сайт компании`, `Company site`, `Компания сайты`],
    [`Одна страница`, `One page`, `Бір бет`],
    [`С 3D и анимацией`, `With 3D and animation`, `3D және анимациямен`],
    [`Чат-бот`, `Chatbot`, `Чат-бот`],
    [`Пока не знаю`, `Not sure yet`, `Әзірше білмеймін`],
    [`Какая работа ближе по духу`, `Which project is closest in spirit`, `Қай жұмыс рухына жақын`],
    [`Хочу по-другому`, `Something different`, `Басқаша қалаймын`],
    [`Чем вы занимаетесь`, `What do you do`, `Немен айналысасыз`],
    [`Например: кофейня в центре города, хотим показывать меню и принимать предзаказы`, `For example: a coffee shop downtown, we want to show our menu and take pre-orders`, `Мысалы: қала орталығындағы кофеханамыз, мәзірімізді көрсетіп, алдын ала тапсырыс қабылдағымыз келеді`],
    [`Когда нужен сайт`, `When do you need the site`, `Сайт қашан керек`],
    [`Как можно скорее`, `As soon as possible`, `Мүмкіндігінше тезірек`],
    [`В течение месяца`, `Within a month`, `Бір ай ішінде`],
    [`Не спешу`, `No rush`, `Асықпаймын`],
    [`Как вас зовут`, `What’s your name`, `Атыңыз кім`],
    [`Как с вами связаться`, `How can I reach you`, `Сізбен қалай байланысуға болады`],
    [`Телефон, Telegram или почта`, `Phone, Telegram or email`, `Телефон, Telegram немесе пошта`],
    [`Ваша заявка`, `Your request`, `Сіздің өтініміңіз`],
    [`Отправить заявку`, `Send request`, `Өтінімді жіберу`],
    [`Или отправьте этот текст сами:`, `Or send this text yourself:`, `Немесе осы мәтінді өзіңіз жіберіңіз:`],
    [`почтой`, `by email`, `поштамен`],
    [`в Telegram`, `on Telegram`, `Telegram-да`],
    [`в WhatsApp`, `on WhatsApp`, `WhatsApp-та`],
    [`скопировать текст`, `copy the text`, `мәтінді көшіру`],

    /* Ответы на вопросы заявки: показываются в тексте письма на языке посетителя,
       а в таблицу уходят русские значения как есть */
    [`сайт компании на несколько страниц`, `a company website with several pages`, `бірнеше беттен тұратын компания сайты`],
    [`одна страница под продукт или услугу`, `a one-page site for a product or service`, `өнімге немесе қызметке арналған бір беттік сайт`],
    [`сайт с 3D и анимацией по прокрутке`, `a website with 3D and scroll animation`, `3D және жылжытқанда жүретін анимациясы бар сайт`],
    [`чат-бот в мессенджере`, `a chatbot in a messenger`, `мессенджердегі чат-бот`],
    [`пока не знаю, нужен совет`, `not sure yet, I need advice`, `әзірше білмеймін, кеңес керек`],
    [`хочется чего-то другого`, `something different`, `басқа бір нәрсе`],
    [`как можно скорее`, `as soon as possible`, `мүмкіндігінше тезірек`],
    [`в течение месяца`, `within a month`, `бір ай ішінде`],
    [`не спешу`, `no rush`, `асықпаймын`],

    /* Сообщения формы и окон работ (создаются скриптами) */
    [`Отвечайте на вопросы — заявка будет дописываться сама.`, `Answer the questions — the request will write itself.`, `Сұрақтарға жауап беріңіз — өтінім өздігінен жазыла береді.`],
    [`Нужен сайт`, `I need a website`, `Маған сайт керек`],
    [`Напишите, как к вам обращаться.`, `Please tell me what to call you.`, `Сізге қалай жүгінуге болатынын жазыңыз.`],
    [`Оставьте телефон, Telegram или почту, чтобы я мог ответить.`, `Leave a phone number, Telegram or email so I can reply.`, `Жауап бере алуым үшін телефон, Telegram немесе пошта қалдырыңыз.`],
    [`Заполните имя и контакт — без них я не смогу ответить.`, `Fill in your name and contact — without them I can’t reply.`, `Аты-жөніңізді және байланыс деректеріңізді толтырыңыз — онсыз жауап бере алмаймын.`],
    [`Отправка заявок пока не подключена. Отправьте текст почтой или скопируйте его ниже.`, `Sending requests isn’t connected yet. Send the text by email or copy it below.`, `Өтінімдерді жіберу әлі қосылмаған. Мәтінді поштамен жіберіңіз немесе төменнен көшіріп алыңыз.`],
    [`Отправляю…`, `Sending…`, `Жіберілуде…`],
    [`Заявка отправлена. Я свяжусь с вами: {reach}.`, `Request sent. I’ll get in touch with you: {reach}.`, `Өтінім жіберілді. Сізбен байланысамын: {reach}.`],
    [`Заявка отправлена`, `Request sent`, `Өтінім жіберілді`],
    [`Не получилось отправить заявку. Проверьте интернет и попробуйте ещё раз — или отправьте текст сами, ссылки ниже.`, `Couldn’t send the request. Check your connection and try again — or send the text yourself, the links are below.`, `Өтінімді жіберу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз — немесе мәтінді өзіңіз жіберіңіз, сілтемелер төменде.`],
    [`Открывается ваша почта. Если ничего не произошло, скопируйте текст и отправьте на {email}.`, `Your email app is opening. If nothing happened, copy the text and send it to {email}.`, `Поштаңыз ашылуда. Егер ештеңе болмаса, мәтінді көшіріп, {email} мекенжайына жіберіңіз.`],
    [`Открывается ваша почта. Если ничего не произошло, скопируйте текст и отправьте мне.`, `Your email app is opening. If nothing happened, copy the text and send it to me.`, `Поштаңыз ашылуда. Егер ештеңе болмаса, мәтінді көшіріп, маған жіберіңіз.`],
    [`Текст скопирован. Вставьте его в письмо или сообщение на {email}.`, `Text copied. Paste it into an email or message to {email}.`, `Мәтін көшірілді. Оны {email} мекенжайына хатқа немесе хабарламаға қойыңыз.`],
    [`Текст скопирован. Вставьте его в письмо или сообщение.`, `Text copied. Paste it into an email or message.`, `Мәтін көшірілді. Оны хатқа немесе хабарламаға қойыңыз.`],
    [`Не получилось скопировать. Выделите текст заявки и скопируйте вручную.`, `Couldn’t copy. Select the request text and copy it manually.`, `Көшіру мүмкін болмады. Өтінім мәтінін белгілеп, қолмен көшіріңіз.`],
    [`Сайт включён: листайте и нажимайте прямо в окне. Уведите указатель, чтобы листать страницу дальше.`, `The site is on: scroll and click right in the window. Move the pointer away to keep scrolling the page.`, `Сайт қосулы: терезенің ішінде жылжытып, басып көріңіз. Бетті әрі қарай жылжыту үшін меңзерді алып кетіңіз.`],
    [`Продолжить`, `Resume`, `Жалғастыру`],
    [`Сайт на паузе. Нажмите на окно, чтобы продолжить.`, `The site is paused. Click the window to resume.`, `Сайт үзілісте. Жалғастыру үшін терезені басыңыз.`],
  ];

  const D = Object.create(null);
  T.forEach(([ru, en, kk]) => { D[ru] = [en, kk]; });

  /* t('русская фраза', { имя: значение }) — перевод для строк, которые создаёт скрипт */
  function t(s, vars) {
    const hit = D[s];
    let out = lang === 'ru' || !hit ? s : hit[col - 1];
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return out;
  }

  /* ---------- Подмена текста на странице ---------- */
  const ATTRS = ['alt', 'aria-label', 'placeholder', 'data-title', 'data-cursor', 'title'];
  // Эти места не переводятся: в них содержимое самих сайтов и демо-бот
  const SKIP = '#tg, .stack-box, .win__tab, .botdemo__sheet, .trap, [data-i18n-skip]';
  const CYR = /[А-Яа-яЁё]/;
  const missing = [];
  const swap = (s) => {
    const key = s.replace(/\s+/g, ' ').trim();
    const hit = D[key];
    if (!hit) { if (CYR.test(key) && !missing.includes(key)) missing.push(key); return s; }
    return s.match(/^\s*/)[0] + hit[col - 1] + s.match(/\s*$/)[0];
  };

  function apply() {
    if (lang !== 'ru') {
      document.title = swap(document.title);
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = swap(meta.content);

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
      nodes.forEach((n) => {
        const p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName) || !n.nodeValue.trim() || p.closest(SKIP)) return;
        n.nodeValue = swap(n.nodeValue);
      });
      document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
        if (el.closest(SKIP)) return;
        ATTRS.forEach((a) => { if (el.hasAttribute(a)) el.setAttribute(a, swap(el.getAttribute(a))); });
      });
    }
    // Работы открываются на том же языке, что и портфолио: сайты поддерживают ?lang=
    document.querySelectorAll('a[href*=".armanmansurovportfolio.website"]').forEach((a) => {
      try { const u = new URL(a.href); u.searchParams.set('lang', lang); a.href = u.toString(); } catch (e) { /* не ссылка */ }
    });
    root.classList.remove('i18n-pending');
  }

  /* Выбор языка: запоминаем и перезагружаем страницу — так анимации заново считают размеры под новый текст */
  function set(next) {
    if (!LANGS.includes(next) || next === lang) return;
    save(next);
    try {
      const u = new URL(location.href);
      if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); history.replaceState(null, '', u); }
    } catch (e) { /* старый браузер */ }
    location.reload();
  }

  root.lang = lang;
  if (lang !== 'ru') {
    root.classList.add('i18n-pending'); // пока текст не подменён, страница скрыта: русский не мелькнёт
    setTimeout(() => root.classList.remove('i18n-pending'), 3000); // на случай, если подмена не дойдёт
  }

  // Адрес сайта работы с языком портфолио (для окон с живыми сайтами)
  function withLang(url) {
    try { const u = new URL(url, location.href); u.searchParams.set('lang', lang); return u.toString(); } catch (e) { return url; }
  }

  window.I18N = { lang, LANGS, t, apply, set, missing, withLang };
})();
