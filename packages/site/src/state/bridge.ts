import { action, atom, wrap } from '@reatom/core'
import { createBridge } from '@/api/client.ts'
import type { BridgeResult } from '@/api/schemas.ts'
import { clearStoredBridge, persistBridge, readStoredBridge } from './bridge-storage.ts'
import { getStoredRef } from './ref.ts'

// Стартуем с восстановленного из localStorage bridge (если не истёк):
// повторный визит показывает выданную ссылку вместо создания нового клиента.
export const bridgeAtom = atom<BridgeResult | null>(readStoredBridge(), 'bridge')
export const bridgeBusyAtom = atom<boolean>(false, 'bridgeBusy')
export const bridgeErrorAtom = atom<string | null>(null, 'bridgeError')

export const requestBridge = action(async () => {
	bridgeBusyAtom.set(true)
	bridgeErrorAtom.set(null)
	try {
		const res = await wrap(createBridge(getStoredRef()))
		bridgeAtom.set(res)
		persistBridge(res)
	} catch (e) {
		bridgeErrorAtom.set(e instanceof Error ? e.message : 'error')
	} finally {
		bridgeBusyAtom.set(false)
	}
}, 'requestBridge')

/**
 * Ссылка-подписка для текущего домена. Если сайт открыт с домена-зеркала (host совпал с хостом
 * backup-ссылки) — отдаём backup, чтобы клиент получил ссылку на достижимом домене; иначе основную.
 * Домены не хардкодятся — сравнивается хост самой backup-ссылки, пришедшей с бэкенда.
 */
export function pickSubscriptionUrl(bridge: BridgeResult, hostname: string): string {
	const backup = bridge.subscriptionUrlBackup
	if (backup) {
		try {
			if (new URL(backup).hostname === hostname) return backup
		} catch {
			/* невалидный URL — падаем на основную */
		}
	}
	return bridge.subscriptionUrl
}

/** Сброс истёкшего bridge: панель возвращается к кнопке получения доступа. */
export const expireBridge = action(() => {
	bridgeAtom.set(null)
	clearStoredBridge()
}, 'expireBridge')
