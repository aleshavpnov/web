import assert from 'node:assert/strict'
import { afterEach, describe, mock, test } from 'node:test'

import { daysLeft, formatBytes, formatDate, formatDevices, formatRemaining, plural } from './format.ts'

afterEach(() => {
	mock.timers.reset()
})

/** Часы стоят на полудне 12 августа: остаток и истечение считаются от «сейчас». */
function freezeNow() {
	mock.timers.enable({ apis: ['Date'], now: new Date('2026-08-12T12:00:00Z') })
}

describe('formatBytes', () => {
	test('переключает единицы на границах, ниже мегабайта — КБ, не сырые байты', () => {
		assert.equal(formatBytes(0), '0 КБ')
		assert.equal(formatBytes(512), '1 КБ')
		assert.equal(formatBytes(62_437), '61 КБ')
		assert.equal(formatBytes(5 * 1024 ** 2), '5.0 МБ')
		assert.equal(formatBytes(3 * 1024 ** 3), '3.00 ГБ')
	})
})

describe('formatDate', () => {
	test('битая или пустая дата — прочерк, а не Invalid Date', () => {
		assert.equal(formatDate(null), '—')
		assert.equal(formatDate('не-дата'), '—')
	})
})

describe('plural', () => {
	test('склоняет по русским правилам, включая 11–14', () => {
		const days = (n: number) => `${n} ${plural(n, 'день', 'дня', 'дней')}`

		assert.deepEqual([1, 2, 5, 11, 21, 22, 25].map(days), [
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
	test('считает остаток и истечение от текущего момента', () => {
		freezeNow()

		assert.equal(formatRemaining('2026-08-24T12:00:00Z'), 'осталось 12 дней')
		assert.equal(formatRemaining('2026-08-12T12:00:00Z'), 'истекает сегодня')
		assert.equal(formatRemaining('2026-08-09T12:00:00Z'), 'истекла 3 дня назад')
	})

	test('daysLeft округляет вверх — «меньше суток» это ещё день', () => {
		freezeNow()

		assert.equal(daysLeft('2026-08-13T06:00:00Z'), 1)
	})
})

describe('formatDevices', () => {
	test('склоняет устройства', () => {
		assert.deepEqual([1, 3, 10].map(formatDevices), ['1 устройство', '3 устройства', '10 устройств'])
	})
})
