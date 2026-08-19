/**
 * Пошаговый подбор тарифа: «кому» → «сколько устройств» → итог с рекомендацией.
 *
 * Зачем шаги вместо витрины: тарифы отличаются только числом устройств, и человек, который
 * этого не знает, видит три одинаковых карточки и уходит. Два вопроса дают тот же выбор, но
 * словами, которыми он думает.
 *
 * Каждый ответ уходит в воронку (`trackEvent`) — без этого не видно, на каком шаге теряем.
 * Ссылку оплаты выбирает бот: подарочный товар — другой продукт, и промахнуться тут значит
 * продать не то.
 */
import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import {
	ArrowLeftIcon,
	CreditCardIcon,
	GiftIcon,
	LaptopIcon,
	LoaderCircleIcon,
	RotateCcwIcon,
	SmartphoneIcon,
	UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ApiError, fetchAdvice, startCheckout, trackEvent } from '@/api/client.ts'
import type { Advice, Audience, DeviceNeed } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { formatDevices } from '@/lib/format.ts'
import { hapticError, hapticSuccess, openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import {
	adviceAtom,
	audienceAtom,
	needAtom,
	stepAtom,
	wizardBack,
	wizardReset,
	WIZARD_STEPS,
	type WizardStep,
} from '@/state/wizard.ts'
import { BRAND_ON, SECTION_CARD } from '@/ui/components/common.tsx'

const AUDIENCE_OPTIONS: Array<{
	value: Audience
	label: string
	hint: string
	Icon: typeof GiftIcon
}> = [
	{ value: 'self', label: 'Себе', hint: 'Подписка на ваш аккаунт', Icon: SmartphoneIcon },
	{
		value: 'gift',
		label: 'В подарок',
		hint: 'Придёт ссылка — перешлёте получателю',
		Icon: GiftIcon,
	},
]

const DEVICE_OPTIONS: Array<{
	value: DeviceNeed
	label: string
	hint: string
	Icon: typeof GiftIcon
}> = [
	{ value: 'one', label: 'Одно устройство', hint: 'Только телефон', Icon: SmartphoneIcon },
	{ value: 'few', label: 'Два-три', hint: 'Телефон, ноутбук, планшет', Icon: LaptopIcon },
	{ value: 'family', label: 'Вся семья', hint: 'Несколько человек или роутер', Icon: UsersIcon },
]

/** Кнопка-ответ: крупная цель под палец, иконка и пояснение под подписью. */
function ChoiceCard({
	label,
	hint,
	Icon,
	selected,
	onClick,
}: {
	label: string
	hint: string
	Icon: typeof GiftIcon
	selected: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				SECTION_CARD,
				'flex w-full items-center gap-3 text-left transition-colors',
				selected ? 'ring-2 ring-brand' : 'hover:bg-muted/50',
			)}
		>
			<Icon className={cn('size-6 shrink-0', selected ? 'text-brand' : 'text-muted-foreground')} />
			<span className="min-w-0">
				<span className="block font-semibold">{label}</span>
				<span className="block text-xs text-muted-foreground">{hint}</span>
			</span>
		</button>
	)
}

/** Полоска прогресса: сколько шагов пройдено и сколько осталось. */
function Progress({ step }: { step: WizardStep }) {
	const index = WIZARD_STEPS.indexOf(step)
	return (
		<div className="mb-4">
			<div className="mb-2 flex gap-1.5">
				{WIZARD_STEPS.map((s, i) => (
					<span
						key={s}
						className={cn(
							'h-1 flex-1 rounded-full transition-colors duration-300',
							i <= index ? 'bg-brand' : 'bg-muted',
						)}
					/>
				))}
			</div>
			<p className="text-xs text-muted-foreground">
				Шаг {index + 1} из {WIZARD_STEPS.length}
			</p>
		</div>
	)
}

