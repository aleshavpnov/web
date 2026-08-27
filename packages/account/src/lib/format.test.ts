import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	daysLeft,
	formatBytes,
	formatDate,
	formatDevices,
	formatRemaining,
	plural,
} from './format.ts'

afterEach(() => {
	vi.useRealTimers()
})

describe('formatBytes', () => {
	it('переключает единицы на границах, ниже мегабайта — КБ, не сырые байты', () => {
		expect(formatBytes(0)).toBe('0 КБ')
		expect(formatBytes(512)).toBe('1 КБ')
		expect(formatBytes(62_437)).toBe('61 КБ')
		expect(formatBytes(5 * 1024 ** 2)).toBe('5.0 МБ')
		expect(formatBytes(3 * 1024 ** 3)).toBe('3.00 ГБ')
	})
})

describe('formatDate', () => {
	it('битая или пустая дата — прочерк, а не Invalid Date', () => {
		expect(formatDate(null)).toBe('—')
		expect(formatDate('не-дата')).toBe('—')
	})
})

describe('plural', () => {
	it('склоняет по русским правилам, включая 11–14', () => {
		const days = (n: number) => `${n} ${plural(n, 'день', 'дня', 'дней')}`
		expect([1, 2, 5, 11, 21, 22, 25].map(days)).toEqual([
			'1 день',
			'2 дня',
			'5 дней',
			'11 дней',
			'21 день',
			'22 дня',
			'25 дней',
		])
	})
})

describe('formatRemaining', () => {
	it('считает остаток и истечение от текущего момента', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-08-12T12:00:00Z'))

		expect(formatRemaining('2026-08-24T12:00:00Z')).toBe('осталось 12 дней')
		expect(formatRemaining('2026-08-12T12:00:00Z')).toBe('истекает сегодня')
		expect(formatRemaining('2026-08-09T12:00:00Z')).toBe('истекла 3 дня назад')
	})

	it('daysLeft округляет вверх — «меньше суток» это ещё день', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-08-12T12:00:00Z'))

		expect(daysLeft('2026-08-13T06:00:00Z')).toBe(1)
	})
})

describe('formatDevices', () => {
	it('склоняет устройства', () => {
		expect([1, 3, 10].map(formatDevices)).toEqual(['1 устройство', '3 устройства', '10 устройств'])
	})
})
