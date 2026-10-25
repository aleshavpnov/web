import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'

import { MemoryStorage } from '#frontend/lib/memory-storage.ts'
import type { BridgeResult } from '#frontend/site/api/schemas.ts'

import { clearStoredBridge, persistBridge, readStoredBridge } from './bridge-storage.ts'

const NOW = Date.parse('2026-07-14T12:00:00Z')

function bridge(expiresAt: string): BridgeResult {
	return {
		subscriptionUrl: 'https://vpn.example/s/abc123',
		deepLink: 'https://t.me/examplebot?start=c_tok',
		expiresAt,
	}
}

describe('bridge storage', () => {
	let storage: MemoryStorage

	beforeEach(() => {
		storage = new MemoryStorage()
	})

	test('восстанавливает живой bridge', () => {
		persistBridge(bridge('2026-07-14T15:00:00Z'), storage)
		assert.deepEqual(readStoredBridge(NOW, storage), bridge('2026-07-14T15:00:00Z'))
	})

	test('чистит истёкший bridge', () => {
		persistBridge(bridge('2026-07-14T11:00:00Z'), storage)
		assert.equal(readStoredBridge(NOW, storage), null)
		assert.equal(storage.getItem('bridge:v1'), null)
	})

	test('переживает битый JSON и чистит его', () => {
		storage.setItem('bridge:v1', '{oops')
		assert.equal(readStoredBridge(NOW, storage), null)
		assert.equal(storage.getItem('bridge:v1'), null)
	})

	test('чистит запись не по схеме', () => {
		storage.setItem('bridge:v1', JSON.stringify({ foo: 1 }))
		assert.equal(readStoredBridge(NOW, storage), null)
		assert.equal(storage.getItem('bridge:v1'), null)
	})

	test('чистит запись с невалидной датой', () => {
		persistBridge(bridge('not-a-date'), storage)
		assert.equal(readStoredBridge(NOW, storage), null)
		assert.equal(storage.getItem('bridge:v1'), null)
	})

	test('clearStoredBridge удаляет запись', () => {
		persistBridge(bridge('2026-07-14T15:00:00Z'), storage)
		clearStoredBridge(storage)
		assert.equal(readStoredBridge(NOW, storage), null)
	})
})
