import { beforeEach, describe, expect, it } from 'vitest'
import type { BridgeResult } from '@/api/schemas.ts'
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
	beforeEach(() => localStorage.clear())

	it('восстанавливает живой bridge', () => {
		persistBridge(bridge('2026-07-14T15:00:00Z'))
		expect(readStoredBridge(NOW)).toEqual(bridge('2026-07-14T15:00:00Z'))
	})

	it('чистит истёкший bridge', () => {
		persistBridge(bridge('2026-07-14T11:00:00Z'))
		expect(readStoredBridge(NOW)).toBeNull()
		expect(localStorage.getItem('bridge:v1')).toBeNull()
	})

	it('переживает битый JSON и чистит его', () => {
		localStorage.setItem('bridge:v1', '{oops')
		expect(readStoredBridge(NOW)).toBeNull()
		expect(localStorage.getItem('bridge:v1')).toBeNull()
	})

	it('чистит запись не по схеме', () => {
		localStorage.setItem('bridge:v1', JSON.stringify({ foo: 1 }))
		expect(readStoredBridge(NOW)).toBeNull()
		expect(localStorage.getItem('bridge:v1')).toBeNull()
	})

	it('чистит запись с невалидной датой', () => {
		persistBridge(bridge('not-a-date'))
		expect(readStoredBridge(NOW)).toBeNull()
		expect(localStorage.getItem('bridge:v1')).toBeNull()
	})

	it('clearStoredBridge удаляет запись', () => {
		persistBridge(bridge('2026-07-14T15:00:00Z'))
		clearStoredBridge()
		expect(readStoredBridge(NOW)).toBeNull()
	})
})
