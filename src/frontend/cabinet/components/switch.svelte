<script lang="ts">
	/**
	 * Переключатель «включено / выключено».
	 *
	 * Отличие от кнопки с подписью: состояние читается по положению, а не по слову, и тап по
	 * нему не выглядит как «отправить». Дорожка ростом 28px при ширине 48 — тач-цель по
	 * нижней границе комфортного.
	 */
	let {
		id,
		label,
		checked,
		disabled = false,
		onchange,
	}: { id: string; label: string; checked: boolean; disabled?: boolean; onchange: (next: boolean) => void } = $props()
</script>

<button
	{id}
	type="button"
	role="switch"
	aria-label={label}
	class={['switch', checked && 'switch--on']}
	aria-checked={checked}
	{disabled}
	onclick={() => onchange(!checked)}
>
	<span class="switch__thumb"></span>
</button>

<style>
	.switch {
		cursor: pointer;
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		width: 3rem;
		height: 1.75rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: var(--surface);
		outline: none;
		transition: background-color 0.2s;

		&:focus-visible {
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&--on {
			background: var(--brand-fill);
		}

		&__thumb {
			translate: 0.125rem 0;
			display: block;
			width: 1.5rem;
			height: 1.5rem;
			border-radius: 50%;
			background: var(--bg);
			box-shadow:
				0 1px 2px rgb(0 0 0 / 10%),
				0 0 0 1px var(--card-ring);
			transition: translate 0.2s;
		}

		&--on &__thumb {
			translate: 1.375rem 0;
		}
	}
</style>
