/**
 * Метка «это устройство».
 *
 * Кабинет живёт в Telegram и не знает, какой hwid у приложения на этом же телефоне. Поэтому
 * в ссылку, которую копируют отсюда, добавляется токен `?d=`: первое устройство, которое
 * заберёт по ней подписку, бот привязывает к токену. Сам токен лежит здесь же, в хранилище
 * вебвью, и уходит заголовком с каждым запросом — по нему бот отмечает своё устройство
 * в списке.
 *
 * Хранилище может быть недоступно (приватный режим, очищенные данные) — тогда метки просто
 * нет, и всё остальное работает как раньше.
 */
const KEY = 'aleshavpnov.deviceClaim'

/** `localStorage`, если он есть и доступен: обращение к нему само по себе может бросить. */
function defaultStorage(): Storage | null {
	try {
		return globalThis.localStorage ?? null
	} catch {
		return null
	}
}

export function readClaim(storage: Storage | null = defaultStorage()): string | null {
	try {
		return storage?.getItem(KEY) ?? null
	} catch {
		return null
	}
}

export function saveClaim(token: string, storage: Storage | null = defaultStorage()): void {
	try {
		storage?.setItem(KEY, token)
	} catch {
		// Без хранилища метка не переживёт перезапуск — не страшно.
	}
}

/** Ссылка-подписка с токеном метки. Без токена — как есть. */
export function withClaim(url: string, token: string | null): string {
	if (!token) return url

	try {
		const u = new URL(url)

		u.searchParams.set('d', token)

		return u.toString()
	} catch {
		return url
	}
}
