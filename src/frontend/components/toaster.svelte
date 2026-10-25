<script lang="ts">
	import { CircleCheck, LoaderCircle, OctagonX, TriangleAlert } from '@lucide/svelte'
	import { fly } from 'svelte/transition'

	import { dismissToast, toastsAtom } from '#frontend/lib/toast.ts'

	// Тосты как у codenames: сверху по центру, клик закрывает.
	const icons = {
		success: CircleCheck,
		error: OctagonX,
		warning: TriangleAlert,
		loading: LoaderCircle,
	}
</script>

<section class="toaster" aria-live="polite" aria-label="Уведомления">
	{#each $toastsAtom as toast (toast.id)}
		{@const Icon = icons[toast.type]}
		<button
			type="button"
			class="toaster__toast"
			transition:fly={{ y: -16, duration: 200 }}
			onclick={() => dismissToast(toast.id)}
		>
			<span class="toaster__icon toaster__icon--{toast.type}" aria-hidden="true"><Icon size={16} /></span>
			<span class="toaster__text">
				<span class="toaster__title">{toast.title}</span>
				{#if toast.description}
					<span class="toaster__description">{toast.description}</span>
				{/if}
			</span>
		</button>
	{/each}
</section>

<style>
	.toaster {
		pointer-events: none;
		position: fixed;
		z-index: 100;
		top: calc(env(safe-area-inset-top, 0px) + 1rem);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: min(100% - 2rem, 22rem);

		&__toast {
			pointer-events: auto;
			cursor: pointer;
			display: flex;
			gap: 0.625rem;
			align-items: center;
			padding: 0.875rem 1rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 1.4);
			font: inherit;
			font-size: 0.8125rem;
			color: var(--fg);
			text-align: left;
			background: var(--card);
			box-shadow: 0 4px 12px oklch(0 0 0 / 10%);
		}

		&__icon {
			display: inline-flex;
			flex-shrink: 0;

			&--success {
				color: var(--accent);
			}

			&--error {
				color: var(--danger);
			}

			&--loading {
				animation: spin 1s linear infinite;
			}
		}

		&__text {
			display: flex;
			flex-direction: column;
			gap: 0.125rem;
		}

		&__title {
			font-weight: 500;
		}

		&__description {
			color: var(--muted);
		}
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}
</style>
