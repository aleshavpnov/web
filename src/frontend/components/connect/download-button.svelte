<script lang="ts">
	import { Download, Smartphone } from '@lucide/svelte'

	import Dialog from '#frontend/components/dialog.svelte'

	import type { Store } from './apps.ts'

	/**
	 * Кнопка шага инструкции: «Скачать для …» прямой ссылкой или с выбором магазина,
	 * либо «Открыть в приложении». Высота 40px: инструкцию читают с телефона, а по кнопке
	 * в 28px палец промахивается.
	 */
	type Props =
		| { kind: 'direct'; href: string; device: string }
		| { kind: 'stores'; stores: Store[]; device: string }
		| { kind: 'open'; href: string; onopen?: () => void }

	let props: Props = $props()
	let open = $state(false)
</script>

{#if props.kind === 'direct'}
	<a class="download" href={props.href} target="_blank" rel="noopener noreferrer">
		<Download size={14} />Скачать для {props.device}
	</a>
{:else if props.kind === 'stores'}
	<button class="download" type="button" onclick={() => (open = true)}>
		<Download size={14} />Скачать для {props.device}
	</button>
	<Dialog {open} title="Выберите магазин" onclose={() => (open = false)}>
		{#each props.stores as store (store.href)}
			<a
				class="download__store"
				href={store.href}
				target="_blank"
				rel="noopener noreferrer"
				onclick={() => (open = false)}
			>
				{store.label}
			</a>
		{/each}
	</Dialog>
{:else}
	{@const onopen = props.onopen}
	<!-- В кабинете ссылку нельзя открывать обычным переходом: вебвью Telegram её проглотит,
	     нужен openLink из SDK. href остаётся для долгого нажатия и читалок. -->
	<a
		class="download"
		href={props.href}
		target="_blank"
		rel="noopener noreferrer"
		onclick={(e) => {
			if (!onopen) return

			e.preventDefault()
			onopen()
		}}
	>
		<Smartphone size={14} />Открыть в приложении
	</a>
{/if}

<style>
	.download {
		cursor: pointer;
		display: flex;
		gap: 0.375rem;
		align-items: center;
		width: fit-content;
		min-height: 2.5rem;
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		border: 0;
		border-radius: calc(var(--radius) * 0.8);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--cta-fg);
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		background: var(--cta-bg);
		transition:
			background-color 0.15s,
			scale 0.15s;

		&:hover {
			background: var(--cta-bg-hover);
		}

		&:active {
			scale: 0.95;
		}

		&__store {
			display: flex;
			align-items: center;
			min-height: 2.75rem;
			padding: 0.625rem 0.75rem;
			border-radius: var(--radius);
			font-size: 0.875rem;
			color: var(--fg);
			text-decoration: none;

			&:hover {
				background: var(--surface);
			}
		}
	}
</style>
