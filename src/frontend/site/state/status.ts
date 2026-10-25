import { atom } from '#frontend/lib/atom.ts'
import { fetchStatus } from '#frontend/site/api/client.ts'
import type { StatusPayload } from '#frontend/site/api/schemas.ts'

export const status = atom<StatusPayload | null>(null)
export const statusError = atom(false)

export async function loadStatus() {
	try {
		status.set(await fetchStatus())
		statusError.set(false)
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
