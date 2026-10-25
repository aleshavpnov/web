<script lang="ts">
	/**
	 * Аватар приглашённого друга: фото, если бот его достал, иначе инициалы на цветном кружке.
	 * По тапу фото раскрывается на весь экран: сразу уже скачанная миниатюра, а крупная
	 * подменяет её, когда доедет — пустой экран на время загрузки выглядел бы как поломка.
	 */
	import { initials, loadAvatar } from '#frontend/cabinet/lib/avatars.ts'

	let { tgId, label }: { tgId: number; label: string } = $props()

	/**
	 * Фон плейсхолдера. Цвет здесь чисто декоративный (смысл несут буквы), поэтому палитра
	 * выбрана мягкой, а не статусной — иначе красный кружок читался бы как «что-то не так».
	 */
	const TINTS = ['series-1', 'series-2', 'brand', 'warning'] as const

	let url = $state<string | null>(null)
	let full = $state<string | null>(null)
	let viewing = $state(false)

	const tint = $derived(TINTS[Math.abs(tgId) % TINTS.length])

	$effect(() => {
		let alive = true

		void loadAvatar(tgId).then((value) => {
			if (alive) url = value
		})

		return () => {
			alive = false
		}
	})

	$effect(() => {
		if (!viewing) return

		let alive = true

		void loadAvatar(tgId, true).then((value) => {
			if (alive && value) full = value
		})

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') viewing = false
		}

		document.addEventListener('keydown', onKey)

		return () => {
			alive = false
			document.removeEventListener('keydown', onKey)
		}
	})
</script>

{#if url}
	<button type="button" class="avatar avatar--photo" aria-label="Открыть фото" onclick={() => (viewing = true)}>
		<img class="avatar__image" src={url} alt="" />
	</button>
{:else}
	<span class={['avatar', `avatar--${tint}`]} aria-hidden="true">{initials(label)}</span>
{/if}

{#if viewing && url}
	<div
		class="avatar__viewer"
		role="dialog"
		aria-modal="true"
		aria-label={label}
		tabindex="-1"
		onclick={() => (viewing = false)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') viewing = false
		}}
	>
		<img class="avatar__full" src={full ?? url} alt={label} />
	</div>
{/if}

<style>
	.avatar {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		font-size: 11px;
		font-weight: 600;

		&--photo {
			cursor: zoom-in;
			background: none;

			&:focus-visible {
				outline: 2px solid var(--ring);
				outline-offset: 2px;
			}
		}

		&--series-1 {
			color: var(--viz-series-1);
			background: color-mix(in srgb, var(--viz-series-1) 15%, transparent);
		}

		&--series-2 {
			color: var(--viz-series-2);
			background: color-mix(in srgb, var(--viz-series-2) 15%, transparent);
		}

		&--brand {
			color: var(--brand);
			background: color-mix(in srgb, var(--brand) 15%, transparent);
		}

		&--warning {
			color: var(--viz-warning);
			background: color-mix(in srgb, var(--viz-warning) 20%, transparent);
		}

		&__image {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			object-fit: cover;
			box-shadow: 0 0 0 1px var(--card-ring);
		}

		&__viewer {
			position: fixed;
			z-index: 50;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1rem;
			background: rgb(0 0 0 / 85%);
		}

		&__full {
			aspect-ratio: 1;
			width: 100%;
			max-width: min(90vw, 640px);
			max-height: 80vh;
			border-radius: 1rem;
			object-fit: contain;
		}
	}
</style>
