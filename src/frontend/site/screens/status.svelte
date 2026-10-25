<script lang="ts">
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'
	import { Activity } from '@lucide/svelte'

	import BackLink from '#frontend/components/back-link.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import type { Health } from '#frontend/site/api/schemas.ts'
	import { formatPct } from '#frontend/site/format.ts'
	import { loadStatus, status, statusError } from '#frontend/site/state/status.ts'

	import HealthDot from './health-dot.svelte'
	import { HEALTH_LABEL } from './health.ts'
	import UptimeBars from './uptime-bars.svelte'

	const OVERALL_MARK: Record<Health, string> = { operational: '●', degraded: '◐', down: '●', unknown: '○' }

	$effect(() => {
		const id = setInterval(() => void loadStatus(), 60_000)

		return () => clearInterval(id)
	})

	function isResolved(incident: { status: string; resolvedAt: string | null }) {
		return incident.status === 'resolved' || incident.resolvedAt !== null
	}
</script>

<Shell page="status">
	<div class="status">
		<header class="status__head">
			<div>
				<Eyebrow icon={Activity}>серверы · аптайм · инциденты</Eyebrow>
				<h1 class="status__title">Статус системы</h1>
			</div>
			{#if $status}
				<span class="status__updated">
					обновлено {new Date($status.generatedAt).toLocaleTimeString('ru-RU', {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</span>
			{/if}
		</header>

		{#if $statusError}
			<div class="status__banner">
				<HealthDot status="unknown" /><span class="status__muted">Статус недоступен</span>
			</div>
		{:else if !$status}
			<div class="status__loading" role="status" aria-label="Загрузка статуса">
				<div class="status__banner">
					<Skeleton width="11rem" height="1rem" /><Skeleton width="3rem" height="0.75rem" />
				</div>
				{#each ['a', 'b'] as k (k)}
					<div class="status__node">
						<div class="status__node-head">
							<Skeleton width="6rem" height="1rem" /><Skeleton width="4rem" height="0.75rem" />
						</div>
						<Skeleton height="1.25rem" />
						<Skeleton width="11rem" height="0.75rem" />
					</div>
				{/each}
				<Skeleton width="16rem" height="1.25rem" />
			</div>
		{:else}
			<div class="status__banner status__banner--{$status.overall}">
				<span class="status__overall status__overall--{$status.overall}">
					{OVERALL_MARK[$status.overall]}
					{HEALTH_LABEL[$status.overall]}
				</span>
				{#if $status.internet?.latencyMs != null}
					<span class="status__muted status__number">{$status.internet.latencyMs} мс</span>
				{/if}
			</div>

			{#if $status.nodes.length > 0}
				<div class="status__nodes">
					{#each $status.nodes as node (node.label)}
						<article class="status__node">
							<div class="status__node-head">
								<span class="status__node-name"><HealthDot status={node.status} />{node.label}</span>
								{#if node.uptime.d1 !== null}
									<span class="status__muted status__number">{formatPct(node.uptime.d1)} / 24ч</span>
								{/if}
							</div>
							{#if node.bars.length > 0}
								<div class="status__bars">
									<UptimeBars bars={node.bars} />
									<span class="status__hint">90 дней</span>
								</div>
							{/if}
							<div class="status__uptime">
								<span>24ч <b class="status__value">{formatPct(node.uptime.d1)}</b></span>
								<span>7д <b class="status__value">{formatPct(node.uptime.d7)}</b></span>
								<span>30д <b class="status__value">{formatPct(node.uptime.d30)}</b></span>
							</div>
						</article>
					{/each}
				</div>
			{/if}

			{#if $status.incidents.length > 0}
				<div class="status__incidents">
					<h2 class="status__subtitle">Инциденты</h2>
					{#each $status.incidents as incident (incident.id)}
						<article class="status__incident">
							<div class="status__incident-head">
								<span class="status__incident-title">{incident.title}</span>
								<span class={['status__chip', !isResolved(incident) && 'status__chip--open']}>
									{isResolved(incident) ? 'закрыто' : incident.status}
								</span>
							</div>
							{#if incident.body}
								<p class="status__muted status__small">{incident.body}</p>
							{/if}
							{#if incident.startedAt}
								<p class="status__hint">
									{new Date(incident.startedAt).toLocaleDateString('ru-RU', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
									})}{incident.location ? ` · ${incident.location}` : ''}
								</p>
							{/if}
						</article>
					{/each}
				</div>
			{:else}
				<p class="status__hint status__none">Инцидентов за последние 30 дней нет</p>
			{/if}
		{/if}

		<div><BackLink /></div>
	</div>
</Shell>

<style>
	.status {
		display: grid;
		gap: 1.5rem;

		&__head {
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
		}

		&__title {
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.025em;
		}

		&__updated,
		&__hint {
			font-size: 0.75rem;
			color: color-mix(in srgb, var(--muted) 85%, transparent);
		}

		&__muted {
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__number {
			font-size: 0.75rem;
			font-variant-numeric: tabular-nums;
		}

		&__small {
			font-size: 0.75rem;
			line-height: 1.625;
		}

		&__loading,
		&__nodes,
		&__incidents {
			display: grid;
			gap: 0.75rem;
		}

		&__banner {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			justify-content: space-between;
			min-height: 3.375rem;
			padding: 1rem 1.25rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 1.4);

			&--operational {
				border-color: rgb(16 185 129 / 40%);
				background: rgb(16 185 129 / 10%);
			}

			&--degraded {
				border-color: rgb(245 158 11 / 40%);
				background: rgb(245 158 11 / 10%);
			}

			&--down {
				border-color: rgb(239 68 68 / 40%);
				background: rgb(239 68 68 / 10%);
			}

			&--unknown {
				background: var(--surface);
			}
		}

		&__overall {
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--muted);

			&--operational {
				color: var(--accent);
			}

			&--degraded {
				color: light-dark(#b45309, #fbbf24);
			}

			&--down {
				color: var(--danger);
			}
		}

		&__node {
			display: grid;
			gap: 1rem;
			padding: 1.25rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 1.4);
		}

		&__node-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			min-height: 1.25rem;
		}

		&__node-name {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			font-size: 0.875rem;
			font-weight: 600;
		}

		&__bars {
			display: grid;
			gap: 0.375rem;
		}

		&__uptime {
			display: flex;
			gap: 1.5rem;
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__value {
			font-weight: 500;
			color: var(--fg);
		}

		&__subtitle {
			margin: 0;
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--muted);
		}

		&__incident {
			display: grid;
			gap: 0.25rem;
			padding: 0.75rem 1rem;
			border: 1px solid var(--border);
			border-radius: var(--radius);
		}

		&__incident-head {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			justify-content: space-between;
		}

		&__incident-title {
			font-size: 0.875rem;
			font-weight: 500;
		}

		&__chip {
			padding: 0.125rem 0.5rem;
			border-radius: 999px;
			font-size: 0.75rem;
			color: var(--muted);
			background: var(--surface);

			&--open {
				color: light-dark(#b45309, #fbbf24);
				background: rgb(245 158 11 / 20%);
			}
		}

		&__none {
			font-size: 0.875rem;
		}
	}
</style>
