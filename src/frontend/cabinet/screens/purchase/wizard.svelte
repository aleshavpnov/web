<script lang="ts">
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
	import { ArrowLeft, Gift, Laptop, LoaderCircle, Smartphone, Users, type LucideIcon } from '@lucide/svelte'

	import {
		ApiError,
		fetchAdvice,
		startCheckout,
		trackEvent,
		type PaymentChoice,
	} from '#frontend/cabinet/api/client.ts'
	import type { Audience, DeviceNeed } from '#frontend/cabinet/api/schemas.ts'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import GiftPayMethods from '#frontend/cabinet/components/gift-pay-methods.svelte'
	import PayMethods from '#frontend/cabinet/components/pay-methods.svelte'
	import PlanFigures from '#frontend/cabinet/components/plan-figures.svelte'
	import { feeNote, formatDevices } from '#frontend/cabinet/lib/format.ts'
	import { hapticError, hapticSuccess, openLink } from '#frontend/cabinet/lib/telegram.ts'
	import { watchPayment } from '#frontend/cabinet/state/payment-watch.ts'
	import { navigate } from '#frontend/cabinet/state/screen.ts'
	import {
		adviceAtom,
		audienceAtom,
		needAtom,
		stepAtom,
		WIZARD_STEPS,
		wizardBack,
		wizardReset,
	} from '#frontend/cabinet/state/wizard.ts'
	import { toast } from '#frontend/lib/toast.ts'

	import ChoiceCard from './choice-card.svelte'
	import PlanPerks from './plan-perks.svelte'

	type Option<T> = { value: T; label: string; hint: string; icon: LucideIcon }

	const AUDIENCE_OPTIONS: Option<Audience>[] = [
		{ value: 'self', label: 'Себе', hint: 'Подписка на ваш аккаунт', icon: Smartphone },
		{ value: 'gift', label: 'В подарок', hint: 'Придёт ссылка — перешлёте получателю', icon: Gift },
	]

	const DEVICE_OPTIONS: Option<DeviceNeed>[] = [
		{ value: 'one', label: 'Одно устройство', hint: 'Только телефон', icon: Smartphone },
		{ value: 'few', label: 'Два-три', hint: 'Телефон, ноутбук, планшет', icon: Laptop },
		{ value: 'family', label: 'Вся семья', hint: 'Несколько человек или роутер', icon: Users },
	]

	let loading = $state(false)
	let busy = $state(false)

	const stepIndex = $derived(WIZARD_STEPS.indexOf($stepAtom))

	trackEvent('wizard_open')

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

		const audience = audienceAtom()

		if (!audience) return

		loading = true
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
			.finally(() => (loading = false))
	}

	/**
	 * Без аргумента — подписка Tribute, с кодом метода — разовая оплата (СБП/карта),
	 * `'sbp_sub'` — автопродление по СБП.
	 */
	async function buy(choice?: PaymentChoice) {
		const advice = adviceAtom()
		const audience = audienceAtom()

		if (!advice?.plan || !audience) return

		busy = true

		try {
			// Ссылку берём у бота, а не из подбора: заодно он запомнит намерение и вернёт
			// человека, если оплата не дойдёт до конца. Для разовой оплаты ссылки заранее и
			// не существует — форму провайдер создаёт на этот платёж.
			const { buyUrl } = await startCheckout(advice.plan.code, audience, choice)

			openLink(buyUrl)

			// Подарок доступ покупателю не меняет — там ждать нечего, сертификат придёт в чат.
			if (audience !== 'gift')
				watchPayment(() => {
					hapticSuccess()
					toast.success('Оплата прошла — доступ активен')
					wizardReset()
					navigate('home')
				})
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось открыть оплату')
		} finally {
			busy = false
		}
	}
</script>

