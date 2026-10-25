# Alesha Vpnov — web

Фронтовая часть сервиса [Alesha Vpnov](https://aleshavpnov.ru): публичный сайт и личный кабинет
(Telegram Mini App на `/me/`). Бот, API и инфраструктура живут в приватном репозитории; этот
подключён туда сабмодулем, собирается и раздаётся оттуда как статика.

Стек тот же, что у остальных сайтов из
[infra-site-template](https://github.com/aimuzov/infra-site-template): Astro, Svelte 5, CSS по БЭМ,
общие конфиги, проверки и компоненты из
[infra-site-kit](https://github.com/aimuzov/infra-site-kit).

> Идёт переезд с Vite + React. Публичный сайт уже на Astro,
> кабинет переносится следующим PR, до этого прод собирается
> из закреплённого в core коммита со старыми пакетами.

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

Только npm. Коммиты — conventional commits, по-английски (`npm run commit`).

## Лицензия

MIT, см. [LICENSE](LICENSE).
