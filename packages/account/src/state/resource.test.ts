import { describe, expect, it } from 'vitest'

import { anyLoadingAtom, resource } from './resource.ts'

/** Запрос, которым управляет тест: отвечаем ровно тогда, когда нужно проверить счётчик. */
function deferred<T>() {
	let settle!: { resolve: (value: T) => void; reject: (error: Error) => void }
	const promise = new Promise<T>((resolve, reject) => {
		settle = { resolve, reject }
	})
	return { promise, ...settle }
}

describe('anyLoadingAtom', () => {
	it('горит, пока не ответил последний из параллельных запросов', async () => {
		// Экран поднимает несколько ресурсов сразу (главная — карточку подписки и плитки),
		// и первый же ответ не должен гасить полоску при живых остальных.
		const first = deferred<number>()
		const second = deferred<number>()
		const one = resource('testOne', () => first.promise)
		const two = resource('testTwo', () => second.promise)

		expect(anyLoadingAtom()).toBe(false)

		const loadingOne = one.load()
		const loadingTwo = two.load()
		expect(anyLoadingAtom()).toBe(true)

		first.resolve(1)
		await loadingOne
		expect(anyLoadingAtom()).toBe(true)

		second.resolve(2)
		await loadingTwo
		expect(anyLoadingAtom()).toBe(false)
	})

	it('гаснет и после упавшего запроса', async () => {
		const failing = deferred<number>()
		const res = resource('testFailing', () => failing.promise)

		const loading = res.load()
		failing.reject(new Error('сеть недоступна'))
		await loading

		expect(res.errorAtom()).toBe('сеть недоступна')
		expect(anyLoadingAtom()).toBe(false)
	})
})
