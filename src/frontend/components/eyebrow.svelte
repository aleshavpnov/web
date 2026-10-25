<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte'
	import type { Snippet } from 'svelte'

	/** Надзаголовок страницы: мелкие заглавные фирменного цвета с иконкой. */
	let { icon: Icon, children }: { icon: LucideIcon; children: Snippet } = $props()
</script>

<p class="eyebrow"><Icon size={14} />{@render children()}</p>

<style>
	.eyebrow {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.2em;
	}
</style>
