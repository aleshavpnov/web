<script lang="ts">
	import { CLIENT_ORDER, CLIENTS, type ClientId } from './apps.ts'

	/** Тогглер клиента: переключает все ссылки и название приложения в инструкции. */
	let { value = $bindable() }: { value: ClientId } = $props()
</script>

<div class="client-toggle">
	{#each CLIENT_ORDER as id (id)}
		{@const Icon = CLIENTS[id].Icon}
		<button
			class={['client-toggle__option', id === value && 'client-toggle__option--active']}
			type="button"
			aria-pressed={id === value}
			onclick={() => (value = id)}
		>
			<Icon class="client-toggle__icon" size={16} />
			{CLIENTS[id].name}
		</button>
	{/each}
</div>

<style>
	.client-toggle {
		display: inline-flex;
		padding: 0.125rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);

		&__option {
			cursor: pointer;
			display: inline-flex;
			gap: 0.375rem;
			align-items: center;
			min-height: 2.5rem;
			padding: 0.5rem 1rem;
			border: 0;
			border-radius: calc(var(--radius) * 0.8);
			font: inherit;
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.025em;
			background: none;
			transition: color 0.15s;

			&:hover {
				color: var(--fg);
			}

			&--active,
			&--active:hover {
				color: var(--accent);
				background: color-mix(in srgb, var(--accent-fill) 10%, transparent);
			}
		}

		:global(.client-toggle__icon) {
			flex-shrink: 0;
			width: auto;
		}
	}
</style>
