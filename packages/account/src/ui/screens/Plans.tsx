/**
 * Экран «Подписка и тарифы»: витрина, переход к оплате и подарочные сертификаты.
 *
 * Деньги живут в Tribute — кабинет только уводит туда ссылкой. Своей формы оплаты нет и
 * быть не должно: карту клиента мы не видим и видеть не хотим.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { CreditCardIcon, ExternalLinkIcon, GiftIcon, SettingsIcon } from 'lucide-react'

import { trackEvent } from '@/api/client.ts'
import type { Plan } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { formatDevices } from '@/lib/format.ts'
import { openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { plansRes } from '@/state/cabinet.ts'
import {
	Async,
	BRAND_ON,
	CopyValue,
	SECTION_CARD,
	SectionHeading,
	SectionTitle,
} from '@/ui/components/common.tsx'
import { Wizard } from '@/ui/screens/purchase/Wizard.tsx'

/**
 * Тариф в витрине: описание и обе покупки рядом.
 *
 * Раньше подарки жили отдельной секцией — тот же список тарифов второй раз, только с
 * другой кнопкой. Отличается не тариф, а кому он достанется, поэтому выбор стоит там же,
 * где и сам тариф.
 */
function PlanRow({
	plan,
	current,
	action,
	giftUrl,
	onBuy,
	onGift,
}: {
	plan: PlanOffer
	current: boolean
	action: string
	giftUrl: string | null
	onBuy: () => void
	onGift: () => void
}) {
	return (
		<div className={cn(SECTION_CARD, current && 'ring-2 ring-brand')}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="font-semibold">
						{plan.emoji ? `${plan.emoji} ` : ''}
						{plan.name}
					</div>
					<div className="mt-0.5 text-xs text-muted-foreground">
						{formatDevices(plan.deviceLimit)}
						{plan.priceLabel ? ` · ${plan.priceLabel}` : ''}
					</div>
				</div>
				{current && <span className="shrink-0 text-xs text-brand">ваш тариф</span>}
			</div>
			<div className="mt-3 flex gap-2">
				{plan.buyUrl && (
					<Button className={cn('flex-1', BRAND_ON)} onClick={onBuy}>
						<CreditCardIcon className="size-4" />
						{action}
					</Button>
				)}
				{giftUrl && (
					// Без обычной ссылки подарок остаётся единственной покупкой — тогда он и
					// занимает всю ширину, а не жмётся половинкой к пустоте.
					<Button
						variant="outline"
						className={cn(plan.buyUrl ? 'flex-1' : 'w-full')}
						onClick={onGift}
					>
						<GiftIcon className="size-4" />
						Подарить
					</Button>
				)}
			</div>
		</div>
	)
}

/** Тариф витрины: одна карточка, две возможные покупки. */
type PlanOffer = Omit<Plan, 'buyUrl'> & { buyUrl: string | null }

/**
 * Склеивает обычные тарифы и подарочные в один список: у тарифа может не быть подарочного
 * товара (или наоборот), но карточка всё равно одна — иначе он показался бы дважды.
 */
function mergeOffers(plans: Plan[], gifts: Plan[]): Array<PlanOffer & { giftUrl: string | null }> {
	const giftByCode = new Map(gifts.map((g) => [g.code, g.buyUrl]))
	const merged = plans.map((p) => ({
		...p,
		buyUrl: p.buyUrl,
		giftUrl: giftByCode.get(p.code) ?? null,
	}))
	// Тариф, который продаётся только как подарок, тоже показываем — но без кнопки покупки.
	const onlyGifts = gifts
		.filter((g) => !plans.some((p) => p.code === g.code))
		.map((g) => ({ ...g, buyUrl: null, giftUrl: g.buyUrl }))
	return [...merged, ...onlyGifts]
}

export const Plans = reatomComponent(() => {
	// Список тарифов свёрнут: экран открывается подбором, а витрина — для тех, кто уже
	// знает, чего хочет.
	const [listOpen, setListOpen] = useState(false)

	useEffect(() => {
		void plansRes.load()
	}, [])

	function openList() {
		setListOpen(true)
		trackEvent('plans_list_open')
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
					<Wizard />

					{!listOpen && (
						<button
							type="button"
							onClick={openList}
							className="flex min-h-11 w-full items-center justify-center gap-1 text-sm text-muted-foreground underline underline-offset-4"
						>
							Показать все тарифы
						</button>
					)}

					{listOpen && (
						<>
							<div>
								<SectionHeading className="mt-2 mb-1">Тарифы</SectionHeading>
								<p className="text-sm text-muted-foreground">
									Серверы, скорость и&nbsp;трафик во&nbsp;всех тарифах одинаковые — отличается
									только число устройств.
								</p>
							</div>

							<div className="space-y-3">
								{mergeOffers(data.plans, data.gifts).map((offer) => (
									<PlanRow
										key={offer.code}
										plan={offer}
										giftUrl={offer.giftUrl}
										current={data.current?.planCode === offer.code}
										action={
											data.current
												? data.current.planCode === offer.code
													? 'Продлить'
													: 'Перейти'
												: 'Оформить'
										}
										onBuy={() => offer.buyUrl && openLink(offer.buyUrl)}
										onGift={() => offer.giftUrl && openLink(offer.giftUrl)}
									/>
								))}
							</div>

							<p className="text-xs text-muted-foreground">
								«Подарить» оплачивает сертификат: доступ получит тот, кому вы перешлёте ссылку, а
								ваша подписка не&nbsp;изменится.
							</p>
						</>
					)}

					{listOpen && data.current && (
						<p className="text-xs text-muted-foreground">
							Смена тарифа вступит в&nbsp;силу со&nbsp;следующего оплаченного периода.
						</p>
					)}

					{data.manageUrl && (
						<Button variant="outline" className="w-full" onClick={() => openLink(data.manageUrl!)}>
							<SettingsIcon className="size-4" />
							Управлять подпиской в Tribute
							<ExternalLinkIcon className="size-3.5 opacity-60" />
						</Button>
					)}

					{data.pendingGifts.length > 0 && (
						<section className={SECTION_CARD}>
							<SectionTitle className="mb-1">Ваши сертификаты</SectionTitle>
							<p className="mb-3 text-xs text-muted-foreground">
								Перешлите ссылку тому, кому дарите: доступ включится, когда он её откроет.
							</p>
							<div className="space-y-2">
								{data.pendingGifts.map((gift) => (
									<CopyValue
										key={gift.deepLink}
										value={gift.deepLink}
										className="w-full justify-between rounded-lg bg-muted px-3 py-2 text-sm"
									>
										<span className="truncate">{gift.planName}</span>
									</CopyValue>
								))}
							</div>
						</section>
					)}
				</>
			)}
		</Async>
	)
}, 'Plans')
