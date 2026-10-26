import { atom } from '#frontend/lib/atom.ts'
import { fetchStatus } from '#frontend/site/api/client.ts'
import type { StatusPayload } from '#frontend/site/api/schemas.ts'

export const status = atom<StatusPayload | null>(null)
export const statusError = atom(false)

const NODES_KEY = 'status:nodes:v1'
/** Серверов сейчас столько; меняется редко, и следующий визит подхватит новое число сам. */
const DEFAULT_NODES = 6

/**
 * Сколько строк серверов рисовать в заготовке, пока статус грузится: столько, сколько их было
 * в прошлый раз. Тогда карточка не меняет высоту, когда приходят настоящие данные.
 */
export function expectedNodes(storage: Storage = localStorage): number {
	try {
		const n = Number(storage.getItem(NODES_KEY))

		return Number.isInteger(n) && n > 0 && n <= 50 ? n : DEFAULT_NODES
	} catch {
		return DEFAULT_NODES
	}
}

export function rememberNodes(count: number, storage: Storage = localStorage) {
	try {
		storage.setItem(NODES_KEY, String(count))
	} catch {
		// приватный режим — заготовка останется на числе по умолчанию
	}
}

export async function loadStatus() {
	try {
		const payload = await fetchStatus()

		status.set(payload)
		statusError.set(false)
		rememberNodes(payload.nodes.length)
	} catch {
		statusError.set(true)
	}
}

/** Статус нужен почти каждой странице (username бота, метрики), грузим его один раз за визит. */
let started = false

export function ensureStatus() {
	if (started) return

	started = true
	void loadStatus()
}
