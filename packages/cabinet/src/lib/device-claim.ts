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

export function readClaim(): string | null {
	try {
		return localStorage.getItem(KEY)
	} catch {
		return null
	}
}

export function saveClaim(token: string): void {
	try {
		localStorage.setItem(KEY, token)
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
