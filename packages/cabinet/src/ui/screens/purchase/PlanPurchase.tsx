/**
 * Экран «Оформление»: один тариф и все способы его купить.
 *
 * Появился, когда витрина показывала способы оплаты у каждого тарифа сразу — три карточки
 * по четыре кнопки не помещались в голове, не то что на экране. Теперь витрина только
 * сравнивает, а платят здесь: код тарифа приходит вторым сегментом хеша (`#/buy/monthly`),
 * поэтому перезагрузка вебвью возвращает на этот же тариф.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Bone } from '@shared/skeleton/index.ts'

import { ApiError, startCheckout, type PaymentChoice } from '@/api/client.ts'
import { Button } from '@/components/ui/button.tsx'
import { feeNote, formatDevices } from '@/lib/format.ts'
import { mergeOffers, type PlanOffer } from '@/lib/offers.ts'
import { hapticError, hapticSuccess, openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { plansRes } from '@/state/cabinet.ts'
import { watchPayment } from '@/state/payment-watch.ts'
import { navigate, screenParamAtom } from '@/state/screen.ts'
import { Async, PlanFigures, SECTION_CARD } from '@/ui/components/common.tsx'
import { PayMethods } from '@/ui/components/PayMethods.tsx'
import { GIFT_ICON, PayOption } from '@/ui/components/PayOption.tsx'

/** Скелетон: карточка тарифа и две кнопки способов — ростом с `PayOption`. */
const SKELETON = (
	<div className="space-y-3">
		<div className={SECTION_CARD}>
			<div className="flex h-8 items-center">
				<Bone className="h-6 w-36" />
			</div>
			<div className="mt-1 flex h-6 items-center">
				<Bone className="h-4 w-44" />
			</div>
		</div>
		<Bone className="h-14 w-full" />
		<Bone className="h-14 w-full" />
	</div>
)

/** Хеш с кодом, которого нет в списке: тариф сняли с продажи либо ссылку набрали руками. */
function NotFound() {
	return (
		<div className={SECTION_CARD}>
			<div className="font-semibold">Такого тарифа нет</div>
			<p className="mt-2 text-sm text-muted-foreground">
				Возможно, он больше не продаётся. Выберите из актуальных.
			</p>
			<Button variant="outline" className="mt-4 w-full" onClick={() => navigate('tariffs')}>
				Ко всем тарифам
			</Button>
		</div>
	)
}

function Offer({
	offer,
	action,
	changeNote,
	subscriptionFee,
}: {
	offer: PlanOffer
	action: string
	/** Показывать ли сноску про смену тарифа: есть активная подписка на другой тариф. */
	changeNote: boolean
	subscriptionFee: string | undefined
}) {
	const [busy, setBusy] = useState(false)

	/**
	 * Человек ушёл платить в другое окно, а оформление осталось открытым. Ждём подтверждения
	 * и уводим на главную — там карточка подписки с новым сроком (см. state/payment-watch).
	 */
	function awaitPayment() {
		watchPayment(() => {
			hapticSuccess()
			toast.success('Оплата прошла — доступ активен')
			navigate('home')
		})
	}

	async function payOnce(choice: PaymentChoice) {
		setBusy(true)
		try {
			const { buyUrl } = await startCheckout(offer.code, 'self', choice)
			openLink(buyUrl)
			awaitPayment()
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось открыть оплату')
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className="space-y-3">
			<div className={cn(SECTION_CARD, 'ring-2 ring-brand')}>
				<div className="text-2xl font-semibold">
					{offer.emoji ? `${offer.emoji} ` : ''}
					{offer.name}
				</div>
				<PlanFigures
					className="mt-1 block text-base text-muted-foreground"
					text={`${formatDevices(offer.deviceLimit)}${offer.priceLabel ? ` · ${offer.priceLabel}` : ''}`}
				/>
				<ul className="mt-4 space-y-2 text-sm leading-snug text-muted-foreground">
					<li>Скорость и трафик не ограничиваем</li>
					<li>Телефон, компьютер, телевизор, роутер — по одной ссылке</li>
					{offer.buyUrl ? (
						<li>Ключ доступа придёт в чат через минуту после оплаты</li>
					) : (
						<li>Сертификат придёт в чат — перешлёте его получателю</li>
					)}
				</ul>
			</div>

			{/* Способы оплаты идут списком «кнопка + сноска»: сумма на кнопке вводила бы в
			    заблуждение — на форме провайдера она будет другой из-за его комиссии. */}
			{offer.buyUrl && (
				<PayMethods
					subscriptionLabel={action}
					subscriptionFee={subscriptionFee}
					sbpSubscription={offer.sbpSubscription}
					durationDays={offer.durationDays}
					oneTimeMethods={offer.oneTimeMethods}
					busy={busy}
					onPay={(choice) => {
						if (choice === undefined) {
							openLink(offer.buyUrl!)
							awaitPayment()
						} else {
							void payOnce(choice)
						}
					}}
				/>
			)}

			{offer.giftUrl && (
				<PayOption
					label="Подарить"
					icon={GIFT_ICON}
					disabled={busy}
					onClick={() => openLink(offer.giftUrl!)}
				/>
			)}

			{offer.giftUrl && (
				<p className="text-xs text-muted-foreground">
					«Подарить» оплачивает сертификат: доступ получит тот, кому вы перешлёте ссылку, а ваша
					подписка не&nbsp;изменится.
				</p>
			)}

			{changeNote && !!offer.buyUrl && (
				<p className="text-xs text-muted-foreground">
					Смена тарифа вступит в&nbsp;силу со&nbsp;следующего оплаченного периода.
				</p>
			)}
		</div>
	)
}

export const PlanPurchase = reatomComponent(() => {
	const code = screenParamAtom()

	// Экран открывают и напрямую по хешу (перезагрузка вебвью), поэтому данные тянет он сам,
	// а не рассчитывает на загрузку соседним экраном.
	useEffect(() => {
		void plansRes.load()
	}, [])

	return (
		<Async
			data={plansRes.dataAtom()}
			loading={plansRes.loadingAtom()}
			error={plansRes.errorAtom()}
			skeleton={SKELETON}
		>
			{(data) => {
				const offer = mergeOffers(data.plans, data.gifts).find((o) => o.code === code)
				if (!offer) return <NotFound />
				return (
					<Offer
						offer={offer}
						subscriptionFee={feeNote(data.subscriptionFeePercent)}
						changeNote={!!data.current && data.current.planCode !== offer.code}
						action={
							data.current
								? data.current.planCode === offer.code
									? 'Продлить'
									: 'Перейти'
								: 'Оформить'
						}
					/>
				)
			}}
		</Async>
	)
}, 'PlanPurchase')
