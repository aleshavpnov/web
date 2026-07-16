import { beforeEach, describe, expect, it } from 'vitest'
import { captureRef, getStoredRef } from './ref.ts'

function setSearch(search: string): void {
	window.history.replaceState(null, '', `/${search}`)
}

describe('ref state', () => {
	beforeEach(() => {
		sessionStorage.clear()
		setSearch('')
	})

	it('captureRef сохраняет валидный ?ref= в sessionStorage', () => {
		setSearch('?ref=abcd1234')
		captureRef()
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
		captureRef()
		expect(getStoredRef()).toBe('abcd1234')
	})

	it('getStoredRef без сохранённого кода — null', () => {
		expect(getStoredRef()).toBeNull()
	})
})
