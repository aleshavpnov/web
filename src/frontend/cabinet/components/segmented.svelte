<script lang="ts" generics="T extends string">
	/**
	 * Переключатель «одно из нескольких»: окно графика, домен ссылки.
	 * Панель во всю ширину и ростом с кнопку — делениями попадают пальцем так же часто.
	 */
	let {
		value = $bindable(),
		options,
		disabled = false,
		onchange,
	}: {
		value: T
		options: ReadonlyArray<{ value: T; label: string }>
		disabled?: boolean
		onchange?: (value: T) => void
	} = $props()
</script>

<div class="segmented" role="tablist">
	{#each options as option (option.value)}
		<button
			type="button"
			role="tab"
			class={['segmented__option', option.value === value && 'segmented__option--active']}
			aria-selected={option.value === value}
			{disabled}
			onclick={() => {
				value = option.value
				onchange?.(option.value)
			}}
		>
			{option.label}
		</button>
	{/each}
</div>

<style>
	.segmented {
		display: flex;
		width: 100%;
		height: 2.75rem;
		padding: 3px;
		border-radius: var(--radius);
		background: var(--surface);

		&__option {
			cursor: pointer;
			flex: 1;
			padding: 0 0.75rem;
			border: 0;
			border-radius: calc(var(--radius) * 0.8);
			font: inherit;
			font-size: 0.875rem;
			font-weight: 500;
			color: color-mix(in srgb, var(--fg) 60%, transparent);
			white-space: nowrap;
			background: none;
			transition:
				background-color 0.15s,
				color 0.15s;

			&:hover {
				color: var(--fg);
			}

			&:focus-visible {
				outline: 2px solid var(--ring);
				outline-offset: -2px;
			}

			&:disabled {
				pointer-events: none;
				opacity: 0.5;
			}

			&--active,
			&--active:hover {
				color: var(--brand-fg);
				background: var(--brand);
				box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
			}
		}
	}
</style>
