import { describe, expect, it } from 'vitest'
import { screenFromPath, pathFromScreen } from './screen.ts'

describe('screen routing', () => {
	it('maps pathname to screen', () => {
		expect(screenFromPath('/')).toBe('home')
		expect(screenFromPath('/get')).toBe('access')
		expect(screenFromPath('/status')).toBe('status')
		expect(screenFromPath('/whatever')).toBe('home')
	})
	it('maps screen back to pathname', () => {
		expect(pathFromScreen('access')).toBe('/get')
		expect(pathFromScreen('status')).toBe('/status')
		expect(pathFromScreen('home')).toBe('/')
	})
})
