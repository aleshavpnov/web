import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { MemoryStorage } from '#frontend/lib/memory-storage.ts'
import type { BridgeResult } from '#frontend/site/api/schemas.ts'

import { persistBridge } from './bridge-storage.ts'
import { bridge, expireBridge, pickSubscriptionUrl } from './bridge.ts'

const sample: BridgeResult = {
	subscriptionUrl: 'https://vpn.example/s/abc123',
	deepLink: 'https://t.me/examplebot?start=c_tok',
	expiresAt: '2100-01-01T00:00:00Z',
}

describe('bridge state', () => {
	test('expireBridge сбрасывает атом и чистит localStorage', () => {
		const storage = new MemoryStorage()

		persistBridge(sample, storage)
		bridge.set(sample)

		expireBridge(storage)

		assert.equal(bridge(), null)
		assert.equal(storage.getItem('bridge:v1'), null)
	})
})

describe('pickSubscriptionUrl', () => {
	const withBackup: BridgeResult = { ...sample, subscriptionUrlBackup: 'https://mirror.example/s/abc123' }

	test('host совпал с хостом backup → отдаёт backup', () => {
		assert.equal(pickSubscriptionUrl(withBackup, 'mirror.example'), withBackup.subscriptionUrlBackup)
	})

	test('host совпал с основным доменом → отдаёт основную', () => {
		assert.equal(pickSubscriptionUrl(withBackup, 'vpn.example'), sample.subscriptionUrl)
	})

	test('backup отсутствует → отдаёт основную', () => {
		assert.equal(pickSubscriptionUrl(sample, 'mirror.example'), sample.subscriptionUrl)
	})

	test('битый backup URL → отдаёт основную', () => {
		assert.equal(
			pickSubscriptionUrl({ ...sample, subscriptionUrlBackup: 'not a url' }, 'mirror.example'),
			sample.subscriptionUrl,
		)
	})
})
