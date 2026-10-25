<script lang="ts">
	import type { Snippet } from 'svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	/**
	 * Строка списка: что-то слева (аватар, иконка), одна-две полоски текста и хвост справа —
	 * кнопки, тумблер. Ширины полосок задают экраны: у имени и подписи они разные.
	 */
	let {
		leading,
		lines = ['8rem', '13rem'],
		tail,
		pad = 'sm',
	}: { leading?: Snippet; lines?: readonly string[]; tail?: Snippet; pad?: 'sm' | 'md' } = $props()
</script>

<div class={['row-bone', `row-bone--${pad}`]}>
	{@render leading?.()}
	<span class="row-bone__lines">
		{#each lines as width, i (i)}
			<Skeleton {width} height={i === 0 ? '0.875rem' : '0.75rem'} />
		{/each}
	</span>
	{@render tail?.()}
</div>

<style>
	.row-bone {
		display: flex;
		gap: 0.75rem;
		align-items: center;

		&--sm {
			padding-block: 0.5rem;
		}

		&--md {
			padding-block: 0.75rem;
		}

		&__lines {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.375rem;
			min-width: 0;
		}
	}
</style>
