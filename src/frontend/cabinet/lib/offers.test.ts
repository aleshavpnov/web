import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { Gift, OneTimeMethod, Plan } from '#frontend/cabinet/api/schemas.ts'

import { canGift, mergeOffers } from './offers.ts'

const SBP: OneTimeMethod = { code: 2, label: 'СБП', amount: 250, feePercent: null }

function plan(code: string, over: Partial<Plan> = {}): Plan {
	return {
		code,
		name: code,
		emoji: '',
		durationDays: 30,
		deviceLimit: 3,
		priceLabel: '',
		buyUrl: `https://t.me/tribute/app?startapp=${code}`,
		oneTimeMethods: [],
		sbpSubscription: null,
		...over,
	}
}

const gift = (code: string, over: Partial<Gift> = {}): Gift => ({ ...plan(code), ...over })

describe('mergeOffers', () => {
	test('подарок разовой оплатой без товара Tribute — способы в giftMethods, ссылки нет', () => {
		const [offer] = mergeOffers([plan('monthly')], [gift('monthly', { buyUrl: null, oneTimeMethods: [SBP] })])

		assert.ok(offer)
		assert.equal(offer.giftUrl, null)
		assert.deepEqual(offer.giftMethods, [SBP])
		assert.equal(canGift(offer), true)
	})

	test('тариф без подарка подарить нельзя', () => {
		const [offer] = mergeOffers([plan('monthly')], [])

		assert.ok(offer)
		assert.equal(offer.giftUrl, null)
		assert.deepEqual(offer.giftMethods, [])
		assert.equal(canGift(offer), false)
	})

	test('тариф только в подарок: себе не продаётся, разовые способы — подарочные', () => {
		const [offer] = mergeOffers([], [gift('family', { buyUrl: null, oneTimeMethods: [SBP] })])

		assert.ok(offer)
		assert.equal(offer.buyUrl, null)
		assert.deepEqual(offer.oneTimeMethods, [])
		assert.deepEqual(offer.giftMethods, [SBP])
	})
})
