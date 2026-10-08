import { describe, expect, it } from 'vitest'

import { withClaim } from './device-claim.ts'

describe('withClaim', () => {
	it('добавляет токен параметром d', () => {
		expect(withClaim('https://sub.example/s/abc', 'f00d')).toBe('https://sub.example/s/abc?d=f00d')
	})

	it('без токена ссылка не меняется', () => {
		expect(withClaim('https://sub.example/s/abc', null)).toBe('https://sub.example/s/abc')
	})

	it('битую ссылку отдаёт как есть', () => {
		expect(withClaim('not a url', 'f00d')).toBe('not a url')
	})
})
