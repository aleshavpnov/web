<script lang="ts">
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'
	import { Activity, ArrowRight, Gauge, Lock, Zap } from '@lucide/svelte'

	import Cta from '#frontend/components/cta.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import { formatMbps } from '#frontend/site/format.ts'
	import { status, statusError } from '#frontend/site/state/status.ts'

	import HealthDot from './health-dot.svelte'
	import RatingBadge from './rating-badge.svelte'

	// Пик — основное число; на старом кэше без peakBps откатываемся на среднее.
	const peakBps = $derived($status?.traffic?.peakBps ?? $status?.traffic?.avgBps ?? null)
	const avgBps = $derived($status?.traffic?.avgBps ?? null)
	const pingMs = $derived($status?.internet?.latencyMs ?? null)
	const nodesUp = $derived($status?.nodes.filter((n) => n.status === 'operational').length ?? 0)
	const nodesTotal = $derived($status?.nodes.length ?? 0)
	const loading = $derived(!$status && !$statusError)
</script>

<!-- Число плитки, а пока статус не пришёл — кость на его месте; при сбое статуса — прочерк. -->
{#snippet value(text: string | null, width: string)}
	{#if loading}
		<Skeleton {width} height="2.25rem" />
	{:else}
		{text ?? '—'}
	{/if}
{/snippet}

<Shell page="home" wide>
	<div class="home">
		<section class="home__hero">
			<p class="home__eyebrow"><Lock size={14} />Частный доступ</p>
			<h1 class="home__title">В&nbsp;интернет без&nbsp;ограничений</h1>
			<p class="home__lead">
				Ваше радикальное решение проблем, работает везде и&nbsp;всегда, работает лучше остальных
			</p>
			<div class="home__cta"><Cta href="/get" glow><Zap size={18} />Получить доступ</Cta></div>
		</section>

		<section class="home__tiles" aria-label="Сегодня">
			<div class="home__tile">
				<span class="home__label"><Gauge class="home__icon" size={15} />Пиковая скорость сегодня</span>
				<span class="home__value">
					{@render value(peakBps === null ? null : formatMbps(peakBps), '5rem')}
					<span class="home__unit">Мбит/с</span>
				</span>
				<span class="home__note">
					{#if avgBps !== null}в&nbsp;среднем {formatMbps(avgBps)}&nbsp;Мбит/с{:else}&nbsp;{/if}
				</span>
			</div>

			<div class="home__tile">
				<span class="home__label"><Activity class="home__icon" size={15} />Пинг до&nbsp;интернета</span>
				<span class="home__value">
					{@render value(pingMs === null ? null : String(pingMs), '3rem')}
					<span class="home__unit">мс</span>
				</span>
				<span class="home__note">за&nbsp;сегодня</span>
			</div>

			<a class="home__tile home__tile--link" href="/status">
				<span class="home__label">
					<HealthDot status={$statusError ? 'unknown' : ($status?.overall ?? 'unknown')} />Серверы
				</span>
				<span class="home__value">
					{@render value($status ? `${nodesUp} из ${nodesTotal}` : null, '6rem')}
					<span class="home__unit">в&nbsp;строю</span>
				</span>
				<span class="home__more">
					{$statusError ? 'Статус недоступен' : 'Статус и аптайм'}
					<ArrowRight size={14} />
				</span>
			</a>
		</section>

		<div class="home__badge"><RatingBadge /></div>
	</div>
</Shell>

<style>
	.home {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 2.5rem;
		align-items: center;
		justify-content: center;

		&__hero {
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
			align-items: center;
			max-width: 48rem;
			text-align: center;
		}

		&__eyebrow {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			padding: 0.375rem 0.875rem;
			border-radius: 999px;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--accent);
			text-transform: uppercase;
			letter-spacing: 0.2em;
			background: color-mix(in srgb, var(--accent-fill) 12%, transparent);
		}

		&__title {
			font-size: clamp(2.5rem, 7vw, 4rem);
			font-weight: 800;
			line-height: 1.05;
			letter-spacing: -0.035em;
		}

		&__lead {
			max-width: 35rem;
			font-size: clamp(1rem, 2vw, 1.1875rem);
			line-height: 1.6;
			color: var(--muted);
		}

		&__cta {
			width: 100%;

			@media (--sm) {
				width: auto;
			}
		}

		&__tiles {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: 1rem;
			width: 100%;

			@media (--md) {
				grid-template-columns: repeat(3, minmax(0, 1fr));
			}
		}

		&__tile {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			padding: 1.375rem 1.5rem;
			border: 1px solid var(--border);
			border-radius: 1rem;
			color: var(--fg);
			text-decoration: none;
			background: var(--card);

			&--link {
				transition: border-color 0.15s;

				&:hover {
					border-color: var(--accent);
				}
			}
		}

		&__label {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			font-size: 0.8125rem;
			color: var(--muted);
		}

		:global(.home__icon) {
			color: var(--accent);
		}

		&__value {
			display: flex;
			gap: 0.375rem;
			align-items: baseline;
			min-height: 2.75rem;
			font-size: 2.25rem;
			font-weight: 800;
			font-variant-numeric: tabular-nums;
			letter-spacing: -0.02em;
		}

		&__unit {
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--muted);
		}

		&__note {
			font-size: 0.8125rem;
			color: var(--muted);
		}

		&__more {
			display: inline-flex;
			gap: 0.25rem;
			align-items: center;
			font-size: 0.8125rem;
			font-weight: 600;
			color: var(--accent);
		}

		&__badge {
			width: 100%;
			max-width: 21rem;
		}
	}
</style>
