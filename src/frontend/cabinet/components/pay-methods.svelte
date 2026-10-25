<script lang="ts">
	/**
	 * Способы оплаты тарифа — одни на экран оформления и визард.
	 *
	 * Когда у тарифа есть и подписка, и разовая оплата, сначала спрашиваем, как платить,
	 * а способы показываем уже внутри выбранной группы. Пять кнопок подряд заставляли
	 * сравнивать провайдеров, хотя человек ещё не решил главное: продлевать самому или нет.
	 * Без разовой оплаты шага нет, сразу способы подписки.
	 */
	import { ArrowLeft, Wallet } from '@lucide/svelte'

	import type { PaymentChoice } from '#frontend/cabinet/api/client.ts'
	import type { OneTimeMethod } from '#frontend/cabinet/api/schemas.ts'
	import { feeNote } from '#frontend/cabinet/lib/format.ts'
	import { payMethodIcon, SUBSCRIPTION_ICON } from '#frontend/cabinet/lib/pay-icons.ts'

	import Button from './button.svelte'
	import OptionNote from './option-note.svelte'
	import PayOption from './pay-option.svelte'

	type Group = 'sub' | 'once'

	let {
		subscriptionLabel,
		subscriptionFee,
		sbpSubscription,
		durationDays,
		oneTimeMethods,
		busy,
		onpay,
	}: {
		/** Подпись кнопки Tribute, когда она единственная в группе («Оформить», «Продлить»). */
		subscriptionLabel: string
		subscriptionFee: string | undefined
		sbpSubscription: { amount: number } | null
		durationDays: number
		oneTimeMethods: OneTimeMethod[]
		busy: boolean
		/** Без аргумента — подписка Tribute, иначе выбранный способ Platega. */
		onpay: (choice?: PaymentChoice) => void
	} = $props()

	let picked = $state<Group | null>(null)

	const hasOnce = $derived(oneTimeMethods.length > 0)
	const group: Group | null = $derived(hasOnce ? picked : 'sub')
</script>

{#if group === null}
	<!-- Две плитки рядом, пояснение внутри: выбор один из двух, и сноска под кнопкой
	     читалась как часть следующего способа, а не своего. -->
	<div class="pay-methods__groups">
		<button
			type="button"
			class="pay-methods__group pay-methods__group--primary"
			disabled={busy}
			onclick={() => (picked = 'sub')}
		>
			<SUBSCRIPTION_ICON size={28} strokeWidth={1.75} />
			<span class="pay-methods__group-title">Подписка</span>
			<span class="pay-methods__group-note">Спишется сама раз в период, отменить можно в любой момент</span>
		</button>
		<button type="button" class="pay-methods__group" disabled={busy} onclick={() => (picked = 'once')}>
			<Wallet size={28} strokeWidth={1.75} />
			<span class="pay-methods__group-title">Разово</span>
			<span class="pay-methods__group-note">Платите один раз, продлевать нужно самому</span>
		</button>
	</div>
{:else}
	{#if group === 'sub'}
		<PayOption
			label={sbpSubscription ? 'Tribute' : subscriptionLabel}
			fee={subscriptionFee}
			icon={SUBSCRIPTION_ICON}
			primary
			disabled={busy}
			onclick={() => onpay()}
		>
			{#if sbpSubscription}<OptionNote>Оплата картой, отменить можно в Tribute.</OptionNote>{/if}
		</PayOption>
		{#if sbpSubscription}
			<PayOption
				label="СБП с автопродлением"
				icon={SUBSCRIPTION_ICON}
				disabled={busy}
				onclick={() => onpay('sbp_sub')}
			>
				<OptionNote>
					Счёт привязывается в&nbsp;приложении банка, {sbpSubscription.amount}&nbsp;₽ спишется сам раз в&nbsp;{durationDays}&nbsp;дн.
					Отключить можно на&nbsp;главной.
				</OptionNote>
			</PayOption>
		{/if}
	{:else}
		<!-- У разовой оплаты нет готовой ссылки — форму создаёт бот по нажатию. -->
		{#each oneTimeMethods as m (m.code)}
			<PayOption
				label={m.label}
				fee={feeNote(m.feePercent)}
				icon={payMethodIcon(m.code)}
				disabled={busy}
				onclick={() => onpay(m.code)}
			/>
		{/each}
	{/if}
	{#if hasOnce}
		<span class="pay-methods__back">
			<Button variant="ghost" wide disabled={busy} onclick={() => (picked = null)}>
				<ArrowLeft size={16} />
				Другой способ оплаты
			</Button>
		</span>
	{/if}
{/if}

<style>
	.pay-methods {
		&__groups {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}

		&__group {
			cursor: pointer;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
			width: 100%;
			padding: 0.75rem;
			border: 1px solid var(--input-border);
			border-radius: var(--radius);
			font: inherit;
			color: inherit;
			text-align: left;
			background: var(--input-bg);
			transition: background-color 0.15s;

			&:hover {
				background: var(--surface);
			}

			&:disabled {
				pointer-events: none;
				opacity: 0.5;
			}

			&--primary {
				border-color: transparent;
				color: var(--brand-fg);
				background: var(--brand);

				&:hover {
					background: color-mix(in srgb, var(--brand) 85%, transparent);
				}
			}
		}

		&__group-title {
			font-size: 1.125rem;
			font-weight: 600;
			line-height: 1.25;
		}

		&__group-note {
			font-size: 0.75rem;
			line-height: 1.375;
			opacity: 0.75;
		}

		&__back {
			display: block;
			color: var(--muted);
		}
	}
</style>
