import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { StatusIncident } from '#frontend/site/api/schemas.ts'

import {
	dayTone,
	describeOutage,
	formatDuration,
	formatOutageDate,
	formatOutageTime,
	groupOutages,
	plural,
} from './status-view.ts'

const NOW = Date.parse('2026-10-26T06:00:00Z')
const TZ = 'Europe/Moscow'

function incident(location: string, startedAt: string, resolvedAt: string | null, id = 1): StatusIncident {
	return {
		id,
		location,
		severity: 'critical',
		title: `Узел недоступен: ${location}`,
		body: null,
		status: 'closed',
		startedAt,
		resolvedAt,
	}
}

describe('groupOutages', () => {
	test('склеивает записи с общей минутой начала в один сбой', () => {
		const out = groupOutages(
			[
				incident('Варшава', '2026-10-19T23:55:05.883Z', '2026-10-20T04:40:00.466Z', 1),
				incident('Керкраде', '2026-10-19T23:55:05.881Z', '2026-10-20T04:40:00.464Z', 2),
				incident('Амстердам', '2026-10-17T21:50:05.955Z', '2026-10-17T22:00:01.170Z', 3),
			],
			NOW,
		)

		assert.equal(out.length, 2)
		assert.deepEqual(out[0]?.nodes, ['Варшава', 'Керкраде'])
		assert.equal(out[0]?.end, '2026-10-20T04:40:00.466Z')
		assert.deepEqual(out[1]?.nodes, ['Амстердам'])
	})

	test('отбрасывает сбои старше 30 дней и держит новые сверху', () => {
		const out = groupOutages(
			[
				incident('A', '2026-09-01T10:00:00Z', '2026-09-01T11:00:00Z'),
				incident('B', '2026-10-03T10:00:00Z', '2026-10-03T11:00:00Z'),
				incident('C', '2026-10-20T10:00:00Z', '2026-10-20T11:00:00Z'),
			],
			NOW,
		)

		assert.deepEqual(
			out.map((o) => o.nodes[0]),
			['C', 'B'],
		)
	})

	test('сбой, у которого хоть один узел не поднялся, считается идущим', () => {
		const out = groupOutages(
			[
				incident('A', '2026-10-25T10:00:00Z', '2026-10-25T11:00:00Z', 1),
				incident('B', '2026-10-25T10:00:30Z', null, 2),
			],
			NOW,
		)

		assert.equal(out[0]?.end, null)
	})
})

describe('форматирование', () => {
	test('plural', () => {
		assert.equal(plural(1, ['сбой', 'сбоя', 'сбоев']), 'сбой')
		assert.equal(plural(3, ['сбой', 'сбоя', 'сбоев']), 'сбоя')
		assert.equal(plural(5, ['сбой', 'сбоя', 'сбоев']), 'сбоев')
		assert.equal(plural(11, ['сбой', 'сбоя', 'сбоев']), 'сбоев')
		assert.equal(plural(22, ['сбой', 'сбоя', 'сбоев']), 'сбоя')
	})

	test('formatDuration', () => {
		assert.equal(formatDuration('2026-10-17T21:50:05Z', '2026-10-17T22:00:01Z'), '10 мин')
		assert.equal(formatDuration('2026-10-19T23:55:05Z', '2026-10-20T04:40:00Z'), '4 ч 45 мин')
		assert.equal(formatDuration('2026-10-11T15:00:05Z', '2026-10-12T05:10:00Z'), '14 ч 10 мин')
		assert.equal(formatDuration('2026-10-01T00:00:00Z', '2026-10-02T03:00:00Z'), '1 д 3 ч')
		assert.equal(formatDuration('2026-10-26T05:00:00Z', null, NOW), '1 ч')
	})

	test('formatOutageDate и formatOutageTime по Москве', () => {
		assert.equal(formatOutageDate('2026-10-19T23:55:05Z', '2026-10-20T04:40:00Z', TZ), '20 окт')
		assert.equal(formatOutageDate('2026-10-11T15:00:05Z', '2026-10-12T05:10:00Z', TZ), '11–12 окт')
		assert.equal(formatOutageDate('2026-10-31T15:00:00Z', '2026-11-01T05:00:00Z', TZ), '31 окт – 1 нояб')
		assert.equal(formatOutageTime('2026-10-11T15:00:05Z', '2026-10-12T05:10:00Z', TZ), '18:00 – 08:10')
		assert.equal(formatOutageTime('2026-10-11T15:00:05Z', null, TZ), 'с 18:00')
	})

	test('describeOutage', () => {
		assert.equal(describeOutage({ start: '', end: null, nodes: ['Амстердам'] }), 'Амстердам')

		assert.equal(
			describeOutage({ start: '', end: null, nodes: ['A', 'B', 'C', 'D', 'E'] }),
			'5 серверов: A, B, C, D, E',
		)
	})

	test('dayTone', () => {
		assert.equal(dayTone(null), 'none')
		assert.equal(dayTone(1), 'ok')
		assert.equal(dayTone(0.791), 'warn')
		assert.equal(dayTone(0.2), 'bad')
	})
})
