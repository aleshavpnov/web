<script lang="ts">
	/**
	 * Экран «Оформление»: один тариф и все способы его купить.
	 *
	 * Появился, когда витрина показывала способы оплаты у каждого тарифа сразу — три карточки
	 * по четыре кнопки не помещались в голове, не то что на экране. Теперь витрина только
	 * сравнивает, а платят здесь: код тарифа приходит вторым сегментом хеша (`#/buy/monthly`),
	 * поэтому перезагрузка вебвью возвращает на этот же тариф.
	 */
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import Async from '#frontend/cabinet/components/async.svelte'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import TextBone from '#frontend/cabinet/components/bones/text-bone.svelte'
	import { feeNote } from '#frontend/cabinet/lib/format.ts'
	import { mergeOffers } from '#frontend/cabinet/lib/offers.ts'
	import { plansRes } from '#frontend/cabinet/state/cabinet.ts'
	import { navigate, screenParamAtom } from '#frontend/cabinet/state/screen.ts'

	import Offer from './offer.svelte'

	const { data, loading, error } = plansRes

	// Экран открывают и напрямую по хешу (перезагрузка вебвью), поэтому данные тянет он сам,
	// а не рассчитывает на загрузку соседним экраном.
	void plansRes.load()
</script>

<!-- Скелетон: карточка тарифа и две кнопки способов — ростом с `PayOption`. -->
{#snippet skeleton()}
	<div class="plan-purchase">
		<Card>
			<TextBone line="2xl" width="9rem" height="1.5rem" />
			<span class="plan-purchase__bone-figures"><TextBone line="base" width="11rem" height="1rem" /></span>
		</Card>
		<Skeleton height="3.5rem" />
		<Skeleton height="3.5rem" />
	</div>
{/snippet}

<Async data={$data} loading={$loading} error={$error} {skeleton}>
	{#snippet children(plans)}
		{@const offer = mergeOffers(plans.plans, plans.gifts).find((o) => o.code === $screenParamAtom)}
		{#if offer}
			<Offer
				{offer}
				subscriptionFee={feeNote(plans.subscriptionFeePercent)}
				changeNote={!!plans.current && plans.current.planCode !== offer.code}
				action={plans.current ? (plans.current.planCode === offer.code ? 'Продлить' : 'Перейти') : 'Оформить'}
			/>
		{:else}
			<!-- Хеш с кодом, которого нет в списке: тариф сняли с продажи либо ссылку набрали руками. -->
			<Card>
				<div class="plan-purchase__title">Такого тарифа нет</div>
				<p class="plan-purchase__text">Возможно, он больше не продаётся. Выберите из актуальных.</p>
				<div class="plan-purchase__button">
					<Button wide onclick={() => navigate('tariffs')}>Ко всем тарифам</Button>
				</div>
			</Card>
		{/if}
	{/snippet}
</Async>

<style>
	.plan-purchase {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		&__bone-figures {
			display: block;
			margin-top: 0.25rem;
		}

		&__title {
			font-weight: 600;
		}

		&__text {
			margin-top: 0.5rem;
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__button {
			margin-top: 1rem;
		}
	}
</style>
