<script lang="ts">
	/**
	 * Экран «Трафик»: сколько израсходовано за окно и с каких устройств.
	 *
	 * Ни адресов, ни доменов здесь нет и не будет — бот их в `/api/me` не отдаёт (см. шапку
	 * cabinet-api.ts). Устройство названо моделью и датой последнего входа: этого хватает,
	 * чтобы узнать своё и заметить чужое.
	 */
	import { Activity, Smartphone } from '@lucide/svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import Async from '#frontend/cabinet/components/async.svelte'
	import BarsBone from '#frontend/cabinet/components/bones/bars-bone.svelte'
	import RowBone from '#frontend/cabinet/components/bones/row-bone.svelte'
	import TextBone from '#frontend/cabinet/components/bones/text-bone.svelte'
	import TileBone from '#frontend/cabinet/components/bones/tile-bone.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import DeviceList from '#frontend/cabinet/components/device-list.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import Segmented from '#frontend/cabinet/components/segmented.svelte'
	import StatTile from '#frontend/cabinet/components/stat-tile.svelte'
	import SupportCard from '#frontend/cabinet/components/support-card.svelte'
	import UsageBars from '#frontend/cabinet/components/usage-bars.svelte'
	import { formatBytes, formatDevices, plural } from '#frontend/cabinet/lib/format.ts'
	import { overviewRes, usageDaysAtom, usageRes } from '#frontend/cabinet/state/cabinet.ts'

	const WINDOWS = [
		{ value: '1', label: 'Сутки' },
		{ value: '7', label: '7 дней' },
		{ value: '30', label: '30 дней' },
	] as const

	const { data, loading, error } = usageRes
	// Режим гейта и приостановка — из обзора: главная его уже загрузила, второй запрос не нужен.
	const overview = overviewRes.data

	const days = (n: number) => plural(n, 'день', 'дня', 'дней')

	$effect(() => {
		void usageRes.load($usageDaysAtom)
	})
</script>

<!--
	Скелетон экрана: две плитки, карточка графика, список устройств. Столбики в карточке
	ростом ровно с `UsageBars` (140), поэтому график встаёт на своё место без прыжка.
-->
{#snippet skeleton()}
	<div class="usage__stack">
		<div class="usage__tiles">
			<TileBone icon={Activity} value="5rem" hint="7rem" />
			<TileBone icon={Smartphone} value="2rem" hint="6rem" />
		</div>

		<Card>
			<span class="usage__bone-title"><TextBone width="9rem" /></span>
			<BarsBone count={24} />
		</Card>

		<Card>
			<span class="usage__bone-title"><TextBone width="7rem" /></span>
			<!-- Три строки — столько устройств у большинства: телефон, ноутбук и планшет. -->
			{#each { length: 3 }, i (i)}
				<RowBone lines={['10rem', '13rem']}>
					{#snippet leading()}<Smartphone class="usage__bone-icon" size={16} />{/snippet}
					{#snippet tail()}
						<span class="usage__bone-actions">
							<Skeleton width="2.25rem" height="2.25rem" />
							<Skeleton width="2.25rem" height="2.25rem" />
						</span>
					{/snippet}
				</RowBone>
			{/each}
			<div class="usage__bone-footer"><Skeleton height="2.75rem" /></div>
		</Card>
	</div>
{/snippet}

<div class="usage__stack">
	<Segmented
		value={String($usageDaysAtom) as '1' | '7' | '30'}
		options={WINDOWS}
		onchange={(v) => usageDaysAtom.set(Number(v))}
	/>

	<Async data={$data} loading={$loading} error={$error} {skeleton} stack>
		{#snippet children(usage)}
			{#if !usage.available}
				<Card>
					<div class="usage__title">Учёт трафика не ведётся</div>
					<p class="usage__text">Он появится, когда у&nbsp;вас будет действующая подписка.</p>
				</Card>
			{:else}
				<div class="usage__tiles">
					<StatTile
						label={`Израсходовано за ${usage.windowDays} ${days(usage.windowDays)}`}
						value={formatBytes(usage.usedBytes)}
						hint={`в среднем ${formatBytes(Math.round(usage.avgPerDayBytes))} в сутки`}
					/>
					<!-- Плитка — по слотам гейта, а не по выбранному периоду графика: против
					     лимита сравнивается именно это число, и оно не должно прыгать от
					     переключения «сутки / 30 дней». -->
					<StatTile
						label={`Устройств за ${usage.slotWindowDays} ${days(usage.slotWindowDays)}`}
						value={usage.deviceLimit === null ? usage.slots : `${usage.slots} из ${usage.deviceLimit}`}
						hint={usage.deviceLimit === null
							? 'без ограничения'
							: `лимит тарифа — ${formatDevices(usage.deviceLimit)}`}
					/>
				</div>

				<!-- История снимков бывает короче запрошенного окна — тогда цифры считаются
				     по тому, что есть, и молчать об этом нельзя. -->
				{#if usage.historyDays < usage.windowDays}
					{@const history = Math.floor(usage.historyDays)}
					<p class="usage__history">
						Данные есть только за последние {history}
						{days(history)} — цифры посчитаны по ним.
					</p>
				{/if}

				<Card>
					<SectionTitle>Расход по {usage.granularity === 'hour' ? 'часам' : 'дням'}</SectionTitle>
					<UsageBars points={usage.series} granularity={usage.granularity} />
				</Card>

				<DeviceList
					devices={usage.devices}
					gate={$overview?.deviceGate ?? 'off'}
					suspended={Boolean($overview?.sub?.sharingSuspendedAt)}
					onchanged={() => usageRes.load($usageDaysAtom)}
				/>

				<!-- Показываем всем, у кого лимит вообще есть, а не только упёршимся в него:
				     счёт устройств — нижняя граница (hwid шлёт только Happ), и порог по нему
				     прятал бы карточку как раз от тех, кому она нужна. У безлимитных
				     (подписки до тарифной линейки, vip) просить нечего. -->
				{#if usage.deviceLimit !== null}<SupportCard kind="devices" />{/if}
			{/if}
		{/snippet}
	</Async>
</div>

<style>
	.usage {
		&__stack {
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}

		&__tiles {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}

		&__bone-title {
			display: block;
			margin-bottom: 0.5rem;
		}

		&__bone-actions {
			display: flex;
			flex-shrink: 0;
			gap: 0.25rem;
		}

		&__bone-footer {
			margin-top: 1rem;
			padding-top: 1rem;
			border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
		}

		&__title {
			font-weight: 600;
		}

		&__text {
			margin-top: 0.5rem;
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__history {
			font-size: 0.75rem;
			color: var(--muted);
		}
	}

	:global(.usage__bone-icon) {
		flex-shrink: 0;
		color: color-mix(in srgb, var(--muted) 40%, transparent);
	}
</style>
