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
	GiftIcon,
	LaptopIcon,
	LoaderCircleIcon,
	SmartphoneIcon,
	UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
	ApiError,
	fetchAdvice,
	startCheckout,
	trackEvent,
	type PaymentChoice,
} from '@/api/client.ts'
import type { Advice, Audience, DeviceNeed } from '@/api/schemas.ts'
import { Button } from '@/components/ui/button.tsx'
import { feeNote, formatDevices } from '@/lib/format.ts'
import { hapticError, hapticSuccess, openLink } from '@/lib/telegram.ts'
import { cn } from '@/lib/utils.ts'
import { watchPayment } from '@/state/payment-watch.ts'
import { navigate } from '@/state/screen.ts'
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
import { PlanFigures, SECTION_CARD } from '@/ui/components/common.tsx'
import {
	GIFT_ICON,
	OptionNote,
	PayOption,
	payMethodIcon,
	SUBSCRIPTION_ICON,
} from '@/ui/components/PayOption.tsx'

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

/**
 * Полоска прогресса: сколько шагов пройдено и сколько осталось. Без подписи «Шаг N из 3» —
 * заполненные сегменты говорят то же самое, а строка под ними только шумела.
 */
function Progress({ step }: { step: WizardStep }) {
	const index = WIZARD_STEPS.indexOf(step)
	return (
		<div className="mb-4 flex gap-1.5">
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
	/**
	 * Без аргумента — подписка Tribute, с кодом метода — разовая оплата (СБП/карта),
	 * `'sbp_sub'` — автопродление по СБП.
	 */
	onBuy: (choice?: PaymentChoice) => void
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
				<PlanFigures
					className="mt-1 block text-base text-muted-foreground"
					text={`${formatDevices(plan.deviceLimit)}${plan.priceLabel ? ` · ${plan.priceLabel}` : ''}`}
				/>

				{/* Что человек получает за деньги — конкретикой, а не общими словами: скорость и
				    трафик, где это работает и когда включится. Число устройств не повторяем —
				    оно строкой выше. */}
				{/* space-y-2 + leading-snug: пункты по две строки без воздуха между ними
				    слипались в абзац, и список переставал читаться списком. */}
				<ul className="mt-4 space-y-2 text-sm leading-snug text-muted-foreground">
					<li>Скорость и трафик не ограничиваем</li>
					<li>Телефон, компьютер, телевизор, роутер — по одной ссылке</li>
					{audience === 'gift' ? (
						<li>Сертификат придёт в чат — перешлёте его получателю</li>
					) : (
						<li>Ключ доступа придёт в чат через минуту после оплаты</li>
					)}
				</ul>
			</div>

			{/* Способы оплаты идут списком «кнопка + сноска»: сумма на кнопке вводила бы в
			    заблуждение — на форме провайдера она будет другой из-за его комиссии. */}
			<PayOption
				label={
					busy
						? 'Открываем оплату…'
						: audience === 'gift'
							? 'Оплатить подарок'
							: advice.oneTimeMethods.length > 0 || advice.sbpSubscription
								? 'Tribute'
								: 'Оформить'
				}
				fee={audience === 'gift' ? undefined : feeNote(advice.subscriptionFeePercent)}
				icon={audience === 'gift' ? GIFT_ICON : SUBSCRIPTION_ICON}
				primary
				disabled={busy}
				onClick={() => onBuy()}
			>
				{audience !== 'gift' && (advice.oneTimeMethods.length > 0 || advice.sbpSubscription) && (
					<OptionNote>
						Доступно автопродление: следующий месяц спишется сам, отменить можно в любой момент.
					</OptionNote>
				)}
			</PayOption>

			{audience !== 'gift' && advice.sbpSubscription && (
				<PayOption
					label="СБП с автопродлением"
					icon={SUBSCRIPTION_ICON}
					disabled={busy}
					onClick={() => onBuy('sbp_sub')}
				>
					<OptionNote>
						Счёт привязывается в&nbsp;приложении банка, {advice.sbpSubscription.amount}&nbsp;₽
						спишется сам раз в&nbsp;{plan.durationDays}&nbsp;дн. Отключить можно на&nbsp;главной.
					</OptionNote>
				</PayOption>
			)}

			{/* Разовая оплата: отдельными кнопками, чтобы разница с подпиской была видна до
			    нажатия, а не выяснялась на форме провайдера. */}
			{advice.oneTimeMethods.map((m) => (
				<PayOption
					key={m.code}
					label={m.label}
					fee={feeNote(m.feePercent)}
					icon={payMethodIcon(m.code)}
					disabled={busy}
					onClick={() => onBuy(m.code)}
				/>
			))}
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

	async function buy(choice?: PaymentChoice) {
		if (!advice?.plan || !audience) return
		setBusy(true)
		try {
			// Ссылку берём у бота, а не из подбора: заодно он запомнит намерение и вернёт
			// человека, если оплата не дойдёт до конца. Для разовой оплаты ссылки заранее и
			// не существует — форму провайдер создаёт на этот платёж.
			const { buyUrl } = await startCheckout(advice.plan.code, audience, choice)
			openLink(buyUrl)
			// Подарок доступ покупателю не меняет — там ждать нечего, сертификат придёт в чат.
			if (audience !== 'gift') {
				watchPayment(() => {
					hapticSuccess()
					toast.success('Оплата прошла — доступ активен')
					wizardReset()
					navigate('home')
				})
			}
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
