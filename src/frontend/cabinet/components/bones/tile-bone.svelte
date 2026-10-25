<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	/**
	 * Плитка на месте `StatTile`: подпись с иконкой, крупное число, хинт. Иконка — та же,
	 * что стоит в готовой плитке: по ней плитку и узнают до загрузки.
	 */
	let {
		icon: Icon,
		label = '5rem',
		value = '3.5rem',
		hint = '6rem',
	}: {
		icon?: LucideIcon
		label?: string
		value?: string
		/** Пустая строка убирает хинт — у плиток без него высота на строку меньше. */
		hint?: string
	} = $props()
</script>

<div class="tile-bone">
	<span class="tile-bone__label">
		{#if Icon}<Icon class="tile-bone__icon" size={14} />{/if}
		<Skeleton width={label} height="0.75rem" />
	</span>
	<span class="tile-bone__value"><Skeleton width={value} height="1.5rem" /></span>
	{#if hint}<span class="tile-bone__hint"><Skeleton width={hint} height="0.75rem" /></span>{/if}
</div>

<style>
	.tile-bone {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		border-radius: calc(var(--radius) * 1.4);
		background: var(--card);
		box-shadow: 0 0 0 1px var(--card-ring);

		&__label {
			display: flex;
			gap: 0.375rem;
			align-items: center;
			height: 1rem;
		}

		:global(.tile-bone__icon) {
			flex-shrink: 0;
			color: color-mix(in srgb, var(--muted) 40%, transparent);
		}

		/* 1.875rem — рост строки с самим числом. */
		&__value {
			display: flex;
			align-items: center;
			height: 1.875rem;
			margin-top: 0.25rem;
		}

		&__hint {
			display: flex;
			align-items: center;
			height: 1rem;
			margin-top: 0.125rem;
		}
	}
</style>
