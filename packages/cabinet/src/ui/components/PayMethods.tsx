/**
 * Способы оплаты тарифа — одни на экран оформления и визард.
 *
 * Когда у тарифа есть и подписка, и разовая оплата, сначала спрашиваем, как платить,
 * а способы показываем уже внутри выбранной группы. Пять кнопок подряд заставляли
 * сравнивать провайдеров, хотя человек ещё не решил главное: продлевать самому или нет.
 * Без разовой оплаты шага нет, сразу способы подписки.
 */
import { useState } from 'react'
import { ArrowLeftIcon, WalletIcon } from 'lucide-react'

import type { PaymentChoice } from '@/api/client.ts'
import type { OneTimeMethod } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { feeNote } from '@/lib/format.ts'
import {
	OptionNote,
	PayOption,
	payMethodIcon,
	SUBSCRIPTION_ICON,
	type PayIcon,
} from './PayOption.tsx'

type Group = 'sub' | 'once'

export function PayMethods({
	subscriptionLabel,
	subscriptionIcon = SUBSCRIPTION_ICON,
	subscriptionFee,
	sbpSubscription,
	durationDays,
	oneTimeMethods,
	busy,
	onPay,
}: {
	/** Подпись кнопки Tribute, когда она единственная в группе («Оформить», «Продлить»). */
	subscriptionLabel: string
	subscriptionIcon?: PayIcon
	subscriptionFee: string | undefined
	sbpSubscription: { amount: number } | null
	durationDays: number
	oneTimeMethods: OneTimeMethod[]
	busy: boolean
	/** Без аргумента — подписка Tribute, иначе выбранный способ Platega. */
	onPay: (choice?: PaymentChoice) => void
}) {
	const [picked, setPicked] = useState<Group | null>(null)
	const hasOnce = oneTimeMethods.length > 0
	const group: Group | null = hasOnce ? picked : 'sub'

	if (group === null) {
		return (
			<>
				<PayOption
					label="Подписка"
					icon={SUBSCRIPTION_ICON}
					primary
					disabled={busy}
					onClick={() => setPicked('sub')}
				>
					<OptionNote>Оплата спишется сама раз в период, отменить можно в любой момент.</OptionNote>
				</PayOption>
				<PayOption
					label="Разово"
					icon={WalletIcon}
					disabled={busy}
					onClick={() => setPicked('once')}
				>
					<OptionNote>Платите один раз, продлевать нужно самому.</OptionNote>
				</PayOption>
			</>
		)
	}

	return (
		<>
			{group === 'sub' ? (
				<>
					<PayOption
						label={sbpSubscription ? 'Tribute' : subscriptionLabel}
						fee={subscriptionFee}
						icon={subscriptionIcon}
						primary
						disabled={busy}
						onClick={() => onPay()}
					>
						{sbpSubscription && <OptionNote>Оплата картой, отменить можно в Tribute.</OptionNote>}
					</PayOption>
					{sbpSubscription && (
						<PayOption
							label="СБП с автопродлением"
							icon={SUBSCRIPTION_ICON}
							disabled={busy}
							onClick={() => onPay('sbp_sub')}
						>
							<OptionNote>
								Счёт привязывается в&nbsp;приложении банка, {sbpSubscription.amount}&nbsp;₽ спишется
								сам раз в&nbsp;{durationDays}&nbsp;дн. Отключить можно на&nbsp;главной.
							</OptionNote>
						</PayOption>
					)}
				</>
			) : (
				// У разовой оплаты нет готовой ссылки — форму создаёт бот по нажатию.
				oneTimeMethods.map((m) => (
					<PayOption
						key={m.code}
						label={m.label}
						fee={feeNote(m.feePercent)}
						icon={payMethodIcon(m.code)}
						disabled={busy}
						onClick={() => onPay(m.code)}
					/>
				))
			)}
			{hasOnce && (
				<Button
					variant="ghost"
					className="w-full text-muted-foreground"
					disabled={busy}
					onClick={() => setPicked(null)}
				>
					<ArrowLeftIcon />
					Другой способ оплаты
				</Button>
			)}
		</>
	)
}
