import { describe, expect, it } from 'vitest'

import type { Gift, OneTimeMethod, Plan } from '@/api/schemas.ts'

import { canGift, mergeOffers } from './offers.ts'

const SBP: OneTimeMethod = { code: 2, label: 'СБП', amount: 250, feePercent: null }

function plan(code: string, over: Partial<Plan> = {}): Plan {
	return {
		code,
		name: code,
		emoji: null,
		durationDays: 30,
		deviceLimit: 3,
		priceLabel: '',
		buyUrl: `https://t.me/tribute/app?startapp=${code}`,
		oneTimeMethods: [],
		sbpSubscription: null,
		...over,
	} as Plan
}

const gift = (code: string, over: Partial<Gift> = {}): Gift => ({ ...plan(code), ...over }) as Gift

describe('mergeOffers', () => {
	it('подарок разовой оплатой без товара Tribute — способы в giftMethods, ссылки нет', () => {
		const [offer] = mergeOffers(
			[plan('monthly')],
			[gift('monthly', { buyUrl: null, oneTimeMethods: [SBP] })],
		)

		expect(offer).toMatchObject({ giftUrl: null, giftMethods: [SBP] })
		expect(canGift(offer!)).toBe(true)
	})

	it('тариф без подарка подарить нельзя', () => {
		const [offer] = mergeOffers([plan('monthly')], [])

		expect(offer).toMatchObject({ giftUrl: null, giftMethods: [] })
		expect(canGift(offer!)).toBe(false)
	})

	it('тариф только в подарок: себе не продаётся, разовые способы — подарочные', () => {
		const [offer] = mergeOffers([], [gift('family', { buyUrl: null, oneTimeMethods: [SBP] })])

		expect(offer).toMatchObject({ buyUrl: null, oneTimeMethods: [], giftMethods: [SBP] })
	})
})
