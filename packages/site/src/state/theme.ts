import { action, atom } from '@reatom/core'

export type ThemeMode = 'system' | 'light' | 'dark'

const KEY = 'aleshavpnov.theme'

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

/** Applies the theme to <html>: toggles `.dark` class (respects system preference). */
export function applyTheme(mode: ThemeMode = themeAtom()): void {
	document.documentElement.classList.toggle('dark', resolveDark(mode))
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
