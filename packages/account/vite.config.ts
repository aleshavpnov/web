import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	// Кабинет раздаётся из-под /me/ на том же домене (см. deploy/timeweb/Caddyfile).
	base: '/me/',
	resolve: {
		alias: {
			'@': path.resolve(rootDir, './src'),
			// Инструкция подключения общая с лендингом (packages/shared-ui) — подключается
			// исходниками: отдельного шага сборки у пакета нет, транспилирует потребитель.
			'@shared': path.resolve(rootDir, '../shared-ui/src'),
		},
	},
	plugins: [react(), tailwindcss()],
	server: {
		host: true,
		// В деве фронт и бот на разных портах: проксируем API, чтобы обойтись без CORS.
		// VITE_BOT_ORIGIN переопределяет цель, если бот поднят не на 8443.
		proxy: {
			'/api': {
				target: process.env.VITE_BOT_ORIGIN ?? 'http://127.0.0.1:8443',
				changeOrigin: true,
				secure: false,
			},
		},
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
	},
})
