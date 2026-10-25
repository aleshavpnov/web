<script lang="ts">
	import type { Snippet } from 'svelte'

	/** Строка «ключ — значение» для карточек. */
	let { label, children }: { label: string; children: Snippet } = $props()
</script>

<div class="row">
	<span class="row__label">{label}</span>
	<span class="row__value">{@render children()}</span>
</div>

<style>
	.row {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		justify-content: space-between;
		padding-block: 0.25rem;
		font-size: 0.875rem;

		&__label {
			flex-shrink: 0;
			color: var(--muted);
		}

		&__value {
			text-align: right;
		}
	}
</style>
