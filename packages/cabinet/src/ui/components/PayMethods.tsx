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
import { cn } from '@/lib/utils.ts'
import { BRAND_ON } from './common.tsx'
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
		// Две плитки рядом, пояснение внутри: выбор один из двух, и сноска под кнопкой
		// читалась как часть следующего способа, а не своего.
		return (
			<div className="grid grid-cols-2 gap-3">
				<GroupTile
					title="Подписка"
					note="Спишется сама раз в период, отменить можно в любой момент"
					icon={SUBSCRIPTION_ICON}
					primary
					disabled={busy}
					onClick={() => setPicked('sub')}
				/>
				<GroupTile
					title="Разово"
					note="Платите один раз, продлевать нужно самому"
					icon={WalletIcon}
					disabled={busy}
					onClick={() => setPicked('once')}
				/>
			</div>
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

function GroupTile({
	title,
	note,
	icon: Icon,
	primary = false,
	disabled,
	onClick,
}: {
	title: string
	note: string
	icon: PayIcon
	primary?: boolean
	disabled: boolean
	onClick: () => void
}) {
	return (
		<Button
			className={cn(
				'h-auto w-full flex-col items-start justify-start gap-2 p-3 text-left whitespace-normal',
				primary && BRAND_ON,
			)}
			variant={primary ? 'default' : 'outline'}
			disabled={disabled}
			onClick={onClick}
		>
			<Icon className="size-7" strokeWidth={1.75} />
			<span className="text-lg leading-tight font-semibold">{title}</span>
			<span className="text-xs leading-snug font-normal opacity-75">{note}</span>
		</Button>
	)
}
