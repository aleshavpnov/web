<script lang="ts">
	import type { DayTone } from '#frontend/site/status-view.ts'

	/** Полоса сервера по дням: ячейка на день, цвет -- был ли в этот день сбой. */
	let { days }: { days: { day: string; tone: DayTone }[] } = $props()

	const TONE_LABEL: Record<DayTone, string> = {
		ok: 'без сбоев',
		warn: 'был сбой',
		bad: 'лежал больше половины дня',
		none: 'сервера ещё не было',
	}
</script>

<div class="day-strip" aria-hidden="true">
	{#each days as d (d.day)}
		<span class="day-strip__day day-strip__day--{d.tone}" title={`${d.day}: ${TONE_LABEL[d.tone]}`}></span>
	{/each}
</div>

<style>
	.day-strip {
		display: flex;
		gap: 3px;
		height: 1.125rem;

		@media (--md) {
			height: 1.375rem;
		}

		&__day {
			flex: 1;
			min-width: 0;
			border-radius: 2px;
			background: var(--surface);

			&--ok {
				background: var(--status-ok);
			}

			&--warn {
				background: var(--status-warn);
			}

			&--bad {
				background: var(--status-bad);
			}
		}
	}
</style>
