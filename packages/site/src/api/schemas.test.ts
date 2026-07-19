import { describe, expect, it } from 'vitest'
import { StatusPayloadSchema } from './schemas.ts'

const base = {
	overall: 'operational',
	generatedAt: '2025-05-17T12:00:00.000Z',
	nodes: [],
	internet: { latencyMs: 42 },
	incidents: [],
}

describe('StatusPayloadSchema: traffic', () => {
	it('парсит payload без traffic (старый бэкенд)', () => {
		const p = StatusPayloadSchema.parse(base)
		expect(p.traffic).toBeUndefined()
	})

	it('парсит traffic: null и объект', () => {
		expect(StatusPayloadSchema.parse({ ...base, traffic: null }).traffic).toBeNull()
		const p = StatusPayloadSchema.parse({ ...base, traffic: { avgBps: 500_000, samples: 12 } })
		expect(p.traffic).toEqual({ avgBps: 500_000, samples: 12 })
	})
})
