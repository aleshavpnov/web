<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte'

	/** Кнопка-ответ визарда: крупная цель под палец, иконка и пояснение под подписью. */
	let {
		label,
		hint,
		icon: Icon,
		selected,
		onclick,
	}: { label: string; hint: string; icon: LucideIcon; selected: boolean; onclick: () => void } = $props()
</script>

<button type="button" class={['choice-card', selected && 'choice-card--selected']} {onclick}>
	<Icon class="choice-card__icon" size={24} />
	<span class="choice-card__text">
		<span class="choice-card__label">{label}</span>
		<span class="choice-card__hint">{hint}</span>
	</span>
</button>

<style>
	.choice-card {
		cursor: pointer;
		display: flex;
		gap: 0.75rem;
		align-items: center;
		width: 100%;
		padding: 1rem;
		border: 0;
		border-radius: calc(var(--radius) * 1.4);
		font: inherit;
		color: inherit;
		text-align: left;
		background: var(--card);
		box-shadow: 0 0 0 1px var(--card-ring);
		transition: background-color 0.15s;

		&:hover {
			background: color-mix(in srgb, var(--surface) 50%, var(--card));
		}

		:global(.choice-card__icon) {
			flex-shrink: 0;
			color: var(--muted);
		}

		&--selected {
			box-shadow: 0 0 0 2px var(--brand);

			&:hover {
				background: var(--card);
			}

			:global(.choice-card__icon) {
				color: var(--brand);
			}
		}

		&__text {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		&__label {
			font-weight: 600;
		}

		&__hint {
			font-size: 0.75rem;
			color: var(--muted);
		}
	}
</style>
