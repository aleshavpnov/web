export const BYTES_PER_MBIT = 125_000

/** bytes/sec → Мбит/с со ступенчатой точностью: 123, 12.3, 1.23. */
export function formatMbps(bps: number): string {
	const mbps = bps / BYTES_PER_MBIT

	if (mbps >= 100) return mbps.toFixed(0)

	if (mbps >= 10) return mbps.toFixed(1)

	return mbps.toFixed(2)
}

/** Доля аптайма в процентах с одним знаком, `—` когда данных нет. */
export function formatPct(v: number | null) {
	if (v === null) return '—'

	return `${(Math.round(v * 10) / 10).toFixed(1)}%`
}
