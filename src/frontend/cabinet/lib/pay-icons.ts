import { Banknote, Bitcoin, CreditCard, Gift, Globe, QrCode, Repeat, Smartphone, type LucideIcon } from '@lucide/svelte'

/**
 * Иконка по коду метода Platega: 2 — СБП (QR), 3 — ЕРИП, 11 — карта РФ, 12 — карта не РФ,
 * 13 — криптовалюта, 14 — SberPay. Неизвестный код — карта: нейтральнее нет.
 */
const METHOD_ICONS: Record<number, LucideIcon> = {
	2: QrCode,
	3: Banknote,
	11: CreditCard,
	12: Globe,
	13: Bitcoin,
	14: Smartphone,
}

export function payMethodIcon(code: number): LucideIcon {
	return METHOD_ICONS[code] ?? CreditCard
}

/** Подписка: повторяющееся списание — то, чем она отличается от разового платежа. */
export const SUBSCRIPTION_ICON = Repeat
export const GIFT_ICON = Gift
