<script lang="ts">
	/**
	 * Плитки-виджеты: расход, устройства, приглашённые, срок. Каждая ведёт в свой раздел —
	 * главная отвечает на «как дела», подробности живут на вкладках.
	 *
	 * Считаются отдельным запросом (`/summary`): агрегат по снимкам трафика тяжелее карточки
	 * подписки, и заставлять её ждать незачем — плитки появляются следом.
	 */
	import { Activity, CalendarClock, Smartphone, Users } from '@lucide/svelte'

	import type { Overview } from '#frontend/cabinet/api/schemas.ts'
	import StatTile from '#frontend/cabinet/components/stat-tile.svelte'
	import { daysLeft, formatBytes } from '#frontend/cabinet/lib/format.ts'
	import { summaryRes } from '#frontend/cabinet/state/cabinet.ts'
	import { navigate } from '#frontend/cabinet/state/screen.ts'

	import WidgetsBone from './widgets-bone.svelte'

	let { overview }: { overview: Overview } = $props()

	const { data: summary, error } = summaryRes

	/** Сколько осталось доступа — коротко, для плитки: «12 дн.», «бессрочно» или «нет». */
	function accessLeft(o: Overview): string {
		if (o.kind === 'vip') return o.vip?.expiresAt ? `${daysLeft(o.vip.expiresAt)} дн.` : 'бессрочно'

		if (o.kind === 'paid' && o.sub) {
			const left = daysLeft(o.sub.expiresAt)

			return left > 0 ? `${left} дн.` : 'истёк'
		}

		return 'нет'
	}
</script>

{#if !$error}
	{#if !$summary}
		<WidgetsBone />
	{:else}
		<div class="widgets">
			<StatTile
				label={`Трафик за ${$summary.windowDays} дн.`}
				icon={Activity}
				value={$summary.usedBytes === null ? '—' : formatBytes($summary.usedBytes)}
				hint="подробнее"
				onclick={() => navigate('usage')}
			/>
			<StatTile
				label="Устройства"
				icon={Smartphone}
				value={$summary.devices ?? '—'}
				hint={$summary.deviceLimit === null ? 'без ограничения' : `из ${$summary.deviceLimit} по тарифу`}
				onclick={() => navigate('usage')}
			/>
			<StatTile
				label="Друзья"
				icon={Users}
				value={$summary.referrals.joined}
				hint={`оплатили ${$summary.referrals.paid}`}
				onclick={() => navigate('refs')}
			/>
			<!-- Четвёртая плитка — срок: то же число, что в карточке выше, но рядом с остальными
			     цифрами и с переходом к тарифам. У VIP срока обычно нет — тогда «бессрочно». -->
			<StatTile
				label="Доступ"
				icon={CalendarClock}
				value={accessLeft(overview)}
				hint={overview.kind === 'paid' ? 'продлить или сменить' : 'выбрать тариф'}
				onclick={() => navigate('plans')}
			/>
		</div>
	{/if}
{/if}

<style>
	.widgets {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
</style>
