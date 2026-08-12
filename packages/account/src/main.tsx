import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'

import { App } from './App.tsx'
import { colorScheme, initMiniApp } from './lib/telegram.ts'
import './index.css'

// Тема до первого рендера — иначе светлая вспышка в тёмном вебвью.
document.documentElement.classList.toggle('dark', colorScheme() === 'dark')
initMiniApp()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
