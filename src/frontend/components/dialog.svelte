<script lang="ts">
	import type { Snippet } from 'svelte'

	/**
	 * Модальное окно на `<dialog>`: Escape, фокус и слой поверх страницы даёт браузер,
	 * клик мимо панели закрывает окно.
	 */
	let { open, title, onclose, children }: { open: boolean; title: string; onclose: () => void; children: Snippet } =
		$props()

	let node: HTMLDialogElement

	$effect(() => {
		if (open && !node.open) node.showModal()
		else if (!open && node.open) node.close()
	})
</script>

<dialog
	bind:this={node}
	class="dialog"
	aria-label={title}
	{onclose}
	onclick={(e) => {
		if (e.target === node) onclose()
	}}
>
	<div class="dialog__panel">
		<p class="dialog__title">{title}</p>
		<div class="dialog__body">{@render children()}</div>
	</div>
</dialog>

<style>
	.dialog {
		width: calc(100% - 2rem);
		max-width: 20rem;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1.4);
		color: var(--fg);
		background: var(--bg);
		box-shadow: 0 20px 25px -5px rgb(0 0 0 / 20%);

		&::backdrop {
			background: rgb(0 0 0 / 50%);
		}

		&__panel {
			padding: 1rem;
		}

		&__title {
			margin-bottom: 0.75rem;
			font-size: 0.875rem;
			font-weight: 600;
		}

		&__body {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