<section>
	<!-- Полоска прогресса: заполненные сегменты говорят то же, что «Шаг N из 3», без шума. -->
	<div class="wizard__progress">
		{#each WIZARD_STEPS as s, i (s)}
			<span class={['wizard__segment', i <= stepIndex && 'wizard__segment--done']}></span>
		{/each}
	</div>

	<!-- key на шаге: узел пересоздаётся, и анимация появления проигрывается заново —
	     иначе слайд был бы виден только на первом переходе. -->
	{#key $stepAtom}
		<div class="wizard__step">
			{#if $stepAtom === 'audience'}
				<h2 class="wizard__question">Кому подписка?</h2>
				{#each AUDIENCE_OPTIONS as o (o.value)}
					<ChoiceCard
						label={o.label}
						hint={o.hint}
						icon={o.icon}
						selected={$audienceAtom === o.value}
						onclick={() => chooseAudience(o.value)}
					/>
				{/each}
			{:else if $stepAtom === 'devices'}
				<h2 class="wizard__question">Сколько устройств подключим?</h2>
				<p class="wizard__lead">Это единственное, чем отличаются тарифы.</p>
				{#each DEVICE_OPTIONS as o (o.value)}
					<ChoiceCard
						label={o.label}
						hint={o.hint}
						icon={o.icon}
						selected={$needAtom === o.value}
						onclick={() => chooseDevices(o.value)}
					/>
				{/each}
				<Button variant="ghost" wide onclick={() => wizardBack()}>
					<ArrowLeft size={16} />
					Назад
				</Button>
			{:else if $audienceAtom}
				{@const audience = $audienceAtom}
				{@const advice = $adviceAtom}
				{#if loading || !advice}
					<Card>
						<span class="wizard__loading"
							><LoaderCircle class="wizard__spinner" size={16} />Подбираем тариф…</span
						>
					</Card>
					<!-- Подарок без товара Tribute продаётся разовой оплатой — ссылки тогда нет, но купить можно. -->
				{:else if !advice.plan || (!advice.buyUrl && advice.oneTimeMethods.length === 0)}
					<Card>
						<div class="wizard__title">Сейчас нечего предложить</div>
						<p class="wizard__text">
							{audience === 'gift'
								? 'Подарочные подписки временно недоступны. Попробуйте оформить себе.'
								: 'Оплата тарифов временно недоступна — напишите нам, поможем вручную.'}
						</p>
						<div class="wizard__restart">
							<Button wide onclick={() => wizardReset()}>Начать заново</Button>
						</div>
					</Card>
				{:else}
					{@const plan = advice.plan}
					<!-- Подсветка кольцом — единственная «награда» за пройденные шаги: экран оплаты,
					     а не игра, поэтому без конфетти. -->
					<div class="wizard__result">
						<Card highlight>
							<div class="wizard__caption">
								{audience === 'gift' ? 'Подойдёт в подарок' : 'Вам подойдёт'}
							</div>
							<div class="wizard__plan">{plan.emoji ? `${plan.emoji} ` : ''}{plan.name}</div>
							<PlanFigures
								size="base"
								text={`${formatDevices(plan.deviceLimit)}${plan.priceLabel ? ` · ${plan.priceLabel}` : ''}`}
							/>
							<PlanPerks gift={audience === 'gift'} />
						</Card>
					</div>

					<!-- Способы оплаты идут списком «кнопка + сноска»: сумма на кнопке вводила бы в
					     заблуждение — на форме провайдера она будет другой из-за его комиссии. -->
					{#if audience === 'gift'}
						<GiftPayMethods
							tributeUrl={advice.buyUrl}
							tributeFee={feeNote(advice.subscriptionFeePercent)}
							oneTimeMethods={advice.oneTimeMethods}
							{busy}
							onpay={buy}
						/>
					{:else}
						<PayMethods
							subscriptionLabel={busy ? 'Открываем оплату…' : 'Оформить'}
							subscriptionFee={feeNote(advice.subscriptionFeePercent)}
							sbpSubscription={advice.sbpSubscription}
							durationDays={plan.durationDays}
							oneTimeMethods={advice.oneTimeMethods}
							{busy}
							onpay={buy}
						/>
					{/if}
				{/if}
			{/if}
		</div>
	{/key}
</section>

<style>
	.wizard {
		&__progress {
			display: flex;
			gap: 0.375rem;
			margin-bottom: 1rem;
		}

		&__segment {
			flex: 1;
			height: 0.25rem;
			border-radius: 999px;
			background: var(--surface);
			transition: background-color 0.3s;

			&--done {
				background: var(--brand-fill);
			}
		}

		&__step {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			animation: step-in 300ms cubic-bezier(0.22, 1, 0.36, 1);

			@media (--reduced-motion) {
				animation: none;
			}
		}

		&__question {
			font-size: 1.125rem;
			font-weight: 600;
		}

		&__lead {
			margin-top: -0.25rem;
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__loading {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			font-size: 0.875rem;
			color: var(--muted);

			:global(.wizard__spinner) {
				animation: spin 1s linear infinite;
			}
		}

		&__title {
			font-weight: 600;
		}

		&__text {
			margin-top: 0.5rem;
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__restart {
			margin-top: 1rem;
		}

		&__result {
			animation: result-pop 320ms cubic-bezier(0.22, 1, 0.36, 1);

			@media (--reduced-motion) {
				animation: none;
			}
		}

		&__caption {
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__plan {
			margin-top: 0.25rem;
			font-size: 1.5rem;
			font-weight: 600;
		}
	}

	@keyframes step-in {
		from {
			transform: translateX(1.25rem);
			opacity: 0;
		}

		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes result-pop {
		from {
			transform: scale(0.96);
			opacity: 0;
		}

		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}
</style>
