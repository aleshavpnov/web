/**
 * Кнопка способа оплаты — одна на визард и витрину тарифов.
 *
 * Внутри кнопки две строки: название способа и комиссия. Комиссия живёт именно здесь, а не
 * подписью снизу: способы сравнивают в момент нажатия, а не в тексте вокруг. Иконка
 * выровнена по заголовку (а не по центру кнопки) — иначе при двух строках она уезжает вниз
 * и перестаёт читаться как метка способа.
 */
import type { ReactNode } from 'react'
import {
	BanknoteIcon,
	BitcoinIcon,
	CreditCardIcon,
	GiftIcon,
	GlobeIcon,
	QrCodeIcon,
	RepeatIcon,
	SmartphoneIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button.tsx'
import { cn } from '@/lib/utils.ts'
import { BRAND_ON } from './common.tsx'

export type PayIcon = typeof CreditCardIcon

/**
 * Иконка по коду метода Platega: 2 — СБП (QR), 3 — ЕРИП, 11 — карта РФ, 12 — карта не РФ,
 * 13 — криптовалюта, 14 — SberPay. Неизвестный код — карта: нейтральнее нет.
 */
const METHOD_ICONS: Record<number, PayIcon> = {
	2: QrCodeIcon,
	3: BanknoteIcon,
	11: CreditCardIcon,
	12: GlobeIcon,
	13: BitcoinIcon,
	14: SmartphoneIcon,
}

export function payMethodIcon(code: number): PayIcon {
	return METHOD_ICONS[code] ?? CreditCardIcon
}

/** Подписка: повторяющееся списание — то, чем она отличается от разового платежа. */
export const SUBSCRIPTION_ICON = RepeatIcon
export const GIFT_ICON = GiftIcon

/** Сноска под кнопкой способа: иконка слева, текст справа — как и в самой кнопке. */
export function OptionNote({ children }: { children: ReactNode }) {
	// Плашка в цвет кнопки, а не серая строка: это преимущество способа, а не мелкий шрифт
	// под ним. Приглушённой подписи здесь не хватало — её просто пролистывали.
	return (
		<p className="mt-1.5 rounded-lg bg-brand/10 px-3 py-2 text-xs leading-snug text-brand">
			{children}
		</p>
	)
}

export function PayOption({
	label,
	fee,
	icon: Icon,
	primary = false,
	disabled,
	className,
	onClick,
	children,
}: {
	label: string
	/** Комиссия второй строкой внутри кнопки. Не задана — кнопка в одну строку. */
	fee?: string | undefined
	icon: PayIcon
	primary?: boolean
	disabled?: boolean
	className?: string
	onClick: () => void
	/** Сноска под кнопкой (например про автопродление). */
	children?: ReactNode
}) {
	return (
		<div className={className}>
			{/* h-auto — кнопка растёт под две строки. Иконка ростом с обе строки и по центру
			    относительно них: мелкая, прижатая к заголовку, читалась как случайный значок,
			    а не как метка способа оплаты. gap-3 — иначе крупная иконка липнет к тексту. */}
			<Button
				className={cn(
					'h-auto w-full items-center justify-start gap-3 py-3 text-left',
					primary && BRAND_ON,
				)}
				variant={primary ? 'default' : 'outline'}
				disabled={disabled}
				onClick={onClick}
			>
				{/* Свой size- отменяет дефолтные size-4, которые button раздаёт вложенным svg.
				    Штрих тоньше обычного: у крупной иконки дефолтные 2px выглядят грубо. */}
				<Icon className="size-8 shrink-0" strokeWidth={1.75} />
				<span className="flex min-w-0 flex-col">
					<span className="text-lg font-semibold">{label}</span>
					{fee && <span className="text-xs font-normal opacity-75">{fee}</span>}
				</span>
			</Button>
			{children}
		</div>
	)
}
