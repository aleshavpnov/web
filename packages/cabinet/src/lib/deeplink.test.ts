import { describe, expect, it } from 'vitest'

import {
	APP_ADD_PAGE,
	buildAppAddLink,
	buildAppIntentUrl,
	decodeAppAddParam,
	encodeAppAddParam,
} from '@shared/connect/deeplink.ts'

const SUB_URL = 'https://durov.aimuzov.online/s/abcDEF123?x=1&y=2'

describe('buildAppAddLink', () => {
	it('кладёт подписку в фрагмент страницы-моста: секрет не должен попасть в логи сервера', () => {
		const link = buildAppAddLink(SUB_URL)
		expect(link.startsWith(`${APP_ADD_PAGE}#u=`)).toBe(true)
		// base64url без padding: в хеше не должно быть +, / и =
		const u = link.slice(link.indexOf('#u=') + 3)
		expect(u).toMatch(/^[A-Za-z0-9_-]+$/)
	})

	it('декодируется обратно в исходный URL', () => {
		const link = buildAppAddLink(SUB_URL)
		const u = link.slice(link.indexOf('#u=') + 3)
		expect(decodeAppAddParam(u)).toBe(SUB_URL)
	})

	it('переживает не-ASCII в URL', () => {
		const url = 'https://durov.aimuzov.online/s/тест?имя=значение'
		expect(decodeAppAddParam(encodeAppAddParam(url))).toBe(url)
	})
})

describe('decodeAppAddParam', () => {
	it('отклоняет не-http(s) и мусор — в приложение уйдёт только адрес подписки', () => {
		expect(decodeAppAddParam(encodeAppAddParam('javascript:alert(1)'))).toBeNull()
		expect(decodeAppAddParam(encodeAppAddParam('aleshavpnov://add'))).toBeNull()
		expect(decodeAppAddParam(encodeAppAddParam('not a url'))).toBeNull()
		expect(decodeAppAddParam('')).toBeNull()
		expect(decodeAppAddParam('%%%')).toBeNull()
		expect(decodeAppAddParam('!!!')).toBeNull()
	})

	it('принимает http и https', () => {
		expect(decodeAppAddParam(encodeAppAddParam('http://example.com/s/1'))).toBe(
			'http://example.com/s/1',
		)
	})
})

describe('buildAppIntentUrl', () => {
	it('собирает intent:// со схемой, пакетом и fallback на страницу приложения', () => {
		const u = encodeAppAddParam(SUB_URL)
		const intent = buildAppIntentUrl(u, 'https://durov.aimuzov.online/app')
		expect(intent.startsWith(`intent://add?u=${u}#Intent;`)).toBe(true)
		expect(intent).toContain('scheme=aleshavpnov;')
		expect(intent).toContain('package=online.aimuzov.aleshavpnov;')
		expect(intent).toContain(
			`S.browser_fallback_url=${encodeURIComponent('https://durov.aimuzov.online/app')};`,
		)
		expect(intent.endsWith(';end')).toBe(true)
	})
})
