<script lang="ts">
	import { Check } from '@lucide/svelte'

	import Dialog from '#frontend/components/dialog.svelte'

	import { platforms, type Platform } from './apps.ts'

	/** Выбор платформы вручную — «инструкция для другого устройства». */
	let { open, value = $bindable(), onclose }: { open: boolean; value: Platform; onclose: () => void } = $props()
</script>

<Dialog {open} title="Выберите платформу" {onclose}>
	{#each platforms as p (p.key)}
		<button
			class={['platform', p.key === value && 'platform--active']}
			type="button"
			onclick={() => {
				value = p.key
				onclose()
			}}
		>
			{p.label}
			{#if p.key === value}<Check size={16} />{/if}
		</button>
	{/each}
</Dialog>

<style>
	.platform {
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 2.75rem;
		padding: 0.625rem 0.75rem;
		border: 0;
		border-radius: var(--radius);
		font: inherit;
		font-size: 0.875rem;
		color: var(--fg);
		background: none;
		transition: background-color 0.15s;

		&:hover {
			background: var(--surface);
		}

		&--active,
		&--active:hover {
			font-weight: 600;
			color: var(--accent);
			background: color-mix(in srgb, var(--accent-fill) 10%, transparent);
		}
	}
</style>
