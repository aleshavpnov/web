<script lang="ts">
	/**
	 * Главный экран: что у клиента с доступом прямо сейчас и что с этим делать дальше.
	 *
	 * Порядок блоков — по частоте нужды: состояние подписки → «подключиться» → продлить.
	 * Всё остальное (трафик, друзья, настройки) живёт на своих вкладках.
	 */
	import { CalendarClock, CreditCard, Gift, PlugZap, ShieldCheck } from '@lucide/svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import Async from '#frontend/cabinet/components/async.svelte'
	import TextBone from '#frontend/cabinet/components/bones/text-bone.svelte'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import SupportCard from '#frontend/cabinet/components/support-card.svelte'
	import { formatDate } from '#frontend/cabinet/lib/format.ts'
	import { overviewRes, summaryRes } from '#frontend/cabinet/state/cabinet.ts'
	import { navigate } from '#frontend/cabinet/state/screen.ts'

	import PaidCard from './home/paid-card.svelte'
	import Widgets from './home/widgets.svelte'
	import WidgetsBone from './home/widgets-bone.svelte'

	const { data, loading, error } = overviewRes

	// Плитки грузим сразу, а не после карточки: иначе главная ждала два запроса подряд.
	void overviewRes.load()
	void summaryRes.load()
</script>

<!--
	Скелетон экрана: карточка подписки, кнопки, плитки. Плитки живут в своём запросе и
	приходят позже, но место под них держим сразу — иначе экран дважды меняет высоту.
-->
{#snippet skeleton()}
	<div class="home">
		<Card>
			<div class="home__bone-head">
				<div>
					<TextBone line="xs" width="5rem" height="0.75rem" />
					<span class="home__bone-plan"><TextBone line="xl" width="10rem" height="1.25rem" /></span>
				</div>
				<TextBone line="xs" width="6rem" height="0.75rem" />
			</div>
			<div class="home__bone-term">
				<CalendarClock class="home__bone-icon" size={16} />
				<Skeleton width="13rem" />
			</div>
		</Card>

		<div class="home__actions">
			<Skeleton height="2.75rem" />
			<Skeleton height="2.75rem" />
		</div>

		<WidgetsBone />
	</div>
{/snippet}

<Async data={$data} loading={$loading} error={$error} {skeleton} stack>
	{#snippet children(overview)}
		{@const hasAccess = overview.kind !== 'none'}

		{#if overview.kind === 'paid' && overview.sub}
			<PaidCard sub={overview.sub} />
		{:else if overview.kind === 'vip'}
			<Card>
				<div class="home__vip-title">
					<ShieldCheck class="home__vip-icon" size={20} />
					Особый доступ
				</div>
				<p class="home__text home__text--gap">
					{overview.vip?.expiresAt
						? `Действует до ${formatDate(overview.vip.expiresAt)}.`
						: 'Действует бессрочно, оплачивать ничего не нужно.'}
				</p>
			</Card>
		{:else}
			<Card>
				<div class="home__none-title">Доступа пока нет</div>
				<p class="home__text home__text--gap">
					{overview.trial.available
						? `Начните с бесплатного пробного периода на ${overview.trial.days} дн. — его выдаёт бот в чате.`
						: 'Выберите тариф — доступ включится сразу после оплаты.'}
				</p>
			</Card>
		{/if}

		<div class="home__actions">
			{#if hasAccess}
				<Button variant="brand" wide onclick={() => navigate('connect')}>
					<PlugZap size={16} />
					Подключиться
				</Button>
			{/if}
			<Button variant={hasAccess ? 'outline' : 'brand'} wide onclick={() => navigate('plans')}>
				<CreditCard size={16} />
				{overview.kind === 'paid' ? 'Продлить или сменить тариф' : 'Выбрать тариф'}
			</Button>
		</div>

		<!-- Плитки — только тем, у кого есть доступ: без него в них одни прочерки,
		     а на экране и так стоит призыв выбрать тариф. -->
		{#if hasAccess}<Widgets {overview} />{/if}

		{#if overview.pendingGifts > 0}
			<Card>
				<SectionTitle gap="xs">Неактивированные подарки</SectionTitle>
				<p class="home__text">
					У вас {overview.pendingGifts} оплаченный сертификат — ссылки для получателя лежат на вкладке «Тарифы».
				</p>
				<div class="home__gift-button">
					<Button wide onclick={() => navigate('plans')}>
						<Gift size={16} />
						Открыть подарки
					</Button>
				</div>
			</Card>
		{/if}

		{#if overview.support.available}<SupportCard />{/if}
	{/snippet}
</Async>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__bone-head {
			display: flex;
			gap: 0.75rem;
			align-items: flex-start;
			justify-content: space-between;
		}

		&__bone-plan {
			display: block;
			margin-top: 0.125rem;
		}

		&__bone-term {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			height: 1.25rem;
			margin-top: 0.75rem;

			:global(.home__bone-icon) {
				flex-shrink: 0;
				color: color-mix(in srgb, var(--muted) 40%, transparent);
			}
		}

		&__actions {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		&__vip-title {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			font-size: 1.25rem;
			font-weight: 600;

			:global(.home__vip-icon) {
				color: var(--brand);
			}
		}

		&__none-title {
			font-size: 1.25rem;
			font-weight: 600;
		}

		&__text {
			font-size: 0.875rem;
			color: var(--muted);

			&--gap {
				margin-top: 0.5rem;
			}
		}

		&__gift-button {
			margin-top: 0.75rem;
		}
	}
</style>
