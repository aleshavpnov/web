import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { anyLoading, resource } from './resource.ts'

/** Запрос, которым управляет тест: отвечаем ровно тогда, когда нужно проверить счётчик. */
function deferred<T>() {
	const { promise, resolve, reject } = Promise.withResolvers<T>()

	return { promise, resolve, reject }
}

describe('anyLoading', () => {
	test('горит, пока не ответил последний из параллельных запросов', async () => {
		// Экран поднимает несколько ресурсов сразу (главная — карточку подписки и плитки),
		// и первый же ответ не должен гасить полоску при живых остальных.
		const first = deferred<number>()
		const second = deferred<number>()
		const one = resource(() => first.promise)
		const two = resource(() => second.promise)

		assert.equal(anyLoading(), false)

		const loadingOne = one.load()
		const loadingTwo = two.load()

		assert.equal(anyLoading(), true)

		first.resolve(1)
		await loadingOne
		assert.equal(anyLoading(), true)

		second.resolve(2)
		await loadingTwo
		assert.equal(anyLoading(), false)
	})

	test('гаснет и после упавшего запроса', async () => {
		const failing = deferred<number>()
		const res = resource(() => failing.promise)
		const loading = res.load()

		failing.reject(new Error('сеть недоступна'))
		await loading

		assert.equal(res.error(), 'сеть недоступна')
		assert.equal(anyLoading(), false)
	})

	test('стор anyLoading оповещает подписчиков полоски', async () => {
		const gate = deferred<number>()
		const res = resource(() => gate.promise)
		const seen: boolean[] = []
		const stop = anyLoading.subscribe((v) => seen.push(v))
		const loading = res.load()

		gate.resolve(1)
		await loading
		stop()

		assert.deepEqual(seen, [false, true, false])
	})
})
