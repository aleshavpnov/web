import { describe, expect, it } from 'vitest'
import type { BridgeResult } from '@/api/schemas.ts'
import { bridgeAtom, expireBridge, pickSubscriptionUrl } from './bridge.ts'
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

describe('pickSubscriptionUrl', () => {
	const withBackup: BridgeResult = {
		...sample,
		subscriptionUrlBackup: 'https://mirror.example/s/abc123',
	}

	it('host совпал с хостом backup → отдаёт backup', () => {
		expect(pickSubscriptionUrl(withBackup, 'mirror.example')).toBe(withBackup.subscriptionUrlBackup)
	})

	it('host совпал с основным доменом → отдаёт основную', () => {
		expect(pickSubscriptionUrl(withBackup, 'vpn.example')).toBe(sample.subscriptionUrl)
	})

	it('backup отсутствует → отдаёт основную', () => {
		expect(pickSubscriptionUrl(sample, 'mirror.example')).toBe(sample.subscriptionUrl)
	})

	it('битый backup URL → отдаёт основную', () => {
		const broken: BridgeResult = { ...sample, subscriptionUrlBackup: 'not a url' }
		expect(pickSubscriptionUrl(broken, 'mirror.example')).toBe(sample.subscriptionUrl)
	})
})
