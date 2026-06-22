import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import { App } from './App.tsx'
import { applyTheme } from './state/theme.ts'
import './index.css'

// Apply saved theme before first render to avoid flash.
applyTheme()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
