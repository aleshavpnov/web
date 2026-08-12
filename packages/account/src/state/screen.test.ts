import { describe, expect, it } from 'vitest'

import { hashFromScreen, screenFromHash, SCREEN_TITLE, type ScreenName } from './screen.ts'

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

describe('SCREEN_TITLE', () => {
	it('у каждой вкладки есть заголовок — шапка рисуется по нему', () => {
		expect(ALL.every((s) => SCREEN_TITLE[s].length > 0)).toBe(true)
	})
})
