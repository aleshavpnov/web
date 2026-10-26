<script lang="ts">
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'
	import { Activity } from '@lucide/svelte'

	import BackLink from '#frontend/components/back-link.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import { formatPct } from '#frontend/site/format.ts'
	import { expectedNodes, expectedOutages, loadStatus, status, statusError } from '#frontend/site/state/status.ts'
	import {
		LOW_UPTIME,
		OUTAGES_SHOWN,
		WINDOW_DAYS,
		describeOutage,
		formatDuration,
		formatOutageDate,
		formatOutageTime,
		groupOutages,
		plural,
		windowBars,
	} from '#frontend/site/status-view.ts'

	import DayStrip from './day-strip.svelte'
	import HealthDot from './health-dot.svelte'
	import { HEALTH_LABEL } from './health.ts'

	$effect(() => {
		const id = setInterval(() => void loadStatus(), 60_000)

		return () => clearInterval(id)
	})

	const outages = $derived($status ? groupOutages($status.incidents) : [])
	const nodesUp = $derived($status?.nodes.filter((n) => n.status === 'operational').length ?? 0)
	const last = $derived(outages[0])
	let showAll = $state(false)
	const shown = $derived(showAll ? outages : outages.slice(0, OUTAGES_SHOWN))
	const hidden = $derived(outages.length - OUTAGES_SHOWN)

	const isLow = (v: number | null) => v !== null && v < LOW_UPTIME
	const rows = (n: number) => Array.from({ length: n }, (_, i) => i)
</script>

<!-- Заготовки повторяют разметку загруженной страницы строка в строку, а серверов и сбоев в них
     столько же, сколько было в прошлый раз: приход данных не двигает страницу. -->

