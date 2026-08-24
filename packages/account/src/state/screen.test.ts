import { describe, expect, it, vi } from 'vitest'

import {
	hashFromScreen,
	navigate,
	screenAtom,
	screenFromHash,
	SCREEN_TITLE,
	type ScreenName,
} from './screen.ts'

const ALL: ScreenName[] = ['home', 'connect', 'plans', 'usage', 'refs', 'more']

describe('screenFromHash', () => {
	it('разбирает адреса всех вкладок', () => {
		expect(ALL.map((s) => screenFromHash(hashFromScreen(s)))).toEqual(ALL)
	})

	it('пустой и мусорный хеш ведут на главную — вебвью не должно застревать на пустом экране', () => {
		for (const hash of ['', '#', '#/', '#/нет-такого', '#/connect/лишнее/сегменты']) {
			expect(screenFromHash(hash), `хеш "${hash}"`).toBe(
				hash.startsWith('#/connect') ? 'connect' : 'home',
			)
		}
	})
})

describe('navigate', () => {
	it('меняет адрес через History API, без fragment-навигации', async () => {
		// Присваивание location.hash — настоящая навигация вебвью: Telegram Desktop зажигает
		// на ней свой индикатор загрузки и не гасит его (события завершения для навигации
		// внутри документа не приходит). Признак такого присваивания в jsdom — событие
		// hashchange, которого у pushState нет.
		const pushState = vi.spyOn(window.history, 'pushState')
		const onHashChange = vi.fn<() => void>()
		window.addEventListener('hashchange', onHashChange)

		navigate('connect')

		expect(window.location.hash).toBe('#/connect')
		expect(pushState).toHaveBeenCalled()
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(onHashChange).not.toHaveBeenCalled()

		window.removeEventListener('hashchange', onHashChange)
		pushState.mockRestore()
	})

	it('шаг назад по истории возвращает на предыдущий экран', async () => {
		navigate('home')
		navigate('usage')
		expect(screenAtom()).toBe('usage')

		window.history.back()

		await vi.waitFor(() => expect(screenAtom()).toBe('home'))
	})
})

describe('SCREEN_TITLE', () => {
	it('у каждой вкладки есть заголовок — шапка рисуется по нему', () => {
		expect(ALL.every((s) => SCREEN_TITLE[s].length > 0)).toBe(true)
	})
})
