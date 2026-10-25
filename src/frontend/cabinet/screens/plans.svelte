<script lang="ts">
	/**
	 * Экран «Тарифы»: подбор тарифа, управление оплатой и подарочные сертификаты.
	 *
	 * Деньги живут в Tribute — кабинет только уводит туда ссылкой. Своей формы оплаты нет и
	 * быть не должно: карту клиента мы не видим и видеть не хотим.
	 *
	 * Полная витрина вынесена на отдельный экран «Все тарифы»: здесь ведём диалогом, а список
	 * для тех, кто уже решил. Ссылки на витрину и Tribute собраны в секцию «Дополнительно»
	 * внизу — раньше они стояли кнопками вперемешку с оплатой и спорили с ней за внимание.
	 */
	import { ChevronRight, ExternalLink, List, RotateCcw, Settings, type LucideIcon } from '@lucide/svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import { trackEvent } from '#frontend/cabinet/api/client.ts'
	import Async from '#frontend/cabinet/components/async.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import CopyValue from '#frontend/cabinet/components/copy-value.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import { openLink } from '#frontend/cabinet/lib/telegram.ts'
	import { plansRes } from '#frontend/cabinet/state/cabinet.ts'
	import { navigate } from '#frontend/cabinet/state/screen.ts'
	import { stepAtom, wizardReset } from '#frontend/cabinet/state/wizard.ts'

	import Wizard from './purchase/wizard.svelte'

	const { data, loading, error } = plansRes

	void plansRes.load()

	function openList() {
		trackEvent('plans_list_open')
		navigate('tariffs')
	}
</script>

<!-- Пункт секции «Дополнительно»: строка-кнопка с иконкой, как настройки на «Ещё». -->
{#snippet extraRow(label: string, Icon: LucideIcon, onclick: () => void, external = false)}
	{@const Tail = external ? ExternalLink : ChevronRight}
	<button type="button" class="plans__extra" {onclick}>
		<Icon class="plans__extra-icon" size={16} />
		<span class="plans__extra-label">{label}</span>
		<!-- Действие уводит из кабинета (Tribute) — вместо шеврона значок внешней ссылки. -->
		<Tail class="plans__extra-icon" size={16} />
	</button>
{/snippet}

<!--
	Скелетон экрана: полоска шагов визарда, вопрос и карточки ответов. Первый шаг всегда
	один и тот же — «кому подписка», поэтому форма известна заранее.
-->
{#snippet skeleton()}
	<div class="plans">
		<section>
			<div class="plans__bone-progress">
				{#each { length: 3 }, i (i)}<Skeleton height="0.25rem" />{/each}
			</div>
			<div class="plans__bone-list">
				<span class="plans__bone-question"><Skeleton width="12rem" height="1.25rem" /></span>
				{#each { length: 2 }, i (i)}
					<Card>
						<div class="plans__bone-choice">
							<Skeleton width="1.5rem" height="1.5rem" round />
							<span class="plans__bone-lines">
								<Skeleton width="7rem" height="1rem" />
								<Skeleton width="11rem" height="0.75rem" />
							</span>
						</div>
					</Card>
				{/each}
			</div>
		</section>
		<Skeleton height="2.75rem" />
	</div>
{/snippet}

<Async data={$data} loading={$loading} error={$error} {skeleton} stack>
	{#snippet children(plans)}
		<Wizard />

		<Card tight>
			<span class="plans__extra-title"><SectionTitle gap="none">Дополнительно</SectionTitle></span>
			<div class="plans__extras">
				{#if $stepAtom === 'result'}{@render extraRow('Ответить заново', RotateCcw, () => wizardReset())}{/if}
				{@render extraRow('Все тарифы', List, openList)}
				{#if plans.manageUrl}
					{@const manageUrl = plans.manageUrl}
					{@render extraRow('Управлять подпиской в Tribute', Settings, () => openLink(manageUrl), true)}
				{/if}
			</div>
		</Card>

		{#if plans.pendingGifts.length > 0}
			<Card>
				<SectionTitle gap="xs">Ваши сертификаты</SectionTitle>
				<p class="plans__gifts-note">
					Перешлите ссылку тому, кому дарите: доступ включится, когда он её откроет.
				</p>
				<div class="plans__gifts">
					{#each plans.pendingGifts as gift (gift.deepLink)}
						<CopyValue value={gift.deepLink} text={gift.planName} />
					{/each}
				</div>
			</Card>
		{/if}
	{/snippet}
</Async>

<style>
	.plans {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__bone-progress {
			display: flex;
			gap: 0.375rem;
			margin-bottom: 1rem;
		}

		&__bone-list {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		&__bone-question {
			display: flex;
			align-items: center;
			height: 1.75rem;
		}

		&__bone-choice {
			display: flex;
			gap: 0.75rem;
			align-items: center;
		}

		&__bone-lines {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.375rem;
		}

		&__extra-title {
			display: block;
			margin-top: 0.5rem;
		}

		&__extras {
			display: flex;
			flex-direction: column;
		}

		&__extra {
			cursor: pointer;
			display: flex;
			gap: 0.75rem;
			align-items: center;
			width: 100%;
			min-height: 2.75rem;
			padding: 0.75rem 0;
			border: 0;
			font: inherit;
			font-size: 0.875rem;
			color: inherit;
			text-align: left;
			background: none;
			transition: color 0.15s;

			&:hover {
				color: var(--brand);
			}

			& + & {
				border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
			}

			:global(.plans__extra-icon) {
				flex-shrink: 0;
				color: var(--muted);
			}
		}

		&__extra-label {
			flex: 1;
			min-width: 0;
		}

		&__gifts-note {
			margin-bottom: 0.75rem;
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__gifts {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
