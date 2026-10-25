<script lang="ts">
	import type { Snippet } from 'svelte'

	/**
	 * Карточка секции: тот же фон, скругление и обводка у всех блоков с содержимым.
	 * `highlight` — фирменное кольцо выбранного или рекомендованного, `tight` — узкие поля
	 * по вертикали у карточки-списка, `glow` — цель диплинка, к которой привели человека.
	 */
	let {
		highlight = false,
		tight = false,
		glow = false,
		node = $bindable(),
		class: className,
		children,
	}: {
		highlight?: boolean
		tight?: boolean
		glow?: boolean
		node?: HTMLElement
		class?: string
		children: Snippet
	} = $props()
</script>

<section
	bind:this={node}
	class={['card', highlight && 'card--highlight', tight && 'card--tight', glow && 'card--glow', className]}
>
	{@render children()}
</section>

<style>
	.card {
		scroll-margin-top: 1rem;
		padding: 1rem;
		border-radius: calc(var(--radius) * 1.4);
		background: var(--card);
		box-shadow: 0 0 0 1px var(--card-ring);
		transition: box-shadow 0.2s;

		&--highlight {
			box-shadow: 0 0 0 2px var(--brand);
		}

		&--glow {
			box-shadow:
				0 0 0 2px color-mix(in srgb, var(--brand) 60%, transparent),
				0 10px 15px -3px rgb(0 0 0 / 10%);
		}

		&--tight {
			padding-block: 0.5rem;
		}
	}
</style>