/** Итог: рекомендованный тариф и кнопка оплаты. */
function Result({
	advice,
	audience,
	loading,
	busy,
	onBuy,
	onRestart,
}: {
	advice: Advice | null
	audience: Audience
	loading: boolean
	busy: boolean
	/** Без аргумента — подписка Tribute, с кодом метода — разовая оплата (СБП/карта). */
	onBuy: (oneTimeMethod?: number) => void
	onRestart: () => void
}) {
	if (loading || !advice) {
		return (
			<div className={cn(SECTION_CARD, 'flex items-center gap-3 text-sm text-muted-foreground')}>
				<LoaderCircleIcon className="size-4 animate-spin" />
				Подбираем тариф…
			</div>
		)
	}

	if (!advice.plan || !advice.buyUrl) {
		return (
			<div className={SECTION_CARD}>
				<div className="font-semibold">Сейчас нечего предложить</div>
				<p className="mt-2 text-sm text-muted-foreground">
					{audience === 'gift'
						? 'Подарочные подписки временно недоступны. Попробуйте оформить себе.'
						: 'Оплата тарифов временно недоступна — напишите нам, поможем вручную.'}
				</p>
				<Button variant="outline" className="mt-4 w-full" onClick={onRestart}>
					Начать заново
				</Button>
			</div>
		)
	}

	const plan = advice.plan
	return (
		<div className="space-y-3">
			{/* Подсветка кольцом — единственная «награда» за пройденные шаги: экран оплаты,
			    а не игра, поэтому без конфетти. */}
			<div className={cn(SECTION_CARD, 'result-pop ring-2 ring-brand')}>
				<div className="text-xs text-muted-foreground">
					{audience === 'gift' ? 'Подойдёт в подарок' : 'Вам подойдёт'}
				</div>
				<div className="mt-1 text-2xl font-semibold">
					{plan.emoji ? `${plan.emoji} ` : ''}
					{plan.name}
				</div>
				<div className="mt-1 text-sm text-muted-foreground">
					{formatDevices(plan.deviceLimit)}
					{plan.priceLabel ? ` · ${plan.priceLabel}` : ''}
				</div>

				<ul className="mt-3 space-y-1 text-sm text-muted-foreground">
					<li>Серверы, скорость и трафик — как во всех тарифах</li>
					<li>Доступ включается сразу после оплаты</li>
					{audience === 'gift' && <li>Ссылку-сертификат перешлёте получателю сами</li>}
				</ul>
			</div>

			<Button className={cn('w-full', BRAND_ON)} size="lg" disabled={busy} onClick={() => onBuy()}>
				{audience === 'gift' ? (
					<GiftIcon className="size-4" />
				) : (
					<CreditCardIcon className="size-4" />
				)}
				{busy
					? 'Открываем оплату…'
					: audience === 'gift'
						? 'Оплатить подарок'
						: advice.oneTimeMethods.length > 0
							? 'Подписка с автопродлением'
							: 'Оформить'}
			</Button>

			{/* Разовая оплата: отдельными кнопками, чтобы разница с подпиской была видна до
			    нажатия, а не выяснялась на форме провайдера. */}
			{advice.oneTimeMethods.map((m) => (
				<Button
					key={m.code}
					variant="outline"
					className="w-full"
					size="lg"
					disabled={busy}
					onClick={() => onBuy(m.code)}
				>
					<CreditCardIcon className="size-4" />
					{m.label} — {m.amount} ₽ разово
				</Button>
			))}
			<Button variant="ghost" className="w-full" onClick={onRestart}>
				<RotateCcwIcon className="size-4" />
				Ответить заново
			</Button>
		</div>
	)
}

export const Wizard = reatomComponent(() => {
	const step = stepAtom()
	const audience = audienceAtom()
	const need = needAtom()
	const advice = adviceAtom()
	const [loading, setLoading] = useState(false)
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		trackEvent('wizard_open')
	}, [])

	function chooseAudience(value: Audience) {
		hapticSuccess()
		audienceAtom.set(value)
		trackEvent('wizard_audience', value)
		stepAtom.set('devices')
	}

	function chooseDevices(value: DeviceNeed) {
		hapticSuccess()
		needAtom.set(value)
		trackEvent('wizard_devices', value)
		stepAtom.set('result')
		if (!audience) return
		setLoading(true)
		adviceAtom.set(null)
		fetchAdvice(value, audience)
			.then((res) => {
				adviceAtom.set(res)
				trackEvent('wizard_result', res.plan?.code ?? 'none')
			})
			.catch((e: unknown) => {
				hapticError()
				toast.error(e instanceof ApiError ? e.message : 'Не удалось подобрать тариф')
			})
			.finally(() => setLoading(false))
	}

	async function buy(oneTimeMethod?: number) {
		if (!advice?.plan || !audience) return
		setBusy(true)
		try {
			// Ссылку берём у бота, а не из подбора: заодно он запомнит намерение и вернёт
			// человека, если оплата не дойдёт до конца. Для разовой оплаты ссылки заранее и
			// не существует — форму провайдер создаёт на этот платёж.
			const { buyUrl } = await startCheckout(advice.plan.code, audience, oneTimeMethod)
			openLink(buyUrl)
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось открыть оплату')
		} finally {
			setBusy(false)
		}
	}

	return (
		<section>
			<Progress step={step} />

			{/* key на шаге: React пересоздаёт узел, и анимация появления проигрывается заново —
			    иначе слайд был бы виден только на первом переходе. */}
			<div key={step} className="step-in">
				{step === 'audience' && (
					<div className="space-y-3">
						<h2 className="text-lg font-semibold">Кому подписка?</h2>
						{AUDIENCE_OPTIONS.map((o) => (
							<ChoiceCard
								key={o.value}
								label={o.label}
								hint={o.hint}
								Icon={o.Icon}
								selected={audience === o.value}
								onClick={() => chooseAudience(o.value)}
							/>
						))}
					</div>
				)}

				{step === 'devices' && (
					<div className="space-y-3">
						<h2 className="text-lg font-semibold">Сколько устройств подключим?</h2>
						<p className="-mt-1 text-sm text-muted-foreground">
							Это единственное, чем отличаются тарифы.
						</p>
						{DEVICE_OPTIONS.map((o) => (
							<ChoiceCard
								key={o.value}
								label={o.label}
								hint={o.hint}
								Icon={o.Icon}
								selected={need === o.value}
								onClick={() => chooseDevices(o.value)}
							/>
						))}
						<Button variant="ghost" className="w-full" onClick={() => wizardBack()}>
							<ArrowLeftIcon className="size-4" />
							Назад
						</Button>
					</div>
				)}

				{step === 'result' && audience && (
					<Result
						advice={advice}
						audience={audience}
						loading={loading}
						busy={busy}
						onBuy={(method) => void buy(method)}
						onRestart={() => wizardReset()}
					/>
				)}
			</div>
		</section>
	)
}, 'Wizard')
