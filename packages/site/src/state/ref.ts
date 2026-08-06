const KEY = 'ref:v1'
const VISITOR_KEY = 'ref:visitor:v1'

/** Формат кода — тот же, что валидирует бот (см. REFERRAL_CODE_RE в packages/bot). */
const REF_RE = /^[A-Za-z0-9_-]{4,16}$/

/**
 * Снять реферальный код из ?ref= и запомнить в sessionStorage: роутер (pushState
 * в state/screen.ts) теряет query при переходе Home → /get, а код нужен позже —
 * в момент запроса bridge. sessionStorage переживает перезагрузку, но не выходит
 * за пределы визита. Любая ошибка (приватный режим) — код просто не сохранится.
 *
 * Возвращает код, снятый именно из URL (null — ссылки с ?ref= в этой загрузке не
 * было): по нему main.tsx решает, слать ли пинг о переходе.
 */
export function captureRef(): string | null {
	let ref: string | null = null
	try {
		ref = new URLSearchParams(window.location.search).get('ref')
	} catch {
		return null
	}
	if (!ref || !REF_RE.test(ref)) return null
	try {
		sessionStorage.setItem(KEY, ref)
	} catch {
		// приватный режим — storage недоступен, но переход всё равно засчитаем
	}
	return ref
}

/**
 * Стабильный ключ посетителя для учёта переходов по реф-ссылке: бэкенд схлопывает
 * по нему перезагрузки и повторные визиты (UNIQUE в referral_clicks). Живёт в
 * localStorage, не привязан к конкретному рефереру. null — storage недоступен
 * (приватный режим): тогда переход просто не считается.
 */
export function getVisitorKey(): string | null {
	try {
		const existing = localStorage.getItem(VISITOR_KEY)
		if (existing) return existing
		const key = crypto.randomUUID()
		localStorage.setItem(VISITOR_KEY, key)
		return key
	} catch {
		return null
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
