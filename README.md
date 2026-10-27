# Alesha Vpnov — web

Фронтовая часть сервиса [Alesha Vpnov](https://aleshavpnov.ru): публичный сайт и личный кабинет
(Telegram Mini App на `/me/`). Бот, API и инфраструктура живут в приватном репозитории; этот
подключён туда сабмодулем, собирается и раздаётся оттуда как статика.

Стек тот же, что у остальных сайтов из
[infra-site-template](https://github.com/aimuzov/infra-site-template): Astro, Svelte 5, CSS по БЭМ,
общие конфиги, проверки и компоненты из
[infra-site-kit](https://github.com/aimuzov/infra-site-kit).

| Где                       | Что                                                          |
| ------------------------- | ------------------------------------------------------------ |
| `src/frontend/site`       | Сайт: главная, `/get`, `/status`, FAQ, документы, `/app/add` |
| `src/frontend/cabinet`    | Кабинет, одно Svelte-приложение на `/me/` с hash-роутингом   |
| `src/frontend/components` | Общее: шапка, подвал, инструкция подключения, тосты          |

Кабинет вне Telegram открывается с плашкой дев-обхода: боту нужен `CABINET_TMA_DEV_TGID`.

## Маскировка

Голая разметка обезличена: нейтральный `<title>Личный кабинет</title>`, `noindex`, ни бренда, ни
описания. Брендовый текст рисуют острова `client:only`, поэтому сканер без JS сервис не узнаёт.
e2e проверяет это для каждой страницы. Ключ темы в localStorage тоже без бренда: `app.theme`.

## Разработка

```bash
npm install
npm run dev            # http://localhost:4321, /api и /status.json проксируются на бота
npm run build          # → dist/
npm run format:check && npm run lint:js && npm run lint:css && npm run check && npm test
npm run test:e2e       # Playwright, headless
```

Бот для прокси берётся из `VITE_BOT_ORIGIN`, по умолчанию `http://127.0.0.1:8443`.

Ошибки браузера уходят в Sentry компонентом `sentry.astro` из infra-site-kit в общем layout.
Он включается переменной `PUBLIC_SENTRY_DSN` при сборке: её передаёт сборка образа в приватном
репозитории, локально без неё скрипта на странице нет. Бренда в разметке это не добавляет: в
`<meta name="sentry">` только DSN и релиз `web@<версия>`.

Только npm. Коммиты — conventional commits, по-английски (`npm run commit`).

## Релизы

Релизный PR держит release-please: версия в `package.json` и `CHANGELOG.md` по коммитам из
`main`. Мёрж этого PR ставит тег `vX.Y.Z`, и после проверок приватный репозиторий получает
событие `web-released` с тегом, дальше сборка и выкатка идут там. Ручной запуск Release
отправит событие ещё раз для любого тега. Для события нужен секрет `CORE_DISPATCH_TOKEN`:
fine-grained токен только на приватный репозиторий с правом `Contents: write`.

## Лицензия

MIT, см. [LICENSE](LICENSE).
