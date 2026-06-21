import {
	BridgeSchema,
	NonceSchema,
	StatusPayloadSchema,
	type BridgeResult,
	type StatusPayload,
} from './schemas.ts'

const BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

async function getJson<T>(path: string, schema: { parse: (v: unknown) => T }): Promise<T> {
	const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } })
	if (!res.ok) throw new Error(`${path} -> ${res.status}`)
	return schema.parse(await res.json())
}

export function fetchStatus(): Promise<StatusPayload> {
	return getJson('/status.json', StatusPayloadSchema)
}

export async function createBridge(): Promise<BridgeResult> {
	const { token } = await getJson('/api/nonce', NonceSchema)
	const res = await fetch(`${BASE}/api/bridge`, {
		method: 'POST',
		headers: { 'x-bridge-token': token },
	})
	if (res.status === 429) throw new Error('rate-limit')
	if (!res.ok) throw new Error(`/api/bridge -> ${res.status}`)
	return BridgeSchema.parse(await res.json())
}
