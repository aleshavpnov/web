import { action, atom } from '@reatom/core'

export type ThemeMode = 'system' | 'light' | 'dark'

// Нейтральный ключ (без бренда): попадает в голый инлайн-скрипт index.html, а «aleshavpnov»
// содержит подстроку «vpn» → палило бы фронт не-JS-сканеру. Зеркалится в index.html.
const KEY = 'app.theme'

function load(): ThemeMode {
	try {
		const v = localStorage.getItem(KEY)
		return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
	} catch {
		return 'system'
	}
}

export const themeAtom = atom<ThemeMode>(load(), 'theme')

const media =
	typeof window !== 'undefined' && typeof window.matchMedia === 'function'
		? window.matchMedia('(prefers-color-scheme: dark)')
		: null

function resolveDark(mode: ThemeMode): boolean {
	if (mode === 'dark') return true
	if (mode === 'light') return false
	return media?.matches ?? false
}

/**
 * Reactive resolved theme: reflects the actual light/dark in effect (not the mode).
 * Unlike `themeAtom`, this also flips when the OS scheme changes while on 'system'.
 */
export const isDarkAtom = atom<boolean>(resolveDark(load()), 'isDark')

/** Applies the theme to <html>: toggles `.dark` class (respects system preference). */
export function applyTheme(mode: ThemeMode = themeAtom()): void {
	const dark = resolveDark(mode)
	document.documentElement.classList.toggle('dark', dark)
	isDarkAtom.set(dark)
}

export const setTheme = action((mode: ThemeMode) => {
	themeAtom.set(mode)
	try {
		localStorage.setItem(KEY, mode)
	} catch {
		// private mode / no access — theme simply won't persist
	}
	applyTheme(mode)
}, 'setTheme')

// Re-apply when the OS color scheme changes and the user is on 'system' mode.
media?.addEventListener('change', () => {
	if (themeAtom() === 'system') applyTheme('system')
})
