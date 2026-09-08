import { describe, expect, it } from 'vitest'
import { screenFromPath, pathFromScreen } from './screen.ts'

describe('screen routing', () => {
	it('maps pathname to screen', () => {
		expect(screenFromPath('/')).toBe('home')
		expect(screenFromPath('/get')).toBe('access')
		expect(screenFromPath('/status')).toBe('status')
		expect(screenFromPath('/faq')).toBe('faq')
		expect(screenFromPath('/app/add')).toBe('appAdd')
		expect(screenFromPath('/whatever')).toBe('notfound')
	})
	it('maps screen back to pathname', () => {
		expect(pathFromScreen('access')).toBe('/get')
		expect(pathFromScreen('status')).toBe('/status')
		expect(pathFromScreen('faq')).toBe('/faq')
		expect(pathFromScreen('home')).toBe('/')
		expect(pathFromScreen('appAdd')).toBe('/app/add')
	})
})
