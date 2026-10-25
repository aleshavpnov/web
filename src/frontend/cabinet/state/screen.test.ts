import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'

import {
	hashFromScreen,
	navigate,
	paramFromHash,
	rootScreen,
	SCREEN_TITLE,
	screenAtom,
	screenFromHash,
	screenParamAtom,
	SCREENS,
	startRouter,
	type RouterWindow,
} from './screen.ts'

/**
 * Окно с адресной строкой и историей в памяти. `hashchange` оно не шлёт никогда: в браузере
 * его даёт только присваивание `location.hash`, а роутер обязан обходиться без него.
 */
function fakeWindow(start: string) {
	const entries: string[] = []
	const listeners = new Map<string, Set<() => void>>()
	const url = new URL(start, 'https://cabinet.test')
	const calls = { push: 0, hashAssign: 0 }

	const set = (next: string) => {
		const resolved = new URL(next, url)

		url.pathname = resolved.pathname
		url.search = resolved.search
		url.hash = resolved.hash
	}

	const win: RouterWindow & { back(): void } = {
		location: {
			get hash() {
				return url.hash
			},
			set hash(_: string) {
				calls.hashAssign++
			},
			get search() {
				return url.search
			},
			get pathname() {
				return url.pathname
			},
		},
		history: {
			pushState(_data: unknown, _unused: string, next?: string | URL | null) {
				calls.push++
				entries.push(url.toString())
				set(String(next))
			},
			replaceState(_data: unknown, _unused: string, next?: string | URL | null) {
				set(String(next))
			},
		},
		addEventListener(type, listener) {
			if (!listeners.has(type)) listeners.set(type, new Set())

			listeners.get(type)?.add(listener)
		},
		removeEventListener(type, listener) {
			listeners.get(type)?.delete(listener)
		},
		back() {
			const prev = entries.pop()

			if (!prev) return

			set(prev)

			for (const listener of listeners.get('popstate') ?? []) listener()
		},
	}

	return { win, calls, url }
}

let stop: (() => void) | null = null

afterEach(() => {
	stop?.()
	stop = null
})

describe('screenFromHash', () => {
	test('разбирает адреса всех экранов', () => {
		assert.deepEqual(
			SCREENS.map((s) => screenFromHash(hashFromScreen(s))),
			SCREENS,
		)
	})

	test('пустой и мусорный хеш ведут на главную — вебвью не должно застревать на пустом экране', () => {
		for (const hash of ['', '#', '#/', '#/нет-такого', '#/connect/лишнее/сегменты'])
			assert.equal(screenFromHash(hash), hash.startsWith('#/connect') ? 'connect' : 'home', `хеш "${hash}"`)
	})
})

describe('параметр экрана', () => {
	test('код тарифа ездит вторым сегментом хеша — перезагрузка вебвью возвращает на тот же тариф', () => {
		assert.equal(hashFromScreen('buy', 'monthly'), '#/buy/monthly')
		assert.equal(screenFromHash('#/buy/monthly'), 'buy')
		assert.equal(paramFromHash('#/buy/monthly'), 'monthly')
	})

	test('диплинки бота на подключение несут цель подсветки вторым сегментом', () => {
		for (const target of ['refresh', 'routes']) {
			assert.equal(screenFromHash(`#/connect/${target}`), 'connect')
			assert.equal(paramFromHash(`#/connect/${target}`), target)
		}
	})

	// Хеш у Mini App занят Telegram (tgWebAppData), поэтому бот шлёт раздел в query —
	// см. cabinetUrlFor.
	test('стартовый ?go= из кнопки бота ведёт на свой экран и вычищается из адреса', () => {
		const { win, url } = fakeWindow('/me/?go=connect/refresh')

		stop = startRouter(win)

		assert.equal(screenAtom(), 'connect')
		assert.equal(screenParamAtom(), 'refresh')
		assert.equal(url.search, '')
		assert.equal(url.hash, '#/connect/refresh')
		assert.equal(url.pathname, '/me/')
	})

	test('без ?go= стартовый экран берётся из хеша', () => {
		const { win } = fakeWindow('/me/#/buy/family')

		stop = startRouter(win)

		assert.equal(screenAtom(), 'buy')
		assert.equal(screenParamAtom(), 'family')
	})

	test('у экранов без параметра второй сегмент пуст', () => {
		assert.equal(paramFromHash('#/tariffs'), null)
		assert.equal(paramFromHash('#/'), null)
	})

	test('navigate с параметром ставит его, без параметра — сбрасывает', () => {
		const { win, url } = fakeWindow('/me/')

		stop = startRouter(win)
		navigate('buy', 'monthly')
		assert.equal(screenParamAtom(), 'monthly')
		assert.equal(url.hash, '#/buy/monthly')

		navigate('tariffs')
		assert.equal(screenParamAtom(), null)
	})
})

describe('navigate', () => {
	test('меняет адрес через History API, без fragment-навигации', () => {
		// Присваивание location.hash — настоящая навигация вебвью: Telegram Desktop зажигает
		// на ней свой индикатор загрузки и не гасит его.
		const { win, calls, url } = fakeWindow('/me/')

		stop = startRouter(win)
		navigate('connect')

		assert.equal(url.hash, '#/connect')
		assert.equal(calls.push, 1)
		assert.equal(calls.hashAssign, 0)
	})

	test('повторный переход на тот же адрес не плодит записи истории', () => {
		const { win, calls } = fakeWindow('/me/#/usage')

		stop = startRouter(win)
		navigate('usage')

		assert.equal(calls.push, 0)
	})

	test('шаг назад по истории возвращает на предыдущий экран', () => {
		const { win } = fakeWindow('/me/')

		stop = startRouter(win)
		navigate('home')
		navigate('usage')
		assert.equal(screenAtom(), 'usage')

		win.back()
		assert.equal(screenAtom(), 'home')
	})
})

describe('rootScreen', () => {
	test('подстраница поднимается по цепочке до вкладки', () => {
		assert.equal(rootScreen('buy'), 'plans')
		assert.equal(rootScreen('tariffs'), 'plans')
		assert.equal(rootScreen('usage'), 'usage')
	})
})

describe('SCREEN_TITLE', () => {
	test('у каждой вкладки есть заголовок — шапка рисуется по нему', () => {
		assert.ok(SCREENS.every((s) => SCREEN_TITLE[s].length > 0))
	})
})
