import { action, atom, wrap } from '@reatom/core'
import { checkNodes, fetchStatus } from '@/api/client.ts'
import type { StatusPayload } from '@/api/schemas.ts'

export const statusAtom = atom<StatusPayload | null>(null, 'status')
export const statusErrorAtom = atom<boolean>(false, 'statusError')

export const loadStatus = action(async () => {
	try {
		statusAtom.set(await wrap(fetchStatus()))
		statusErrorAtom.set(false)
	} catch {
		statusErrorAtom.set(true)
	}
}, 'loadStatus')

export type LivePhase = 'idle' | 'checking' | 'up' | 'down'
export interface LiveState {
	phase: LivePhase
	latencyMs: number | null
}

/**
 * Карта name → состояние живой проверки доступности ноды. Перезаписывается целиком
 * (immutable replace) — Reatom сравнивает значение по ссылке, мутация не перерисует.
 */
export const liveChecksAtom = atom<Record<string, LiveState>>({}, 'liveChecks')

/**
 * Живая проверка всех нод: переводит каждую в 'checking', дёргает GET /api/check и
 * раскладывает результаты. При сетевой ошибке — все ноды в 'down'. Список нод берёт
 * из statusAtom. Возвращает результаты (для точечного toast) либо null при ошибке.
 */
export const runLiveCheck = action(async () => {
	const nodes = statusAtom()?.nodes ?? []
	if (nodes.length === 0) return null

	const checking: Record<string, LiveState> = {}
	for (const n of nodes) {
		checking[n.name] = { phase: 'checking', latencyMs: liveChecksAtom()[n.name]?.latencyMs ?? null }
	}
	liveChecksAtom.set(checking)

	try {
		const { results } = await wrap(checkNodes())
		const next: Record<string, LiveState> = {}
		for (const r of results) {
			next[r.name] = { phase: r.up ? 'up' : 'down', latencyMs: r.up ? r.latencyMs : null }
		}
		liveChecksAtom.set(next)
		return results
	} catch {
		const failed: Record<string, LiveState> = {}
		for (const n of nodes) failed[n.name] = { phase: 'down', latencyMs: null }
		liveChecksAtom.set(failed)
		return null
	}
}, 'runLiveCheck')
