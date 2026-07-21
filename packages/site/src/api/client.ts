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

// Nonce вида `<expMs>.<hmac>` (issueBridgeToken в боте, TTL 10 мин). И /status.json (рефетч
// каждые 60с + на маунте), и /api/bridge требуют токен — кэшируем модульно, иначе дублировали бы
// /api/nonce. Токен stateless и переиспользуемый до exp; берём с запасом 30с до истечения.
let cachedNonce: { token: string; exp: number } | null = null

async function getNonce(): Promise<string | null> {
	const now = Date.now()
	if (cachedNonce && cachedNonce.exp - 30_000 > now) return cachedNonce.token
	try {
		const { token } = await getJson('/api/nonce', NonceSchema)
		const exp = Number(token.slice(0, token.indexOf('.')))
		cachedNonce = { token, exp: Number.isFinite(exp) ? exp : now }
		return token
	} catch {
		// /api/nonce → 404 = webBridge выключен; тогда и гейт на боте неактивен → шлём без токена.
		return null
	}
}

export async function fetchStatus(): Promise<StatusPayload> {
	const token = await getNonce()
	const res = await fetch(`${BASE}/status.json`, {
		headers: { accept: 'application/json', ...(token ? { 'x-bridge-token': token } : {}) },
	})
	if (!res.ok) throw new Error(`/status.json -> ${res.status}`)
	return StatusPayloadSchema.parse(await res.json())
}

export async function createBridge(ref?: string | null): Promise<BridgeResult> {
	const token = await getNonce()
	const res = await fetch(`${BASE}/api/bridge`, {
		method: 'POST',
		headers: {
			...(token ? { 'x-bridge-token': token } : {}),
			...(ref ? { 'content-type': 'application/json' } : {}),
		},
		...(ref ? { body: JSON.stringify({ ref }) } : {}),
	})
	if (res.status === 429) throw new Error('rate-limit')
	if (!res.ok) throw new Error(`/api/bridge -> ${res.status}`)
	return BridgeSchema.parse(await res.json())
}
