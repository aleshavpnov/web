import { BridgeSchema, type BridgeResult } from '@/api/schemas.ts'

const KEY = 'bridge:v1'

/**
 * Снимок выданного bridge в localStorage: переживает перезагрузку страницы,
 * чтобы повторный визит не плодил новых клиентов в x-ui. Любая ошибка
 * (приватный режим, битый JSON, чужая схема) деградирует в null.
 */
export function readStoredBridge(now: number = Date.now()): BridgeResult | null {
	try {
		const raw = localStorage.getItem(KEY)
		if (!raw) return null
		const parsed = BridgeSchema.safeParse(JSON.parse(raw))
		if (!parsed.success) {
			localStorage.removeItem(KEY)
			return null
		}
		// NaN от Date.parse не проходит ни одно сравнение — мусорная дата иначе жила бы вечно
		const expires = Date.parse(parsed.data.expiresAt)
		if (Number.isNaN(expires) || expires <= now) {
			localStorage.removeItem(KEY)
			return null
		}
		return parsed.data
	} catch {
		try {
			localStorage.removeItem(KEY)
		} catch {
			// приватный режим — storage недоступен, удалять нечего
		}
		return null
	}
}

export function persistBridge(bridge: BridgeResult): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(bridge))
	} catch {
		// приватный режим — bridge просто не переживёт перезагрузку
	}
}

export function clearStoredBridge(): void {
	try {
		localStorage.removeItem(KEY)
	} catch {
		// приватный режим
	}
}
