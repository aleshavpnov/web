<script lang="ts">
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	/**
	 * Силуэт столбчатого графика ростом с `UsageBars`. Высоты — паттерн, а не `Math.random()`:
	 * случайные высоты плясали бы на каждом рендере, и скелетон дёргался бы сам по себе.
	 */
	let { count = 15 }: { count?: number } = $props()

	const PATTERN = [52, 78, 41, 96, 63, 34, 71, 88, 47, 60, 82, 38, 67, 45, 90]
</script>

<div class="bars-bone" aria-hidden="true">
	{#each { length: count }, i (i)}
		<span class="bars-bone__bar"><Skeleton height={`${PATTERN[i % PATTERN.length]}%`} /></span>
	{/each}
</div>

<style>
	.bars-bone {
		display: flex;
		gap: 0.125rem;
		align-items: flex-end;
		height: 140px;

		&__bar {
			display: flex;
			flex: 1;
			align-items: flex-end;
			height: 100%;
		}
	}
</style>
