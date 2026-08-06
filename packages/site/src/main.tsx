import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import { App } from './App.tsx'
import { reportRefHit } from './api/client.ts'
import { captureRef, getVisitorKey } from './state/ref.ts'
import { applyTheme } from './state/theme.ts'
import './index.css'

// Apply saved theme before first render to avoid flash.
applyTheme()
// Запомнить ?ref= до первой навигации — роутер теряет query string.
const ref = captureRef()
// Отметить переход у реферера. Только при заходе именно по ссылке (код из URL,
// не из sessionStorage) и не блокируя рендер.
if (ref) void reportRefHit(ref, getVisitorKey())

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
