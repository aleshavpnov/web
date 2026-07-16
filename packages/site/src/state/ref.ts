const KEY = 'ref:v1'

/** Формат кода — тот же, что валидирует бот (см. REFERRAL_CODE_RE в packages/bot). */
const REF_RE = /^[A-Za-z0-9_-]{4,16}$/

/**
 * Снять реферальный код из ?ref= и запомнить в sessionStorage: роутер (pushState
 * в state/screen.ts) теряет query при переходе Home → /get, а код нужен позже —
 * в момент запроса bridge. sessionStorage переживает перезагрузку, но не выходит
 * за пределы визита. Любая ошибка (приватный режим) — код просто не сохранится.
 */
export function captureRef(): void {
	try {
		const ref = new URLSearchParams(window.location.search).get('ref')
		if (ref && REF_RE.test(ref)) sessionStorage.setItem(KEY, ref)
	} catch {
		// приватный режим — storage недоступен
	}
}

export function getStoredRef(): string | null {
	try {
		const ref = sessionStorage.getItem(KEY)
		return ref && REF_RE.test(ref) ? ref : null
	} catch {
		return null
	}
}
