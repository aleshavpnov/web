import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// На проде `/api` и `/status.json` отдаёт бот за Caddy в core, локально его роль играет прокси Vite.
const bot = process.env.VITE_BOT_ORIGIN ?? 'http://127.0.0.1:8443'
const proxy = {
	'/api': { target: bot, changeOrigin: true, secure: false },
	'/status.json': { target: bot, changeOrigin: true, secure: false },
}

export default defineConfig({
	// Сайт и кабинет живут в `src/frontend`, общая с ними чистая логика -- в `src/shared`.
	srcDir: './src/frontend',
	// Абсолютные URL в sitemap. Индексацию всё равно закрывают noindex и robots.txt в Caddy.
	site: 'https://durov.aimuzov.online',
	// CSS немного, и встроенный в HTML он не блокирует первую отрисовку отдельным запросом.
	build: { inlineStylesheets: 'always' },
	// Кабинет за авторизацией Telegram, в sitemap ему нечего делать.
	integrations: [svelte(), sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/me/') })],
	server: { host: true },
	vite: { server: { proxy }, preview: { proxy } },
	// Подсветка Shiki несовместима с CSP.
	markdown: { syntaxHighlight: false },
	// Astro кладёт в `<meta>` страницы CSP с хешами своих скриптов и стилей.
	// QR рисуется в data:, мелкие файлы шрифта Vite встраивает в data:.
	// `frame-ancestors` в `<meta>` не работает.
	security: {
		csp: {
			scriptDirective: { resources: ["'self'"] },
			directives: [
				"default-src 'self'",
				"img-src 'self' data: blob:",
				"font-src 'self' data:",
				"connect-src 'self'",
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'self'",
			],
		},
	},
})
