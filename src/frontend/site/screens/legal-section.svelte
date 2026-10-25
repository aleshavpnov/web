<script lang="ts">
	import type { Snippet } from 'svelte'

	/** Раздел юридического документа; список пунктов, если есть, идёт после текста. */
	let { title, items = [], children }: { title: string; items?: string[]; children?: Snippet } = $props()
</script>

<section class="legal__section">
	<h2 class="legal__heading">{title}</h2>
	{@render children?.()}
	{#if items.length}
		<ul class="legal__list">
			{#each items as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
</section>
