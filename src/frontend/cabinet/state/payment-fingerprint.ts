type PaymentOverview = {
	kind: string
	sub?: { expiresAt: string; autoRenew?: { provider: string; nextChargeAt: string | null } | null } | null
	vip?: { expiresAt: string | null } | null
}

export function paymentFingerprint(overview: PaymentOverview | null, binding = false): string {
	if (!overview) return ''

	if (binding) return `sbp:${overview.sub?.autoRenew?.provider === 'platega'}`

	return `${overview.kind}:${overview.sub?.expiresAt ?? ''}:${overview.vip?.expiresAt ?? ''}`
}
