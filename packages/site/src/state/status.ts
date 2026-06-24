import { action, atom, wrap } from '@reatom/core'
import { fetchStatus } from '@/api/client.ts'
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
