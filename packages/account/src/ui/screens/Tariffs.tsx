/**
 * Экран «Все тарифы»: витрина отдельной страницей.
 *
 * Раньше у каждой карточки стояли все кнопки оплаты сразу — три тарифа по четыре кнопки, и
 * экран превращался в стену кнопок. Теперь карточка — одна строка с «Выбрать», а способы
 * оплаты живут на экране оформления: сравнивают здесь, платят там.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect } from 'react'

import { Bone, ListBone } from '@shared/skeleton/index.ts'

import { trackEvent } from '@/api/client.ts'
import { formatDevices } from '@/lib/format.ts'
import { mergeOffers, type PlanOffer } from '@/lib/offers.ts'
import { cn } from '@/lib/utils.ts'
import { plansRes } from '@/state/cabinet.ts'
import { navigate } from '@/state/screen.ts'
import { Button } from '@/components/ui/button.tsx'
import { Async, PlanFigures, SECTION_CARD } from '@/ui/components/common.tsx'

/** Тариф в витрине: строка-сводка и кнопка на экран оформления. */
function PlanRow({ plan, current }: { plan: PlanOffer; current: boolean }) {
	function choose() {
		trackEvent('plan_select', plan.code)
		navigate('buy', plan.code)
	}

	return (
		<div className={cn(SECTION_CARD, 'flex items-center gap-3', current && 'ring-2 ring-brand')}>
			<div className="min-w-0 flex-1">
				<div className="font-semibold">
					{plan.emoji ? `${plan.emoji} ` : ''}
					{plan.name}
					{current && <span className="ml-2 text-xs font-normal text-brand">ваш тариф</span>}
				</div>
				<PlanFigures
					className="mt-0.5 block text-sm text-muted-foreground"
					text={`${formatDevices(plan.deviceLimit)}${plan.priceLabel ? ` · ${plan.priceLabel}` : ''}`}
				/>
			</div>
			<Button variant="outline" className="shrink-0" onClick={choose}>
				Выбрать
			</Button>
		</div>
	)
}

/** Скелетон витрины: три строки тарифов с кнопкой справа. */
const SKELETON = (
	<div className="space-y-4">
		<div className="space-y-1.5">
			<Bone className="h-3.5 w-full" />
			<Bone className="h-3.5 w-2/3" />
		</div>
		<ListBone
			className="space-y-3"
			count={3}
			row={
				<div className={cn(SECTION_CARD, 'flex items-center gap-3')}>
					<div className="min-w-0 flex-1 space-y-1.5">
						<Bone className="h-4 w-32" />
						<Bone className="h-3.5 w-44" />
					</div>
					<Bone className="h-9 w-24 shrink-0 rounded-md" />
				</div>
			}
		/>
	</div>
)

export const Tariffs = reatomComponent(() => {
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
			className="space-y-4"
			skeleton={SKELETON}
		>
			{(data) => (
				<>
					<p className="text-sm text-muted-foreground">
						Серверы, скорость и&nbsp;трафик во&nbsp;всех тарифах одинаковые — отличается только
						число устройств. «Выбрать» покажет все способы оплаты.
					</p>

					<div className="space-y-3">
						{mergeOffers(data.plans, data.gifts).map((offer) => (
							<PlanRow
								key={offer.code}
								plan={offer}
								current={data.current?.planCode === offer.code}
							/>
						))}
					</div>
				</>
			)}
		</Async>
	)
}, 'Tariffs')
