import { z } from 'zod'

export const HealthSchema = z.enum(['operational', 'degraded', 'down', 'unknown'])

export const StatusNodeSchema = z.object({
	label: z.string(),
	status: HealthSchema,
	uptime: z.object({
		d1: z.number().nullable(),
		d7: z.number().nullable(),
		d30: z.number().nullable(),
	}),
	bars: z.array(z.object({ day: z.string(), ratio: z.number().nullable() })),
	lastCheck: z.string().nullable(),
})
export const StatusIncidentSchema = z.object({
	id: z.number(),
	location: z.string().nullable(),
	severity: z.string(),
	title: z.string(),
	body: z.string().nullable(),
	status: z.string(),
	startedAt: z.string().nullable(),
	resolvedAt: z.string().nullable(),
})
export const StatusPayloadSchema = z.object({
	overall: HealthSchema,
	generatedAt: z.string(),
	nodes: z.array(StatusNodeSchema),
	internet: z.object({ latencyMs: z.number().nullable() }).nullable(),
	// optional — старый бэкенд (кэш) может ещё не отдавать поле.
	traffic: z.object({ avgBps: z.number(), samples: z.number() }).nullable().optional(),
	// optional — старый бэкенд может ещё не отдавать поле; null пока getMe не прошёл.
	botUsername: z.string().nullable().optional(),
	incidents: z.array(StatusIncidentSchema),
})
export const NonceSchema = z.object({ token: z.string() })
export const BridgeSchema = z.object({
	subscriptionUrl: z.string(),
	deepLink: z.string(),
	expiresAt: z.string(),
})

export type Health = z.infer<typeof HealthSchema>
export type StatusPayload = z.infer<typeof StatusPayloadSchema>
export type StatusNode = z.infer<typeof StatusNodeSchema>
export type StatusIncident = z.infer<typeof StatusIncidentSchema>
export type BridgeResult = z.infer<typeof BridgeSchema>
