import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { MemoryStorage } from '#frontend/lib/memory-storage.ts'

import { readClaim, saveClaim, withClaim } from './device-claim.ts'

describe('withClaim', () => {
	test('добавляет токен параметром d', () => {
		assert.equal(withClaim('https://sub.example/s/abc', 'f00d'), 'https://sub.example/s/abc?d=f00d')
	})

	test('без токена ссылка не меняется', () => {
		assert.equal(withClaim('https://sub.example/s/abc', null), 'https://sub.example/s/abc')
	})

	test('битую ссылку отдаёт как есть', () => {
		assert.equal(withClaim('not a url', 'f00d'), 'not a url')
	})
})

describe('readClaim / saveClaim', () => {
	test('токен переживает перезапуск через хранилище', () => {
		const storage = new MemoryStorage()

		assert.equal(readClaim(storage), null)
		saveClaim('f00d', storage)
		assert.equal(readClaim(storage), 'f00d')
	})

	test('без хранилища метки нет, и ничего не падает', () => {
		assert.equal(readClaim(null), null)
		assert.doesNotThrow(() => saveClaim('f00d', null))
	})

	test('хранилище, которое бросает, не роняет кабинет', () => {
		const broken = new MemoryStorage()

		broken.getItem = () => {
			throw new Error('SecurityError')
		}

		broken.setItem = broken.getItem

		assert.equal(readClaim(broken), null)
		assert.doesNotThrow(() => saveClaim('f00d', broken))
	})
})
