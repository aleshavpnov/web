# Alesha Vpnov — web

Фронтовая часть сервиса [Alesha Vpnov](https://durov.aimuzov.online): публичный сайт, личный
кабинет (Telegram Mini App) и общие компоненты. Бот, API и инфраструктура живут в приватном
репозитории; этот собирается и раздаётся оттуда как статика.

| Пакет                                         | Что это                                                 |
| --------------------------------------------- | ------------------------------------------------------- |
| [`packages/site`](packages/site/README.ru.md) | Лендинг и статус сервиса, страница выдачи доступа (`/`) |
| `packages/account`                            | Кабинет пользователя, Telegram Mini App (`/me/`)        |
| `packages/shared-ui`                          | Общая инструкция подключения и кости скелетонов         |

Стек: Vite, React 19, Reatom, Tailwind 4, TypeScript. Версии зависимостей закреплены точно.

## Разработка

```bash
npm install
npm run dev -w @aleshavpnov/site        # http://localhost:5173
npm run dev -w @aleshavpnov/account     # кабинет, требует initData Telegram
npm run build                           # site + account → packages/*/dist
npm run typecheck && npm test && npm run lint
```

API берётся с того же origin; для локальной разработки против боевого бэкенда задайте
`VITE_API_BASE` (см. README пакета `site`).

Только npm: `package-lock.json` один, в корне. Коммиты — conventional commits, по-английски
(`npm run commit`).

## Лицензия

MIT, см. [LICENSE](LICENSE).
