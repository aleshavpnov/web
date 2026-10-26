<script lang="ts">
	import InfoTip from '@aimuzov/infra-site-kit/ui/info-tip.svelte'
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'
	import { Activity, ArrowRight, Gauge, Lock, Zap } from '@lucide/svelte'

	import Cta from '#frontend/components/cta.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import { formatMbps } from '#frontend/site/format.ts'
	import { status, statusError } from '#frontend/site/state/status.ts'

	import HealthDot from './health-dot.svelte'
	import { HEALTH_LABEL } from './health.ts'
	import RatingBadge from './rating-badge.svelte'

	// Пик — основное число; на старом кэше без peakBps откатываемся на среднее.
	const peakBps = $derived($status?.traffic?.peakBps ?? $status?.traffic?.avgBps ?? null)
	const avgBps = $derived($status?.traffic?.avgBps ?? null)
	const pingMs = $derived($status?.internet?.latencyMs ?? null)
</script>

<!-- Число метрики, а пока оно не пришло — кость на его месте: заголовок читается одинаково
     в обоих состояниях, и подстановка значения не перекраивает текст. -->
{#snippet metric(value: string | null, width: string)}
	{#if value === null}
		<span class="home__bone"><Skeleton {width} height="0.7em" /></span>
	{:else}
		{value}
	{/if}
{/snippet}

<Shell page="home" wide>
	<div class="home">
		<section class="home__intro">
			<Eyebrow icon={Lock}>Частный доступ</Eyebrow>
			<h1 class="home__title">
				В&nbsp;интернет без&nbsp;ограничений со&nbsp;скоростью до
				<span class="home__metric">
					<Gauge size="0.7em" />
					<span class="home__number"
						>{@render metric(peakBps === null ? null : formatMbps(peakBps), '2.1em')}&nbsp;Мбит/с</span
					>
					{#if avgBps !== null}
						<span class="home__tip">
							<InfoTip
								label="Средняя скорость"
								text={`Средняя за сегодня — ${formatMbps(avgBps)} Мбит/с`}
							/>
						</span>
					{/if}
				</span>
				и&nbsp;пингом
				<span class="home__metric">
					<Activity size="0.7em" />
					<span class="home__number"
						>{@render metric(pingMs === null ? null : String(pingMs), '1.3em')}&nbsp;мс</span
					>
				</span>
				за&nbsp;сегодня
			</h1>
			<p class="home__lead">
				Ваше радикальное решение проблем, работает везде и&nbsp;всегда, работает лучше остальных
			</p>
			<div class="home__actions">
				<div class="home__cta"><Cta href="/get" glow><Zap size={18} />Получить доступ</Cta></div>
				<a class="home__faq" href="/faq">Частые вопросы <ArrowRight size={14} /></a>
			</div>
		</section>

		<aside class="home__aside">
			<div class="home__status">
				{#if $statusError}
					<p class="home__status-row home__status-row--muted">
						<HealthDot status="unknown" />Статус недоступен
					</p>
				{:else if !$status}
					<div class="home__status-row" role="status" aria-label="Загрузка статуса">
						<Skeleton width="8rem" height="1rem" />
						<Skeleton width="4rem" height="0.75rem" />
					</div>
					<div class="home__nodes">
						{#each ['a', 'b', 'c'] as k (k)}
							<div class="home__node">
								<Skeleton width="6rem" height="0.75rem" />
								<Skeleton width="2.5rem" height="0.75rem" />
							</div>
						{/each}
					</div>
				{:else}
					<div class="home__status-row">
						<span class={['home__overall', $status.overall === 'operational' && 'home__overall--ok']}>
							<HealthDot status={$status.overall} />{HEALTH_LABEL[$status.overall]}
						</span>
						<a class="home__more" href="/status">подробнее <ArrowRight size={14} /></a>
					</div>
					{#if $status.nodes.length > 0}
						<div class="home__nodes">
							{#each $status.nodes as node (node.label)}
								<div class="home__node">
									<span class="home__node-label"><HealthDot status={node.status} />{node.label}</span>
									{#if node.uptime.d1 !== null}
										<span class="home__node-uptime">{Math.round(node.uptime.d1 * 10) / 10}%</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
			<RatingBadge />
		</aside>
	</div>
</Shell>

<style>
	.home {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		flex: 1;
		gap: 2.5rem;
		align-content: center;

		@media (--md) {
			grid-template-columns: minmax(0, 1fr) 24rem;
			gap: 4.5rem;
			align-items: center;
		}

		&__intro {
			display: grid;
			gap: 1.5rem;
		}

		&__title {
			font-size: clamp(2.25rem, 5.2vw, 3.75rem);
			font-weight: 800;
			line-height: 1.1;
			letter-spacing: -0.03em;
		}

		&__metric {
			display: inline-flex;
			gap: 0.25rem;
			align-items: center;
			margin-inline: 0.25rem;
			color: var(--accent);
			white-space: nowrap;
			vertical-align: baseline;
		}

		&__number {
			font-variant-numeric: tabular-nums;
		}

		&__bone {
			display: inline-block;
			vertical-align: baseline;
		}

		&__tip {
			font-size: 1rem;
			font-weight: 400;
			letter-spacing: normal;
		}

		&__lead {
			max-width: 32rem;
			font-size: clamp(1rem, 1.6vw, 1.125rem);
			line-height: 1.6;
			color: var(--muted);
		}

		&__actions {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem 1.5rem;
			align-items: center;
		}

		&__cta {
			width: 100%;

			@media (--sm) {
				width: auto;
			}
		}

		&__faq {
			display: inline-flex;
			gap: 0.25rem;
			align-items: center;
			font-size: 0.9375rem;
			font-weight: 600;
			color: var(--fg);
			text-decoration: none;

			&:hover {
				color: var(--accent);
			}
		}

		&__aside {
			display: grid;
			gap: 1rem;
		}

		&__status {
			display: grid;
			gap: 1rem;
			padding: 1.375rem;
			border: 1px solid var(--border);
			border-radius: 1.125rem;
			background: var(--card);
			box-shadow: 0 12px 32px -16px rgb(0 0 0 / 12%);
		}

		&__status-row {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			justify-content: space-between;
			min-height: 1.25rem;
			font-size: 0.9375rem;

			&--muted {
				justify-content: flex-start;
				color: var(--muted);
			}
		}

		&__overall {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			font-weight: 700;

			&--ok {
				color: var(--accent);
			}
		}

		&__more {
			display: inline-flex;
			gap: 0.25rem;
			align-items: center;
			font-size: 0.8125rem;
			color: var(--muted);
			text-decoration: none;
			transition: color 0.15s;

			&:hover {
				color: var(--fg);
			}
		}

		&__nodes {
			display: grid;
			gap: 0.625rem;
			padding-top: 1rem;
			border-top: 1px solid var(--border);
		}

		&__node {
			display: flex;
			align-items: center;
			justify-content: space-between;
			min-height: 1.25rem;
			font-size: 0.875rem;
		}

		&__node-label {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
		}

		&__node-uptime {
			font-variant-numeric: tabular-nums;
			color: var(--muted);
		}
	}
</style>
