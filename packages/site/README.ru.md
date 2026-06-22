# @aleshavpnov/web — публичный сайт SPA

Часть монорепо **aleshavpnov** ([`github.com/aimuzov/aleshavpnov`](https://github.com/aimuzov/aleshavpnov)).
Английский гайд — [README.md](README.md).
Документация на бот, который раздаёт этот SPA в продакшне — [`../bot/README.ru.md`](../bot/README.ru.md).

Публичный сайт VPN-сервиса **Alesha Vpnov**. Технo-минималистичный SPA с тремя экранами:
главная (`/`), страница подключения (`/get`) и живой статус (`/status`).

**Стек:** Vite 8 + React 19 + Reatom 1001 + Tailwind 4 + shadcn/ui. TypeScript везде.
Общается с ботом только через JSON API (fetch + zod-схемы). Тема следует системным настройкам ОС,
переключатель в шапке (через `next-themes`).

## Структура

```
packages/web/
  src/
    main.tsx              # React root, Reatom ctx, ThemeProvider
    App.tsx               # переключатель экранов (reatomComponent)
    index.css             # Tailwind base + CSS-переменные
    api/
      client.ts           # fetch-хелперы (префикс VITE_API_BASE)
      schemas.ts          # zod-схемы для /status.json, /api/nonce, /api/bridge
    state/
      screen.ts           # screenAtom + navigate action (маршрутизация по pathname, без роутер-библиотеки)
      status.ts           # statusAtom — данные из GET /status.json
      bridge.ts           # bridgeAtom — поток POST /api/bridge
      theme.ts            # themeAtom (light/dark/system)
    lib/
      screen.ts           # тип Screen, хелперы screenFromPath / pathFromScreen
      utils.ts            # cn() (clsx + tailwind-merge)
    ui/
      screens/
        Home.tsx          # / — лендинг, CTA на /get и /status
        Access.tsx        # /get — форма временного бридж-доступа
        Status.tsx        # /status — статус в реальном времени, список инцидентов
      components/
        Layout.tsx        # обёртка с ограничением ширины для мобильных
        Topbar.tsx        # навигация + переключатель темы
    components/ui/        # shadcn-примитивы (Button, Card, Badge, Tabs, Sonner, Separator)
    vite-env.d.ts
```

Маршрутизация на основе pathname: `screenAtom` инициализируется из `window.location.pathname`,
`navigate()` вызывает `history.pushState`. Зависимость от react-router отсутствует.

## Разработка / сборка / тесты

Все команды запускаются из **корня репо**:

```bash
# dev-сервер (http://localhost:5173)
npm run dev -w @aleshavpnov/web

# production-сборка → packages/web/dist
npm run build -w @aleshavpnov/web

# только проверка типов (без emit)
npm run typecheck -w @aleshavpnov/web

# unit-тесты (vitest + jsdom)
npm test -w @aleshavpnov/web

# e2e-тесты (Playwright)
npm run test:e2e -w @aleshavpnov/web
```

### `VITE_API_BASE`

API-клиент добавляет `VITE_API_BASE` как префикс ко всем запросам (по умолчанию пустая строка =
тот же origin). Для локальной разработки с отдельно запущенным ботом задайте в `.env` или inline:

```bash
VITE_API_BASE=https://durov.aimuzov.online:8443 npm run dev -w @aleshavpnov/web
```

## Продакшн

В продакшне бот (`@aleshavpnov/bot`) раздаёт `packages/web/dist` через `@fastify/static`.
Многоэтапный Docker-билд (`packages/bot/Dockerfile`, контекст = корень репо) сначала собирает
веб-пакет, затем пакет бота; runtime-образ запускает процесс бота.

Для будущего статического сплита (например, Timeweb CDN) `dist/` можно раздавать nginx как
обычную статику — сайт полностью клиентский, SSR нет.

## Ключевые зависимости (точные версии, без `^`/`~`)

| Пакет             | Версия   | Роль                       |
| ----------------- | -------- | -------------------------- |
| react / react-dom | 19.2.7   | UI-рантайм                 |
| @reatom/core      | 1001.1.0 | управление состоянием      |
| @reatom/react     | 1001.0.0 | React-биндинги             |
| vite              | 8.0.16   | сборщик / dev-сервер       |
| tailwindcss       | 4.3.1    | стилизация                 |
| @tailwindcss/vite | 4.3.1    | Vite-плагин для Tailwind 4 |
| next-themes       | 0.4.6    | тема по ОС + переключатель |
| zod               | 3.25.76  | валидация API-ответов      |
| lucide-react      | 1.20.0   | иконки                     |
| sonner            | 2.0.7    | toast-уведомления          |
