<script lang="ts">
	import { ApiError, startCheckout, type PaymentChoice } from '#frontend/cabinet/api/client.ts'
	import Card from '#frontend/cabinet/components/card.svelte'
	import GiftPayMethods from '#frontend/cabinet/components/gift-pay-methods.svelte'
	import PayMethods from '#frontend/cabinet/components/pay-methods.svelte'
	import PayOption from '#frontend/cabinet/components/pay-option.svelte'
	import PlanFigures from '#frontend/cabinet/components/plan-figures.svelte'
	import { formatDevices } from '#frontend/cabinet/lib/format.ts'
	import { canGift, type PlanOffer } from '#frontend/cabinet/lib/offers.ts'
	import { GIFT_ICON } from '#frontend/cabinet/lib/pay-icons.ts'
	import { hapticError, hapticSuccess, openLink } from '#frontend/cabinet/lib/telegram.ts'
	import { watchPayment } from '#frontend/cabinet/state/payment-watch.ts'
	import { navigate } from '#frontend/cabinet/state/screen.ts'
	import { toast } from '#frontend/lib/toast.ts'

	import PlanPerks from './plan-perks.svelte'

	let {
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
	} = $props()

	let busy = $state(false)
	let giftOpen = $state(false)

	const giftable = $derived(canGift(offer))

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

	async function checkout(audience: 'self' | 'gift', choice: PaymentChoice) {
		busy = true

		try {
			const { buyUrl } = await startCheckout(offer.code, audience, choice)

			openLink(buyUrl)

			if (audience === 'self') awaitPayment()
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось открыть оплату')
		} finally {
			busy = false
		}
	}

	function paySelf(choice?: PaymentChoice) {
		if (choice !== undefined) {
			void checkout('self', choice)

			return
		}

		if (offer.buyUrl) openLink(offer.buyUrl)

		awaitPayment()
	}

	/** Подарок доступ покупателю не меняет — ждать нечего, сертификат придёт в чат. */
	function payGift(choice?: number) {
		if (choice !== undefined) void checkout('gift', choice)
		else if (offer.giftUrl) openLink(offer.giftUrl)
	}
</script>

<div class="offer">
	<Card highlight>
		<div class="offer__name">{offer.emoji ? `${offer.emoji} ` : ''}{offer.name}</div>
		<PlanFigures
			size="base"
			text={`${formatDevices(offer.deviceLimit)}${offer.priceLabel ? ` · ${offer.priceLabel}` : ''}`}
		/>
		<PlanPerks gift={!offer.buyUrl} />
	</Card>

	<!-- Способы оплаты идут списком «кнопка + сноска»: сумма на кнопке вводила бы в
	     заблуждение — на форме провайдера она будет другой из-за его комиссии. -->
	{#if offer.buyUrl}
		<PayMethods
			subscriptionLabel={action}
			{subscriptionFee}
			sbpSubscription={offer.sbpSubscription}
			durationDays={offer.durationDays}
			oneTimeMethods={offer.oneTimeMethods}
			{busy}
			onpay={paySelf}
		/>
	{/if}

	<!-- Тариф только в подарок — способы сразу; иначе сначала кнопка «Подарить», чтобы
	     способы подарка не смешивались со способами покупки себе. -->
	{#if giftable && (giftOpen || !offer.buyUrl)}
		<GiftPayMethods
			tributeUrl={offer.giftUrl}
			tributeFee={subscriptionFee}
			oneTimeMethods={offer.giftMethods}
			{busy}
			onpay={payGift}
		/>
	{/if}

	{#if giftable && !giftOpen && offer.buyUrl}
		<PayOption
			label="Подарить"
			icon={GIFT_ICON}
			disabled={busy}
			onclick={() => {
				if (offer.giftMethods.length > 0) giftOpen = true
				else if (offer.giftUrl) openLink(offer.giftUrl)
			}}
		/>
	{/if}

	{#if giftable}
		<p class="offer__note">
			«Подарить» оплачивает сертификат: доступ получит тот, кому вы перешлёте ссылку, а ваша подписка
			не&nbsp;изменится.
		</p>
	{/if}

	{#if changeNote && offer.buyUrl}
		<p class="offer__note">Смена тарифа вступит в&nbsp;силу со&nbsp;следующего оплаченного периода.</p>
	{/if}
</div>

<style>
	.offer {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		&__name {
			font-size: 1.5rem;
			font-weight: 600;
		}

		&__note {
			font-size: 0.75rem;
			color: var(--muted);
		}
	}
</style>
