# Arman Mansurov — Portfolio

**English** · [Русский](README.ru.md)

**Live:** https://www.armanmansurovportfolio.website — in Russian, English and Kazakh (`RU / EN / KZ` switch in the header, or add `?lang=en` / `?lang=kk` to any link).

I build websites and Telegram bots for small businesses in Kazakhstan. Instead of showing screenshots, this portfolio lets you use the real sites: every project runs live inside the page, on desktop and phone sizes, with working forms and a working bot.

## The projects

| Project | Live | What it shows |
|---|---|---|
| **листва.** — autumn tours agency | https://listva.armanmansurovportfolio.website | Catalog with filters by region, type, month and budget; tour pages with day-by-day programs and price calculation; requests go to a Google Sheet and email |
| **Halden** — expedition agency | https://halden.armanmansurovportfolio.website | 13 pages, a morphing dropdown menu, a lead form, and a Telegram bot ([@halden_trips_bot](https://t.me/halden_trips_bot)) that collects requests and recommends an expedition through a short quiz |
| **Vela 14** — laptop presentation | https://vela.armanmansurovportfolio.website | A one-page product story: a 3D laptop, built in code from separate parts, comes apart layer by layer as you scroll |

The companies are concepts; the sites, forms and bot are real and working.

## How it is built

- **Plain HTML, CSS and JavaScript, no build step.** Scroll animation with GSAP ScrollTrigger and Lenis; the Vela 14 model with Three.js.
- **One domain, four sites.** The portfolio lives on `www.armanmansurovportfolio.website`; each project is its own Vercel project and repository, served from a subdomain of the same domain (`listva.`, `halden.`, `vela.`). The portfolio embeds them in live windows and links to them.
- **Three languages.** Every site has a small runtime dictionary (`assets/i18n.js`): the Russian text stays in the HTML and is the key, English and Kazakh translations are swapped in before animations measure the layout. The portfolio passes its language to the embedded sites through `?lang=`, so a visitor who picked Kazakh sees every project in Kazakh.
- **Leads without a backend.** Forms post to a Google Apps Script web app that writes a row to a Google Sheet and sends an email. Values sent to the sheet stay in Russian whatever language the visitor uses, so the owner's table stays consistent.
- **The Halden bot** runs as a Vercel serverless function behind a Telegram webhook, with Upstash Redis for unfinished requests and each client's language. It answers in the client's Telegram language (RU / EN / KZ, switchable with `/language`), while the manager always receives the request in Russian with the client's language noted.

## Built with Claude

The sites, the bot and their maintenance were done together with Claude (Claude Code) as a day-to-day pair programmer: building pages and animations, moving the projects from separate domains onto one domain with subdomains, adding the English and Kazakh versions to all four sites and the bot, finding layout bugs on phones, and debugging the bot's deployment on Vercel.

## Pages and files

| Path | What it is |
|---|---|
| `index.html` | Home: a scroll scene where the three sites scroll with the page; what I help with; a working demo of the Halden bot; a site taken apart into layers; how the work goes |
| `listva.html`, `halden.html`, `vela.html` | Case pages: the live site in a window (desktop and phone), and what was done in it |
| `contact.html` | A short brief: the answers turn into a ready message that is sent to a Google Sheet and Gmail |
| `assets/i18n.js` | Languages: dictionary and language choice |
| `assets/config.js` | Name, contacts and the address that receives leads |
| `assets/site.js`, `home.js`, `case.js`, `contact.js`, `botdemo.js` | Header and footer, home scene, live windows, brief form, bot demo |
| `google-apps-script/` | The script that receives leads (Google Sheet + email) |

## Run locally

```bash
npx http-server -p 5540 -c-1
```

Then open http://localhost:5540.

The source of the three projects and the bot lives in their own repositories.
