export const BYTES_PER_MBIT = 125_000

/** bytes/sec → Мбит/с со ступенчатой точностью: 123, 12.3, 1.23. */
export function formatMbps(bps: number): string {
	const mbps = bps / BYTES_PER_MBIT
	if (mbps >= 100) return mbps.toFixed(0)
	if (mbps >= 10) return mbps.toFixed(1)
	return mbps.toFixed(2)
}