<Shell page="status" wide>
	<div class="status">
		<header class="status__head">
			<div>
				<Eyebrow icon={Activity}>серверы · аптайм · сбои</Eyebrow>
				<h1 class="status__title">Статус системы</h1>
			</div>
			<span class="status__updated status__line">
				{#if $status}
					обновлено в {new Date($status.generatedAt).toLocaleTimeString('ru-RU', {
						hour: '2-digit',
						minute: '2-digit',
					})} · раз в&nbsp;минуту
				{:else if !$statusError}
					<Skeleton width="11rem" height="0.75rem" />
				{/if}
			</span>
		</header>

		{#if $statusError}
			<section class="status__summary">
				<div class="status__now status__now--unknown">
					<p class="status__verdict status__line"><HealthDot status="unknown" />Статус недоступен</p>
					<p class="status__sub status__line">Попробуем снова через минуту</p>
				</div>
			</section>
		{:else}
			<section class="status__summary" aria-label="Сводка">
				<div class="status__now status__now--{$status?.overall ?? 'loading'}">
					{#if $status}
						<p class="status__verdict status__line">
							<HealthDot status={$status.overall} />{HEALTH_LABEL[$status.overall]}
						</p>
						<!-- На телефоне факты всегда в две строки, на десктопе в одну: так заготовке
						     не приходится гадать, перенесётся ли строка. -->
						<p class="status__sub status__facts">
							<span class="status__line"
								>{nodesUp} из {$status.nodes.length}
								{plural($status.nodes.length, ['сервера', 'серверов', 'серверов'])} на&nbsp;связи</span
							>
							{#if $status.internet?.latencyMs != null}
								<span class="status__line status__ping"
									>пинг до&nbsp;интернета {$status.internet.latencyMs}&nbsp;мс</span
								>
							{/if}
						</p>
					{:else}
						<p class="status__verdict status__line" role="status" aria-label="Загрузка статуса">
							<Skeleton width="12rem" height="1.5rem" />
						</p>
						<p class="status__sub status__facts">
							<span class="status__line"><Skeleton width="11rem" height="0.875rem" /></span>
							<span class="status__line status__ping"><Skeleton width="10rem" height="0.875rem" /></span>
						</p>
					{/if}
				</div>
				<div class="status__month">
					<p class="status__label status__line">За {WINDOW_DAYS}&nbsp;дней</p>
					{#if $status}
						<p class="status__count status__line">
							{outages.length
								? `${outages.length} ${plural(outages.length, ['сбой', 'сбоя', 'сбоев'])}`
								: 'Без сбоев'}
						</p>
						<p class="status__sub status__line">
							{#if last}
								последний — {formatOutageDate(last.start, last.end)}, {formatDuration(
									last.start,
									last.end,
								)}
							{:else}
								все серверы были на&nbsp;связи
							{/if}
						</p>
					{:else}
						<p class="status__count status__line"><Skeleton width="6rem" height="1.5rem" /></p>
						<p class="status__sub status__line"><Skeleton width="13rem" height="0.875rem" /></p>
					{/if}
				</div>
			</section>

			<section class="status__table" aria-label="Серверы">
				<div class="status__row status__row--head" aria-hidden="true">
					<span class="status__name">Сервер</span>
					<span class="status__strip status__strip--head"
						><span>{WINDOW_DAYS}&nbsp;дней назад</span><span>сегодня</span></span
					>
					<span class="status__pct status__pct--d1">24&nbsp;ч</span>
					<span class="status__pct status__pct--d7">7&nbsp;дней</span>
					<span class="status__pct status__pct--d30">{WINDOW_DAYS}&nbsp;дней</span>
				</div>
				{#if $status}
					{#each $status.nodes as node (node.label)}
						<div class="status__row">
							<span class="status__name status__line"><HealthDot status={node.status} />{node.label}</span
							>
							<span class="status__strip"><DayStrip days={windowBars(node)} /></span>
							<span class="status__extra">
								<span
									class={[
										'status__pct',
										'status__pct--d1',
										isLow(node.uptime.d1) && 'status__pct--low',
									]}><span class="status__pct-label">24&nbsp;ч</span>{formatPct(node.uptime.d1)}</span
								>
								<span
									class={[
										'status__pct',
										'status__pct--d7',
										isLow(node.uptime.d7) && 'status__pct--low',
									]}
									><span class="status__pct-label">7&nbsp;дней</span>{formatPct(node.uptime.d7)}</span
								>
							</span>
							<span
								class={[
									'status__pct',
									'status__pct--d30',
									isLow(node.uptime.d30) && 'status__pct--low',
								]}>{formatPct(node.uptime.d30)}</span
							>
						</div>
					{/each}
				{:else}
					{#each rows(expectedNodes()) as i (i)}
						<div class="status__row">
							<span class="status__name status__line"><Skeleton width="9rem" height="0.875rem" /></span>
							<span class="status__strip"><Skeleton height="100%" /></span>
							<span class="status__extra">
								<span class="status__pct status__pct--d1 status__line"
									><Skeleton width="3rem" height="0.75rem" /></span
								>
								<span class="status__pct status__pct--d7 status__line"
									><Skeleton width="3rem" height="0.75rem" /></span
								>
							</span>
							<span class="status__pct status__pct--d30 status__line"
								><Skeleton width="3rem" height="0.875rem" /></span
							>
						</div>
					{/each}
				{/if}
				<div class="status__legend" aria-hidden="true">
					<span class="status__key status__key--ok">без сбоев</span>
					<span class="status__key status__key--warn">был сбой</span>
					<span class="status__key status__key--none">сервера ещё не было</span>
				</div>
			</section>

			<section class="status__outages" aria-label="Сбои">
				<h2 class="status__subtitle">Сбои за {WINDOW_DAYS}&nbsp;дней</h2>
				{#if $status}
					{#if outages.length}
						<div class="status__log">
							<ol class="status__list" id="status-outages">
								{#each shown as o (o.start)}
									<li class="status__outage">
										<span class="status__date status__line">{formatOutageDate(o.start, o.end)}</span
										>
										<span class="status__what status__line" title={describeOutage(o)}
											><span class="status__what-text">{describeOutage(o)}</span></span
										>
										<span class="status__time status__line">{formatOutageTime(o.start, o.end)}</span
										>
										<span class={['status__duration', !o.end && 'status__duration--ongoing']}
											>{o.end
												? formatDuration(o.start, o.end)
												: `идёт ${formatDuration(o.start, null)}`}</span
										>
									</li>
								{/each}
							</ol>
							{#if hidden > 0}
								<button
									class="status__more"
									type="button"
									aria-controls="status-outages"
									aria-expanded={showAll}
									onclick={() => (showAll = !showAll)}
									>{showAll
										? 'Свернуть'
										: `Показать ещё ${hidden} ${plural(hidden, ['сбой', 'сбоя', 'сбоев'])}`}</button
								>
							{/if}
						</div>
					{:else}
						<p class="status__empty status__line">За {WINDOW_DAYS}&nbsp;дней сбоев не было</p>
					{/if}
				{:else if expectedOutages() > 0}
					<div class="status__log">
						<ol class="status__list">
							{#each rows(Math.min(expectedOutages(), OUTAGES_SHOWN)) as i (i)}
								<li class="status__outage">
									<span class="status__date status__line"
										><Skeleton width="4rem" height="0.875rem" /></span
									>
									<span class="status__what status__line"
										><Skeleton width="10rem" height="0.875rem" /></span
									>
									<span class="status__time status__line"
										><Skeleton width="6rem" height="0.75rem" /></span
									>
									<span class="status__duration status__duration--pending"
										><Skeleton width="4.5rem" height="0.75rem" /></span
									>
								</li>
							{/each}
						</ol>
						{#if expectedOutages() > OUTAGES_SHOWN}
							<div class="status__more status__more--pending">
								<span class="status__line"><Skeleton width="10rem" height="0.875rem" /></span>
							</div>
						{/if}
					</div>
				{:else}
					<p class="status__empty status__line"><Skeleton width="14rem" height="0.875rem" /></p>
				{/if}
			</section>
		{/if}

		<div><BackLink /></div>
	</div>
</Shell>

<style>
	.status {
		--status-ok: light-dark(#16a34a, #22c55e);
		--status-warn: #f59e0b;
		--status-bad: #ef4444;
		--status-low: light-dark(#b45309, #fbbf24);

		display: grid;
		gap: 1.75rem;

		&__head {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
			align-items: flex-end;
			justify-content: space-between;
		}

		&__title {
			font-size: clamp(1.75rem, 4vw, 2.5rem);
			font-weight: 800;
			letter-spacing: -0.03em;
		}

		&__updated {
			font-size: 0.8125rem;
			color: var(--muted);
		}

		/* Строка заготовки ростом со строку текста, который придёт на её место. */
		&__line {
			display: flex;
			align-items: center;
			min-height: 1lh;
		}

		&__summary {
			overflow: hidden;
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			border: 1px solid var(--border);
			border-radius: 1.125rem;

			@media (--md) {
				grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
			}
		}

		&__now,
		&__month {
			display: grid;
			gap: 0.375rem;
			align-content: center;
			padding: 1.25rem 1.375rem;

			@media (--md) {
				padding: 1.625rem 1.75rem;
			}
		}

		&__now {
			background: var(--surface);

			&--operational {
				background: color-mix(in srgb, var(--status-ok) 10%, transparent);
			}

			&--degraded {
				background: color-mix(in srgb, var(--status-warn) 12%, transparent);
			}

			&--down {
				background: color-mix(in srgb, var(--status-bad) 10%, transparent);
			}
		}

		&__month {
			border-top: 1px solid var(--border);

			@media (--md) {
				border-top: 0;
				border-left: 1px solid var(--border);
			}
		}

		&__verdict,
		&__count {
			gap: 0.75rem;
			font-size: clamp(1.375rem, 3vw, 1.75rem);
			font-weight: 800;
			letter-spacing: -0.02em;

			:global(.health-dot) {
				width: 0.875rem;
				height: 0.875rem;
			}
		}

		&__label {
			font-size: 0.8125rem;
			color: var(--muted);
		}

		&__sub {
			flex-wrap: wrap;
			font-size: 0.9375rem;
			color: color-mix(in srgb, var(--fg) 75%, transparent);
		}

		&__facts {
			display: flex;
			flex-direction: column;

			@media (--md) {
				flex-direction: row;
				gap: 0.5ch;
			}
		}

		&__ping {
			@media (--md) {
				&::before {
					content: '·';
					margin-right: 0.5ch;
				}
			}
		}

		&__table {
			overflow: hidden;
			border: 1px solid var(--border);
			border-radius: 1.125rem;
		}

		/* Строка сервера. На телефоне: имя и 30 дней, полоса во всю ширину, под ней 24 ч и 7 дней.
		   На десктопе -- одна строка таблицы; обёртка 24 ч и 7 дней растворяется в сетке. */
		&__row {
			display: grid;
			grid-template-areas:
				'name d30'
				'strip strip'
				'extra extra';
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 0.5rem 1rem;
			align-items: center;
			padding: 0.875rem 1rem;
			border-bottom: 1px solid var(--border);

			@media (--md) {
				grid-template-areas: 'name strip d1 d7 d30';
				grid-template-columns: 15rem minmax(0, 1fr) 5rem 5rem 5rem;
				gap: 1.5rem;
				padding: 1rem 1.5rem;
			}

			&--head {
				display: none;

				@media (--md) {
					display: grid;
					padding-block: 0.875rem;
					font-size: 0.75rem;
					font-weight: 600;
					color: var(--muted);
					text-transform: uppercase;
					letter-spacing: 0.05em;
					background: var(--surface);
				}
			}
		}

		&__name {
			grid-area: name;
			gap: 0.625rem;
			min-width: 0;
			font-size: 0.9375rem;
			font-weight: 600;
		}

		&__strip {
			display: flex;
			grid-area: strip;
			flex-direction: column;
			height: 1.125rem;

			@media (--md) {
				height: 1.375rem;
			}

			&--head {
				flex-direction: row;
				justify-content: space-between;
				height: auto;
			}
		}

		&__extra {
			display: flex;
			grid-area: extra;
			gap: 1rem;

			@media (--md) {
				display: contents;
			}
		}

		&__pct {
			display: flex;
			gap: 0.375rem;
			font-size: 0.8125rem;
			font-variant-numeric: tabular-nums;
			color: var(--muted);

			@media (--md) {
				justify-content: flex-end;
				font-size: 0.9375rem;
				color: var(--fg);
				text-align: right;
			}

			&--d1 {
				grid-area: d1;
			}

			&--d7 {
				grid-area: d7;
			}

			&--d30 {
				grid-area: d30;
				justify-content: flex-end;
				font-size: 0.9375rem;
				font-weight: 700;
				color: var(--fg);
				text-align: right;
			}

			&--low,
			&--low.status__pct--d30 {
				color: var(--status-low);
			}
		}

		&__pct-label {
			@media (--md) {
				display: none;
			}
		}

		&__legend {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1.25rem;
			padding: 0.75rem 1rem;
			font-size: 0.75rem;
			color: var(--muted);

			@media (--md) {
				padding-inline: 1.5rem;
			}
		}

		&__key {
			display: inline-flex;
			gap: 0.375rem;
			align-items: center;

			&::before {
				content: '';
				width: 0.625rem;
				height: 0.625rem;
				border-radius: 2px;
				background: var(--surface);
			}

			&--ok::before {
				background: var(--status-ok);
			}

			&--warn::before {
				background: var(--status-warn);
			}
		}

		&__outages {
			display: grid;
			gap: 0.75rem;
		}

		&__subtitle {
			margin: 0;
			font-size: 1.125rem;
			font-weight: 700;
		}

		&__log {
			overflow: hidden;
			border: 1px solid var(--border);
			border-radius: 1.125rem;
		}

		&__list {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		&__more {
			cursor: pointer;
			display: flex;
			align-items: center;
			width: 100%;
			padding: 0.75rem 1rem;
			border: 0;
			border-top: 1px solid var(--border);
			font: inherit;
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--accent);
			text-align: left;
			background: none;

			@media (--md) {
				padding-inline: 1.5rem;
			}

			&:hover {
				background: color-mix(in srgb, var(--fg) 4%, transparent);
			}

			&:focus-visible {
				outline: 2px solid var(--accent);
				outline-offset: -2px;
			}

			&--pending {
				cursor: default;
			}
		}

		/* Сбой. На телефоне: дата и длительность, ниже кого задело и время. На десктопе -- строка. */
		&__outage {
			display: grid;
			grid-template-areas:
				'date duration'
				'what what'
				'time time';
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 0.25rem 1rem;
			align-items: center;
			padding: 0.875rem 1rem;
			border-bottom: 1px solid var(--border);
			font-size: 0.875rem;

			@media (--md) {
				grid-template-areas: 'date what time duration';
				grid-template-columns: 7rem minmax(0, 1fr) 9rem 8rem;
				gap: 1.5rem;
				padding: 0.875rem 1.5rem;
			}

			&:last-child {
				border-bottom: 0;
			}
		}

		&__date {
			grid-area: date;
			font-weight: 700;
		}

		/* Всегда в одну строку: список из пяти серверов иначе переносится, и строка сбоя
		   выходит выше заготовки. Полный список -- в подсказке. */
		&__what {
			grid-area: what;
			min-width: 0;
			color: color-mix(in srgb, var(--fg) 80%, transparent);
		}

		&__what-text {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__time {
			grid-area: time;
			font-size: 0.8125rem;
			font-variant-numeric: tabular-nums;
			color: var(--muted);
		}

		&__duration {
			grid-area: duration;
			justify-self: end;
			padding: 0.125rem 0.625rem;
			border-radius: 999px;
			font-size: 0.8125rem;
			font-weight: 700;
			color: light-dark(#92400e, #fcd34d);
			white-space: nowrap;
			background: color-mix(in srgb, var(--status-warn) 18%, transparent);

			&--ongoing {
				color: light-dark(#991b1b, #fca5a5);
				background: color-mix(in srgb, var(--status-bad) 16%, transparent);
			}

			/* Та же высота, что у плашки с текстом: строка плюс её вертикальные отступы. */
			&--pending {
				display: flex;
				align-items: center;
				min-height: calc(1lh + 0.25rem);
				background: none;
			}
		}

		&__empty {
			font-size: 0.875rem;
			color: var(--muted);
		}
	}
</style>
