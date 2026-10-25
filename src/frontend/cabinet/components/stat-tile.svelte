<script lang="ts">
	import { ChevronRight, type LucideIcon } from '@lucide/svelte'

	/**
	 * Плитка со значением: крупное число и подпись. С `onclick` становится кнопкой — плитки
	 * главной так ведут в свои разделы, и шеврон в углу говорит, что нажатие куда-то ведёт.
	 */
	let {
		label,
		value,
		hint,
		icon: Icon,
		onclick,
	}: {
		label: string
		value: string | number
		hint?: string
		icon?: LucideIcon
		onclick?: () => void
	} = $props()
</script>

{#snippet body()}
	<span class="stat-tile__head">
		<span class="stat-tile__label">
			{#if Icon}<Icon class="stat-tile__icon" size={14} />{/if}
			<span class="stat-tile__label-text">{label}</span>
		</span>
		{#if onclick}<ChevronRight class="stat-tile__chevron" size={16} />{/if}
	</span>
	<span class="stat-tile__value">{value}</span>
	{#if hint !== undefined}<span class="stat-tile__hint">{hint}</span>{/if}
{/snippet}

{#if onclick}
	<button type="button" class="stat-tile stat-tile--button" {onclick}>{@render body()}</button>
{:else}
	<div class="stat-tile">{@render body()}</div>
{/if}

<style>
	.stat-tile {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 0;
		padding: 1rem;
		border: 0;
		border-radius: calc(var(--radius) * 1.4);
		font: inherit;
		color: inherit;
		text-align: left;
		background: var(--card);
		box-shadow: 0 0 0 1px var(--card-ring);

		&--button {
			cursor: pointer;
			transition: background-color 0.15s;

			&:hover {
				background: color-mix(in srgb, var(--surface) 50%, var(--card));
			}
		}

		&__head {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			justify-content: space-between;
		}

		&__label {
			display: flex;
			gap: 0.375rem;
			align-items: center;
			min-width: 0;
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__label-text {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		:global(.stat-tile__icon),
		:global(.stat-tile__chevron) {
			flex-shrink: 0;
			color: var(--muted);
		}

		&__value {
			margin-top: 0.25rem;
			font-size: 1.5rem;
			font-weight: 600;
			line-height: 1.25;
		}

		&__hint {
			margin-top: 0.125rem;
			font-size: 0.75rem;
			color: var(--muted);
		}
	}
</style>
