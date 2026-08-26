/** Склейка тарифов и подарочных товаров в единый список карточек — для витрины и оформления. */
import type { Plan } from '@/api/schemas.ts'

/** Тариф витрины: одна карточка, две возможные покупки. */
export type PlanOffer = Omit<Plan, 'buyUrl'> & { buyUrl: string | null; giftUrl: string | null }

/**
 * Склеивает обычные тарифы и подарочные в один список: у тарифа может не быть подарочного
 * товара (или наоборот), но карточка всё равно одна — иначе он показался бы дважды.
 */
export function mergeOffers(plans: Plan[], gifts: Plan[]): PlanOffer[] {
	const giftByCode = new Map(gifts.map((g) => [g.code, g.buyUrl]))
	const merged = plans.map((p) => ({ ...p, giftUrl: giftByCode.get(p.code) ?? null }))
	// Тариф, который продаётся только как подарок, тоже показываем — но без кнопки покупки.
	const onlyGifts = gifts
		.filter((g) => !plans.some((p) => p.code === g.code))
		.map((g) => ({ ...g, buyUrl: null, giftUrl: g.buyUrl }))
	return [...merged, ...onlyGifts]
}
