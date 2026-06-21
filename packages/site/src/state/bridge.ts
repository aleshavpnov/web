import { action, atom, wrap } from '@reatom/core'
import { createBridge } from '@/api/client.ts'
import type { BridgeResult } from '@/api/schemas.ts'

export const bridgeAtom = atom<BridgeResult | null>(null, 'bridge')
export const bridgeBusyAtom = atom<boolean>(false, 'bridgeBusy')
export const bridgeErrorAtom = atom<string | null>(null, 'bridgeError')

export const requestBridge = action(async () => {
	bridgeBusyAtom.set(true)
	bridgeErrorAtom.set(null)
	try {
		bridgeAtom.set(await wrap(createBridge()))
	} catch (e) {
		bridgeErrorAtom.set(e instanceof Error ? e.message : 'error')
	} finally {
		bridgeBusyAtom.set(false)
	}
}, 'requestBridge')
