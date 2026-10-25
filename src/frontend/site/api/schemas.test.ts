import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { StatusPayloadSchema } from './schemas.ts'

const base = {
	overall: 'operational',
	generatedAt: '2025-05-17T12:00:00.000Z',
	nodes: [],
	internet: { latencyMs: 42 },
	incidents: [],
}

describe('StatusPayloadSchema: traffic', () => {
	test('парсит payload без traffic (старый бэкенд)', () => {
		assert.equal(StatusPayloadSchema.parse(base).traffic, undefined)
	})

	test('парсит traffic: null и объект', () => {
		assert.equal(StatusPayloadSchema.parse({ ...base, traffic: null }).traffic, null)

		assert.deepEqual(StatusPayloadSchema.parse({ ...base, traffic: { avgBps: 500_000, samples: 12 } }).traffic, {
			avgBps: 500_000,
			samples: 12,
		})
	})
})
