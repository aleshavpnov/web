import { atom } from '#frontend/lib/atom.ts'
import { createBridge } from '#frontend/site/api/client.ts'
import type { BridgeResult } from '#frontend/site/api/schemas.ts'

import { clearStoredBridge, persistBridge, readStoredBridge } from './bridge-storage.ts'
import { getStoredRef } from './ref.ts'

/** Выданный bridge. Повторный визит показывает прежнюю ссылку вместо создания нового клиента. */
export const bridge = atom<BridgeResult | null>(null)
export const bridgeBusy = atom(false)
export const bridgeError = atom<string | null>(null)

/** Поднять bridge из localStorage, если он ещё не истёк. */
export function restoreBridge() {
	bridge.set(readStoredBridge())
}

export async function requestBridge() {
	bridgeBusy.set(true)
	bridgeError.set(null)

	try {
		const res = await createBridge(getStoredRef())

		bridge.set(res)
		persistBridge(res)
	} catch (e) {
		bridgeError.set(e instanceof Error ? e.message : 'error')
	} finally {
		bridgeBusy.set(false)
	}
}

/**
 * Ссылка-подписка для текущего домена. Если сайт открыт с домена-зеркала (host совпал с хостом
 * backup-ссылки) — отдаём backup, чтобы клиент получил ссылку на достижимом домене; иначе основную.
 * Домены не хардкодятся — сравнивается хост самой backup-ссылки, пришедшей с бэкенда.
 */
export function pickSubscriptionUrl(result: BridgeResult, hostname: string): string {
	const backup = result.subscriptionUrlBackup

	if (backup) {
		try {
			if (new URL(backup).hostname === hostname) return backup
		} catch {
			// невалидный URL — падаем на основную
		}
	}

	return result.subscriptionUrl
}

/** Сброс истёкшего bridge: панель возвращается к кнопке получения доступа. */
export function expireBridge(storage?: Storage) {
	bridge.set(null)
	clearStoredBridge(storage)
}
