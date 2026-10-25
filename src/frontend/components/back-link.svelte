<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte'
</script>

<!-- Возврат на главную в том же виде, что «Вернуться» в шапке. -->
<a class="back-link" href="/"><ArrowLeft class="back-link__icon" size={16} />Вернуться</a>

<style>
	.back-link {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--fg);
		text-decoration: none;
		white-space: nowrap;

		&:hover {
			color: color-mix(in srgb, var(--fg) 80%, transparent);
		}

		:global(.back-link__icon) {
			color: var(--accent);
		}
	}
</style>
