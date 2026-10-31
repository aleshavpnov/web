import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'

import { MemoryStorage } from '#frontend/lib/memory-storage.ts'

import { captureRef, getStoredRef, getVisitorKey, supportLink } from './ref.ts'

describe('ref state', () => {
	let session: MemoryStorage
	let local: MemoryStorage

	beforeEach(() => {
		session = new MemoryStorage()
		local = new MemoryStorage()
	})

	test('captureRef сохраняет валидный ?ref= в sessionStorage и возвращает его', () => {
		assert.equal(captureRef('?ref=abcd1234', session), 'abcd1234')
		assert.equal(getStoredRef(session), 'abcd1234')
	})

	test('невалидный код отбрасывается', () => {
		captureRef('?ref=<script>x</script>', session)
		assert.equal(getStoredRef(session), null)

		captureRef('?ref=ab', session) // короче 4 символов
		assert.equal(getStoredRef(session), null)
	})

	test('без ?ref= ничего не пишет и не затирает сохранённый код', () => {
		captureRef('?ref=abcd1234', session)
		assert.equal(captureRef('', session), null)
		assert.equal(getStoredRef(session), 'abcd1234')
	})

	test('getStoredRef без сохранённого кода — null', () => {
		assert.equal(getStoredRef(session), null)
	})

	test('ссылка поддержки сохраняет код после перехода с реферальной страницы', () => {
		captureRef('?ref=abcd1234', session)
		captureRef('', session)
		assert.equal(supportLink('examplebot', session), 'https://t.me/examplebot?start=support_ref_abcd1234')
	})

	test('ссылка поддержки без кода остаётся обычной', () => {
		assert.equal(supportLink('examplebot', session), 'https://t.me/examplebot?start=support')
	})

	test('ссылка поддержки отбрасывает невалидный сохранённый код', () => {
		session.setItem('ref:v1', 'bad&start=other')
		assert.equal(supportLink('examplebot', session), 'https://t.me/examplebot?start=support')
	})

	test('getVisitorKey стабилен между вызовами', () => {
		const key = getVisitorKey(local)

		assert.ok(key)
		assert.equal(getVisitorKey(local), key)
	})
})
