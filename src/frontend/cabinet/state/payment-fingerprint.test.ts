import assert from 'node:assert/strict'
import { test } from 'node:test'

import { paymentFingerprint } from './payment-fingerprint.ts'

test('подключение СБП определяется без изменения оплаченного срока', () => {
	const sub = { expiresAt: '2026-12-03T08:44:22.594Z', autoRenew: { provider: 'tribute', nextChargeAt: null } }
	const before = { kind: 'paid', sub, vip: null }
	const after = { ...before, sub: { ...sub, autoRenew: { provider: 'platega', nextChargeAt: sub.expiresAt } } }

	assert.notEqual(paymentFingerprint(before, true), paymentFingerprint(after, true))
	assert.equal(paymentFingerprint(before), paymentFingerprint(after))
})

test('перенос даты Tribute не считается привязкой СБП', () => {
	const before = {
		kind: 'paid',
		sub: { expiresAt: '2026-12-03', autoRenew: { provider: 'tribute', nextChargeAt: '2026-12-02' } },
	}
	const after = { ...before, sub: { ...before.sub, autoRenew: { provider: 'tribute', nextChargeAt: '2026-12-03' } } }

	assert.equal(paymentFingerprint(before, true), paymentFingerprint(after, true))
	assert.equal(paymentFingerprint(null, true), '')
})

test('бонусные дни во время привязки не означают, что СБП подключено', () => {
	const before = { kind: 'paid', sub: { expiresAt: '2026-12-03', autoRenew: null } }
	const after = { ...before, sub: { ...before.sub, expiresAt: '2026-12-10' } }

	assert.equal(paymentFingerprint(before, true), paymentFingerprint(after, true))
})
