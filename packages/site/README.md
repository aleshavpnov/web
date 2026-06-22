# @aleshavpnov/web — public site SPA

Part of the **aleshavpnov** monorepo ([`github.com/aimuzov/aleshavpnov`](https://github.com/aimuzov/aleshavpnov)).
For the Russian guide see [README.ru.md](README.ru.md).
For the bot that serves this SPA in production see [`../bot/README.md`](../bot/README.md).

The public site for the **Alesha Vpnov** VPN service. A techno-minimal SPA with three screens:
home page (`/`), access / get-started page (`/get`), and a live status page (`/status`).

**Stack:** Vite 8 + React 19 + Reatom 1001 + Tailwind 4 + shadcn/ui. TypeScript throughout.
Communicates with the bot only via a JSON API (fetch + zod schemas). Theme follows the OS preference
with a header toggle (via `next-themes`).

## Structure

```
packages/web/
  src/
    main.tsx              # React root, Reatom ctx, ThemeProvider
    App.tsx               # screen switcher (reatomComponent)
    index.css             # Tailwind base + CSS variables
    api/
      client.ts           # fetch helpers (VITE_API_BASE prefix)
      schemas.ts          # zod schemas for /status.json, /api/nonce, /api/bridge
    state/
      screen.ts           # screenAtom + navigate action (pathname-based, no router lib)
      status.ts           # statusAtom — fetched from GET /status.json
      bridge.ts           # bridgeAtom — POST /api/bridge flow
      theme.ts            # themeAtom (light/dark/system)
    lib/
      screen.ts           # Screen type, screenFromPath / pathFromScreen helpers
      utils.ts            # cn() (clsx + tailwind-merge)
    ui/
      screens/
        Home.tsx          # / — landing, CTA to /get and /status
        Access.tsx        # /get — temporary bridge access form
        Status.tsx        # /status — live status, incident list
      components/
        Layout.tsx        # mobile-width wrapper, max-w constraint
        Topbar.tsx        # navigation + theme toggle
    components/ui/        # shadcn primitives (Button, Card, Badge, Tabs, Sonner, Separator)
    vite-env.d.ts
```

Navigation is pathname-driven: `screenAtom` is initialised from `window.location.pathname` and
`navigate()` calls `history.pushState`. No react-router dependency.

## Dev / build / test

All commands run from the **repo root**:

```bash
# dev server (http://localhost:5173)
npm run dev -w @aleshavpnov/web

# production build → packages/web/dist
npm run build -w @aleshavpnov/web

# type-check only (no emit)
npm run typecheck -w @aleshavpnov/web

# unit tests (vitest + jsdom)
npm test -w @aleshavpnov/web

# e2e tests (Playwright)
npm run test:e2e -w @aleshavpnov/web
```

### `VITE_API_BASE`

The API client prefixes all fetch calls with `VITE_API_BASE` (empty string by default = same origin).
For local dev with a separately running bot set it in `.env` or inline:

```bash
VITE_API_BASE=https://durov.aimuzov.online:8443 npm run dev -w @aleshavpnov/web
```

## Production

In production the bot (`@aleshavpnov/bot`) serves `packages/web/dist` via `@fastify/static`.
The Docker multi-stage build (`packages/bot/Dockerfile`, context = repo root) compiles the web
package first, then the bot package, and the runtime image runs the bot process.

For a future static-only split (e.g. Timeweb CDN), `dist/` can be served by nginx as a plain
static directory — the site is fully client-side, no SSR.

## Key dependencies (pinned, no `^`/`~`)

| Package           | Version  | Role                       |
| ----------------- | -------- | -------------------------- |
| react / react-dom | 19.2.7   | UI runtime                 |
| @reatom/core      | 1001.1.0 | state management           |
| @reatom/react     | 1001.0.0 | React bindings             |
| vite              | 8.0.16   | build tool / dev server    |
| tailwindcss       | 4.3.1    | styling                    |
| @tailwindcss/vite | 4.3.1    | Vite plugin for Tailwind 4 |
| next-themes       | 0.4.6    | OS-aware theme + toggle    |
| zod               | 3.25.76  | API response validation    |
| lucide-react      | 1.20.0   | icons                      |
| sonner            | 2.0.7    | toast notifications        |
