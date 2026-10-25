<script lang="ts">
	import { Check, Copy } from '@lucide/svelte'

	import { copyText } from '#frontend/cabinet/lib/clipboard.ts'
	import { toast } from '#frontend/lib/toast.ts'

	/**
	 * Значение, которое копируется по клику. В мини-аппе выделить текст пальцем практически
	 * нельзя (жест уходит вебвью на прокрутку), поэтому единственный рабочий способ забрать
	 * ссылку — кнопка. Иконка меняется на галочку на секунду: отклик нужен там, куда смотрит палец.
	 *
	 * Не `copy-value` кита: тот пишет только через `navigator.clipboard`, а в вебвью Telegram
	 * на части Android его нет — здесь запасной путь из `lib/clipboard.ts` и тост.
	 */
	let {
		value,
		text,
		mono = false,
	}: {
		value: string
		/** Что показать в строке; по умолчанию само значение. */
		text?: string
		/** Моноширинная строка — под ссылки. */
		mono?: boolean
	} = $props()

	/** Сколько держится галочка после копирования. */
	const COPIED_MS = 1200

	let copied = $state(false)

	$effect(() => {
		if (!copied) return

		const timer = setTimeout(() => (copied = false), COPIED_MS)

		return () => clearTimeout(timer)
	})

	async function copy() {
		if (await copyText(value)) {
			copied = true
			toast.success('Скопировано')
		} else {
			toast.error('Не удалось скопировать')
		}
	}
</script>

<button type="button" class={['copy-value', mono && 'copy-value--mono']} title="Скопировать" onclick={copy}>
	<span class="copy-value__text">{text ?? value}</span>
	{#if copied}
		<Check class="copy-value__done" size={16} />
	{:else}
		<Copy class="copy-value__icon" size={16} />
	{/if}
</button>

<style>
	.copy-value {
		cursor: pointer;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 2.75rem;
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: var(--radius);
		font: inherit;
		font-size: 0.875rem;
		color: inherit;
		text-align: left;
		background: var(--surface);
		transition: color 0.15s;

		&:hover {
			color: var(--fg);
		}

		&--mono {
			padding-block: 0.625rem;
			font-family: ui-monospace, sfmono-regular, menlo, monospace;
		}

		&__text {
			overflow: hidden;
			min-width: 0;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		:global(.copy-value__icon) {
			flex-shrink: 0;
			opacity: 0.6;
		}

		:global(.copy-value__done) {
			flex-shrink: 0;
			color: var(--viz-good);
		}
	}
</style>
