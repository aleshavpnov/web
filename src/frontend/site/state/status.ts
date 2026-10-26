import { atom } from '#frontend/lib/atom.ts'
import { fetchStatus } from '#frontend/site/api/client.ts'
import type { StatusPayload } from '#frontend/site/api/schemas.ts'
import { groupOutages } from '#frontend/site/status-view.ts'

export const status = atom<StatusPayload | null>(null)
export const statusError = atom(false)

const NODES_KEY = 'status:nodes:v1'
const OUTAGES_KEY = 'status:outages:v1'
/** Серверов сейчас столько; меняется редко, и следующий визит подхватит новое число сам. */
const DEFAULT_NODES = 6

function readCount(key: string, fallback: number, min: number, storage: Storage): number {
	try {
		const raw = storage.getItem(key)
		const n = Number(raw)

		return raw !== null && raw !== '' && Number.isInteger(n) && n >= min && n <= 50 ? n : fallback
	} catch {
		return fallback
	}
}

function writeCount(key: string, n: number, storage: Storage) {
	try {
		storage.setItem(key, String(n))
	} catch {
		// приватный режим — заготовка останется на числе по умолчанию
	}
}

/**
 * Сколько строк серверов рисовать в заготовке, пока статус грузится: столько, сколько их было
 * в прошлый раз. Тогда карточка не меняет высоту, когда приходит настоящий статус.
 */
export function expectedNodes(storage: Storage = localStorage): number {
	return readCount(NODES_KEY, DEFAULT_NODES, 1, storage)
}

export function rememberNodes(count: number, storage: Storage = localStorage) {
	writeCount(NODES_KEY, count, storage)
}

/** То же для списка сбоев на /status: по умолчанию ноль, тогда в заготовке строка "сбоев не было". */
export function expectedOutages(storage: Storage = localStorage): number {
	return readCount(OUTAGES_KEY, 0, 0, storage)
}

export function rememberOutages(count: number, storage: Storage = localStorage) {
	writeCount(OUTAGES_KEY, count, storage)
}

export async function loadStatus() {
	try {
		const payload = await fetchStatus()

		status.set(payload)
		statusError.set(false)
		rememberNodes(payload.nodes.length)
		rememberOutages(groupOutages(payload.incidents).length)
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
