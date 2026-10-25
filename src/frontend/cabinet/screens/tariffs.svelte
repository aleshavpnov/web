<script lang="ts">
	/**
	 * Экран «Все тарифы»: витрина отдельной страницей.
	 *
	 * Раньше у каждой карточки стояли все кнопки оплаты сразу — три тарифа по четыре кнопки, и
	 * экран превращался в стену кнопок. Теперь карточка — одна строка с «Выбрать», а способы
	 * оплаты живут на экране оформления: сравнивают здесь, платят там.
	 */
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import { trackEvent } from '#frontend/cabinet/api/client.ts'
	import Async from '#frontend/cabinet/components/async.svelte'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import PlanFigures from '#frontend/cabinet/components/plan-figures.svelte'
	import { formatDevices } from '#frontend/cabinet/lib/format.ts'
	import { mergeOffers, type PlanOffer } from '#frontend/cabinet/lib/offers.ts'
	import { plansRes } from '#frontend/cabinet/state/cabinet.ts'
	import { navigate } from '#frontend/cabinet/state/screen.ts'

	const { data, loading, error } = plansRes

	// Экран открывают и напрямую по хешу (перезагрузка вебвью), поэтому данные тянет он сам,
	// а не рассчитывает на загрузку соседним экраном.
	void plansRes.load()

	function choose(plan: PlanOffer) {
		trackEvent('plan_select', plan.code)
		navigate('buy', plan.code)
	}
</script>

{#snippet skeleton()}
	<div class="tariffs">
		<div class="tariffs__bone-text">
			<Skeleton />
			<Skeleton width="66%" />
		</div>
		{#each { length: 3 }, i (i)}
			<Card>
				<div class="tariffs__row">
					<span class="tariffs__bone-lines">
						<Skeleton width="8rem" height="1rem" />
						<Skeleton width="11rem" />
					</span>
					<Skeleton width="6rem" height="2.25rem" />
				</div>
			</Card>
		{/each}
	</div>
{/snippet}

<Async data={$data} loading={$loading} error={$error} {skeleton} stack>
	{#snippet children(plans)}
		<p class="tariffs__intro">
			Серверы, скорость и&nbsp;трафик во&nbsp;всех тарифах одинаковые — отличается только число устройств.
			«Выбрать» покажет все способы оплаты.
		</p>

		<div class="tariffs__list">
			{#each mergeOffers(plans.plans, plans.gifts) as offer (offer.code)}
				{@const current = plans.current?.planCode === offer.code}
				<Card highlight={current}>
					<div class="tariffs__row">
						<div class="tariffs__info">
							<div class="tariffs__name">
								{offer.emoji ? `${offer.emoji} ` : ''}{offer.name}
								{#if current}<span class="tariffs__current">ваш тариф</span>{/if}
							</div>
							<PlanFigures
								text={`${formatDevices(offer.deviceLimit)}${offer.priceLabel ? ` · ${offer.priceLabel}` : ''}`}
							/>
						</div>
						<Button onclick={() => choose(offer)}>Выбрать</Button>
					</div>
				</Card>
			{/each}
		</div>
	{/snippet}
</Async>

<style>
	.tariffs {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__bone-text {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}

		&__bone-lines {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.375rem;
		}

		&__intro {
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__list {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		&__row {
			display: flex;
			gap: 0.75rem;
			align-items: center;
		}

		&__info {
			flex: 1;
			min-width: 0;
		}

		&__name {
			font-weight: 600;
		}

		&__current {
			margin-left: 0.5rem;
			font-size: 0.75rem;
			font-weight: 400;
			color: var(--brand);
		}
	}
</style>
