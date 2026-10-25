const KEY = 'ref:v1'
const VISITOR_KEY = 'ref:visitor:v1'

/** Формат кода — тот же, что валидирует бот (см. REFERRAL_CODE_RE в packages/bot). */
const REF_RE = /^[A-Za-z0-9_-]{4,16}$/

/**
 * Снять реферальный код из ?ref= и запомнить в sessionStorage: человек приходит по ссылке
 * на главную, а код нужен позже, на /get в момент запроса bridge. sessionStorage
 * переживает переходы и перезагрузку, но не выходит за пределы визита. Любая ошибка
 * (приватный режим) — код просто не сохранится.
 *
 * Возвращает код, снятый именно из URL (null — ссылки с ?ref= в этой загрузке не было):
 * по нему решается, слать ли пинг о переходе.
 */
export function captureRef(search: string, storage: Storage = sessionStorage): string | null {
	const ref = new URLSearchParams(search).get('ref')

	if (!ref || !REF_RE.test(ref)) return null

	try {
		storage.setItem(KEY, ref)
	} catch {
		// приватный режим — storage недоступен, но переход всё равно засчитаем
	}

	return ref
}

/**
 * Стабильный ключ посетителя для учёта переходов по реф-ссылке: бэкенд схлопывает по нему
 * перезагрузки и повторные визиты (UNIQUE в referral_clicks). Живёт в localStorage, не привязан
 * к конкретному рефереру. null — storage недоступен (приватный режим): тогда переход
 * просто не считается.
 */
export function getVisitorKey(storage: Storage = localStorage): string | null {
	try {
		const existing = storage.getItem(VISITOR_KEY)

		if (existing) return existing

		const key = crypto.randomUUID()

		storage.setItem(VISITOR_KEY, key)

		return key
	} catch {
		return null
	}
}

export function getStoredRef(storage: Storage = sessionStorage): string | null {
	try {
		const ref = storage.getItem(KEY)

		return ref && REF_RE.test(ref) ? ref : null
	} catch {
		return null
	}
}
