import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { MemoryStorage } from '#frontend/lib/memory-storage.ts'

import { expectedNodes, rememberNodes } from './status.ts'

describe('expectedNodes', () => {
	test('без истории — число серверов по умолчанию', () => {
		assert.equal(expectedNodes(new MemoryStorage()), 6)
	})

	test('берёт число из прошлого визита', () => {
		const storage = new MemoryStorage()

		rememberNodes(8, storage)
		assert.equal(expectedNodes(storage), 8)
	})

	test('мусор и нули в хранилище не ломают заготовку', () => {
		const storage = new MemoryStorage()

		for (const bad of ['', 'abc', '0', '-3', '2.5', '999']) {
			storage.setItem('status:nodes:v1', bad)
			assert.equal(expectedNodes(storage), 6)
		}
	})
})
