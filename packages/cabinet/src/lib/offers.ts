/** Склейка тарифов и подарочных товаров в единый список карточек — для витрины и оформления. */
import type { Gift, OneTimeMethod, Plan } from '@/api/schemas.ts'

/** Тариф витрины: одна карточка, две возможные покупки. */
export type PlanOffer = Omit<Plan, 'buyUrl'> & {
	buyUrl: string | null
	/** Подарочный товар Tribute. */
	giftUrl: string | null
	/** Разовая оплата подарка; пусто — подарок только товаром Tribute (или не продаётся). */
	giftMethods: OneTimeMethod[]
}

/** Можно ли подарить тариф хоть каким-то способом. */
export function canGift(offer: PlanOffer): boolean {
	return offer.giftUrl !== null || offer.giftMethods.length > 0
}

/**
 * Склеивает обычные тарифы и подарочные в один список: у тарифа может не быть подарочного
 * товара (или наоборот), но карточка всё равно одна — иначе он показался бы дважды.
 */
export function mergeOffers(plans: Plan[], gifts: Gift[]): PlanOffer[] {
	const giftByCode = new Map(gifts.map((g) => [g.code, g]))
	const merged = plans.map((p) => {
		const gift = giftByCode.get(p.code)
		return { ...p, giftUrl: gift?.buyUrl ?? null, giftMethods: gift?.oneTimeMethods ?? [] }
	})
	// Тариф, который продаётся только как подарок, тоже показываем — но без кнопки покупки себе.
	const onlyGifts = gifts
		.filter((g) => !plans.some((p) => p.code === g.code))
		.map((g) => ({
			...g,
			buyUrl: null,
			oneTimeMethods: [],
			sbpSubscription: null,
			giftUrl: g.buyUrl,
			giftMethods: g.oneTimeMethods,
		}))
	return [...merged, ...onlyGifts]
}
