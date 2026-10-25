<script lang="ts">
	import type { Snippet } from 'svelte'

	/** Нумерованный список — общая разметка всех шагов инструкции. */
	let { items }: { items: Snippet[] } = $props()
</script>

<ol class="step-list">
	{#each items as item, i (i)}
		<li class="step-list__item">
			<span class="step-list__number">{i + 1}</span>
			<span class="step-list__text">{@render item()}</span>
		</li>
	{/each}
</ol>

<style>
	.step-list {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;

		&__item {
			display: flex;
			gap: 0.5rem;
			align-items: flex-start;
		}

		&__number {
			flex-shrink: 0;
			width: 1rem;
			font-size: 0.875rem;
			font-weight: 700;
			line-height: 1.625;
			color: var(--accent);
		}

		&__text {
			font-size: 0.875rem;
			line-height: 1.625;
			color: color-mix(in srgb, var(--fg) 80%, transparent);
		}
	}
</style>
