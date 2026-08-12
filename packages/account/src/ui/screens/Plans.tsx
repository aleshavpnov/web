/**
 * Экран «Подписка и тарифы»: витрина, переход к оплате и подарочные сертификаты.
 *
 * Деньги живут в Tribute — кабинет только уводит туда ссылкой. Своей формы оплаты нет и
 * быть не должно: карту клиента мы не видим и видеть не хотим.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'
import { ExternalLinkIcon, GiftIcon, SettingsIcon } from 'lucide-react'

import type { Plan } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { formatDevices } from '@/lib/format.ts'
import { openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { plansRes } from '@/state/cabinet.ts'
import { Async, BRAND_ON, CopyValue, SECTION_CARD, SectionTitle } from '@/ui/components/common.tsx'

function PlanRow({
	plan,
	current,
	action,
	onBuy,
}: {
	plan: Plan
	current: boolean
	action: string
	onBuy: () => void
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
			<Button className={cn('mt-3 w-full', BRAND_ON)} onClick={onBuy}>
				{action}
			</Button>
		</div>
	)
}

export const Plans = reatomComponent(() => {
	useEffect(() => {
		void plansRes.load()
	}, [])

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
						{data.plans.map((plan) => (
							<PlanRow
								key={plan.code}
								plan={plan}
								current={data.current?.planCode === plan.code}
								action={
									data.current
										? data.current.planCode === plan.code
											? 'Продлить'
											: 'Перейти на этот тариф'
										: 'Оформить'
								}
								onBuy={() => openLink(plan.buyUrl)}
							/>
						))}
					</div>

					{data.current && (
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

					{data.gifts.length > 0 && (
						<section>
							<SectionTitle>Подарить подписку</SectionTitle>
							<div className="space-y-3">
								{data.gifts.map((plan) => (
									<div key={plan.code} className={SECTION_CARD}>
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
										</div>
										<Button
											variant="outline"
											className="mt-3 w-full"
											onClick={() => openLink(plan.buyUrl)}
										>
											<GiftIcon className="size-4" />
											Оплатить подарок
										</Button>
									</div>
								))}
							</div>
						</section>
					)}
				</>
			)}
		</Async>
	)
}, 'Plans')
