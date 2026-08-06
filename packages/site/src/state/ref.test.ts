import { beforeEach, describe, expect, it } from 'vitest'
import { captureRef, getStoredRef, getVisitorKey } from './ref.ts'

function setSearch(search: string): void {
	window.history.replaceState(null, '', `/${search}`)
}

describe('ref state', () => {
	beforeEach(() => {
		sessionStorage.clear()
		localStorage.clear()
		setSearch('')
	})

	it('captureRef сохраняет валидный ?ref= в sessionStorage и возвращает его', () => {
		setSearch('?ref=abcd1234')
		expect(captureRef()).toBe('abcd1234')
		expect(getStoredRef()).toBe('abcd1234')
	})

	it('невалидный код отбрасывается', () => {
		setSearch('?ref=<script>x</script>')
		captureRef()
		expect(getStoredRef()).toBeNull()

		setSearch('?ref=ab') // короче 4 символов
		captureRef()
		expect(getStoredRef()).toBeNull()
	})

	it('без ?ref= ничего не пишет и не затирает сохранённый код', () => {
		setSearch('?ref=abcd1234')
		captureRef()
		setSearch('')
		expect(captureRef()).toBeNull()
		expect(getStoredRef()).toBe('abcd1234')
	})

	it('getStoredRef без сохранённого кода — null', () => {
		expect(getStoredRef()).toBeNull()
	})

	it('getVisitorKey стабилен между вызовами', () => {
		const key = getVisitorKey()
		expect(key).toBeTruthy()
		expect(getVisitorKey()).toBe(key)
	})
})
