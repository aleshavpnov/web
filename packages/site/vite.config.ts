import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	resolve: { alias: { '@': path.resolve(rootDir, './src') } },
	plugins: [react(), tailwindcss()],
	server: { host: true },
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
	},
})
