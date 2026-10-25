<script lang="ts">
	import type { Snippet } from 'svelte'

	/** Заголовок шага — заметный бейдж, чтобы шаги не терялись. */
	let { children }: { children: Snippet } = $props()
</script>

<span class="step-badge">{@render children()}</span>

<style>
	.step-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border-radius: calc(var(--radius) * 0.8);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: color-mix(in srgb, var(--accent-fill) 10%, transparent);
	}
</style>
