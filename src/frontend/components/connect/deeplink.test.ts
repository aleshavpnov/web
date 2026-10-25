import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { APP_ADD_PAGE, buildAppAddLink, buildAppIntentUrl, decodeAppAddParam, encodeAppAddParam } from './deeplink.ts'

const SUB_URL = 'https://durov.aimuzov.online/s/abcDEF123?x=1&y=2'

describe('buildAppAddLink', () => {
	test('кладёт подписку в фрагмент страницы-моста: секрет не должен попасть в логи сервера', () => {
		const link = buildAppAddLink(SUB_URL)

		assert.ok(link.startsWith(`${APP_ADD_PAGE}#u=`))
		// base64url без padding: в хеше не должно быть +, / и =
		assert.match(link.slice(link.indexOf('#u=') + 3), /^[A-Za-z0-9_-]+$/)
	})

	test('декодируется обратно в исходный URL', () => {
		const link = buildAppAddLink(SUB_URL)

		assert.equal(decodeAppAddParam(link.slice(link.indexOf('#u=') + 3)), SUB_URL)
	})

	test('переживает не-ASCII в URL', () => {
		const url = 'https://durov.aimuzov.online/s/тест?имя=значение'

		assert.equal(decodeAppAddParam(encodeAppAddParam(url)), url)
	})
})

describe('decodeAppAddParam', () => {
	test('отклоняет не-http(s) и мусор — в приложение уйдёт только адрес подписки', () => {
		for (const bad of ['javascript:alert(1)', 'aleshavpnov://add', 'not a url'])
			assert.equal(decodeAppAddParam(encodeAppAddParam(bad)), null)

		for (const bad of ['', '%%%', '!!!']) assert.equal(decodeAppAddParam(bad), null)
	})

	test('принимает http и https', () => {
		assert.equal(decodeAppAddParam(encodeAppAddParam('http://example.com/s/1')), 'http://example.com/s/1')
	})
})

describe('buildAppIntentUrl', () => {
	test('собирает intent:// со схемой, пакетом и fallback на страницу приложения', () => {
		const u = encodeAppAddParam(SUB_URL)
		const intent = buildAppIntentUrl(u, 'https://durov.aimuzov.online/app')

		assert.ok(intent.startsWith(`intent://add?u=${u}#Intent;`))
		assert.ok(intent.includes('scheme=aleshavpnov;'))
		assert.ok(intent.includes('package=online.aimuzov.aleshavpnov;'))
		assert.ok(intent.includes(`S.browser_fallback_url=${encodeURIComponent('https://durov.aimuzov.online/app')};`))
		assert.ok(intent.endsWith(';end'))
	})
})
