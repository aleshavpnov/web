import { describe, expect, it } from 'vitest'
import type { BridgeResult } from '@/api/schemas.ts'
import { bridgeAtom, expireBridge } from './bridge.ts'
import { persistBridge } from './bridge-storage.ts'

const sample: BridgeResult = {
	subscriptionUrl: 'https://vpn.example/s/abc123',
	deepLink: 'https://t.me/examplebot?start=c_tok',
	expiresAt: '2100-01-01T00:00:00Z',
}

describe('bridge state', () => {
	it('expireBridge сбрасывает атом и чистит localStorage', () => {
		persistBridge(sample)
		bridgeAtom.set(sample)

		expireBridge()

		expect(bridgeAtom()).toBeNull()
		expect(localStorage.getItem('bridge:v1')).toBeNull()
	})
})
