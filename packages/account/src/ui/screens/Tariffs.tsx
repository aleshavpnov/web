/**
 * Экран «Тарифы»: полная витрина отдельной страницей.
 *
 * Раньше список раскрывался прямо под подбором — и экран подписки уезжал в длинную простыню,
 * где непонятно, куда «назад». Витрина нужна тем, кто уже знает, чего хочет, поэтому живёт
 * отдельной страницей под «Подпиской»: без вкладки в нижнем меню, с возвратом к родителю.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ApiError, startCheckout } from '@/api/client.ts'
import type { Plan } from '@/api/schemas.ts'
import { feeNote, formatDevices } from '@/lib/format.ts'
import { hapticError, openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { plansRes } from '@/state/cabinet.ts'
import { Async, PlanFigures, SECTION_CARD } from '@/ui/components/common.tsx'
import {
	GIFT_ICON,
	PayOption,
	payMethodIcon,
	SUBSCRIPTION_ICON,
} from '@/ui/components/PayOption.tsx'

/** Тариф витрины: одна карточка, две возможные покупки. */
type PlanOffer = Omit<Plan, 'buyUrl'> & { buyUrl: string | null; giftUrl: string | null }

/**
 * Склеивает обычные тарифы и подарочные в один список: у тарифа может не быть подарочного
 * товара (или наоборот), но карточка всё равно одна — иначе он показался бы дважды.
 */
function mergeOffers(plans: Plan[], gifts: Plan[]): PlanOffer[] {
	const giftByCode = new Map(gifts.map((g) => [g.code, g.buyUrl]))
	const merged = plans.map((p) => ({ ...p, giftUrl: giftByCode.get(p.code) ?? null }))
	// Тариф, который продаётся только как подарок, тоже показываем — но без кнопки покупки.
	const onlyGifts = gifts
		.filter((g) => !plans.some((p) => p.code === g.code))
		.map((g) => ({ ...g, buyUrl: null, giftUrl: g.buyUrl }))
	return [...merged, ...onlyGifts]
}

/**
 * Тариф в витрине: описание и обе покупки рядом.
 *
 * Раньше подарки жили отдельной секцией — тот же список тарифов второй раз, только с другой
 * кнопкой. Отличается не тариф, а кому он достанется, поэтому выбор стоит там же, где и сам тариф.
 */
function PlanRow({
	plan,
	current,
	action,
	subscriptionFee,
	busy,
	onOneTime,
}: {
	plan: PlanOffer
	current: boolean
	action: string
	/** Комиссия подписки Tribute строкой в кнопке — как и у разовых способов. */
	subscriptionFee?: string | undefined
	busy: boolean
	onOneTime: (planCode: string, method: number) => void
}) {
	return (
		<div className={cn(SECTION_CARD, current && 'ring-2 ring-brand')}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="font-semibold">
						{plan.emoji ? `${plan.emoji} ` : ''}
						{plan.name}
					</div>
					<PlanFigures
						className="mt-0.5 block text-sm text-muted-foreground"
						text={`${formatDevices(plan.deviceLimit)}${plan.priceLabel ? ` · ${plan.priceLabel}` : ''}`}
					/>
				</div>
				{current && <span className="shrink-0 text-xs text-brand">ваш тариф</span>}
			</div>
			<div className="mt-3 space-y-2">
				{plan.buyUrl && (
					<PayOption
						label={action}
						fee={subscriptionFee}
						icon={SUBSCRIPTION_ICON}
						primary
						onClick={() => openLink(plan.buyUrl!)}
					/>
				)}
				{plan.giftUrl && (
					<PayOption label="Подарить" icon={GIFT_ICON} onClick={() => openLink(plan.giftUrl!)} />
				)}
			</div>
			{/* Разовая оплата: у неё нет готовой ссылки — форму создаёт бот по нажатию. Сумму на
			    кнопке не пишем: с комиссией провайдера на форме она будет другой. */}
			{plan.oneTimeMethods.length > 0 && (
				<div className="mt-2 space-y-2">
					{plan.oneTimeMethods.map((m) => (
						<PayOption
							key={m.code}
							label={`${m.label} — разово`}
							fee={feeNote(m.feePercent)}
							icon={payMethodIcon(m.code)}
							disabled={busy}
							onClick={() => onOneTime(plan.code, m.code)}
						/>
					))}
				</div>
			)}
		</div>
	)
}

export const Tariffs = reatomComponent(() => {
	// Экран открывают и напрямую по хешу (перезагрузка вебвью), поэтому данные тянет он сам,
	// а не рассчитывает на загрузку соседним экраном.
	useEffect(() => {
		void plansRes.load()
	}, [])

	const [busy, setBusy] = useState(false)

	async function payOnce(planCode: string, method: number) {
		setBusy(true)
		try {
			const { buyUrl } = await startCheckout(planCode, 'self', method)
			openLink(buyUrl)
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось открыть оплату')
		} finally {
			setBusy(false)
		}
	}

	return (
		<Async
			data={plansRes.dataAtom()}
			loading={plansRes.loadingAtom()}
			error={plansRes.errorAtom()}
			className="space-y-4"
		>
			{(data) => (
				<>
					<p className="text-sm text-muted-foreground">
						Серверы, скорость и&nbsp;трафик во&nbsp;всех тарифах одинаковые — отличается только
						число устройств.
					</p>

					<div className="space-y-3">
						{mergeOffers(data.plans, data.gifts).map((offer) => (
							<PlanRow
								key={offer.code}
								plan={offer}
								current={data.current?.planCode === offer.code}
								subscriptionFee={feeNote(data.subscriptionFeePercent)}
								busy={busy}
								onOneTime={(planCode, method) => void payOnce(planCode, method)}
								action={
									data.current
										? data.current.planCode === offer.code
											? 'Продлить'
											: 'Перейти'
										: 'Оформить'
								}
							/>
						))}
					</div>

					<p className="text-xs text-muted-foreground">
						«Подарить» оплачивает сертификат: доступ получит тот, кому вы перешлёте ссылку, а ваша
						подписка не&nbsp;изменится.
					</p>

					{data.current && (
						<p className="text-xs text-muted-foreground">
							Смена тарифа вступит в&nbsp;силу со&nbsp;следующего оплаченного периода.
						</p>
					)}
				</>
			)}
		</Async>
	)
}, 'Tariffs')
