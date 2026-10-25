<script lang="ts">
	import { Copy, Plus, Power, RefreshCw } from '@lucide/svelte'

	import { SPOTLIGHT_ATTR, type SpotlightTarget } from './apps.ts'

	/** Чип внутри текста инструкции, похожий на кнопку интерфейса Happ или Incy. */
	let { key, spotlight }: { key: 'power' | 'plus' | 'paste' | 'refresh'; spotlight?: SpotlightTarget } = $props()

	const attrs = $derived(spotlight ? { [SPOTLIGHT_ATTR]: spotlight } : {})
</script>

<span
	class={[
		'inline-key',
		key === 'paste' ? 'inline-key--label' : 'inline-key--icon',
		(key === 'power' || key === 'refresh') && 'inline-key--accent',
		key === 'power' && 'inline-key--round',
	]}
	{...attrs}
>
	{#if key === 'power'}
		<Power size={12} />
	{:else if key === 'refresh'}
		<RefreshCw size={12} />
	{:else if key === 'plus'}
		<Plus size={14} />
	{:else}
		<Copy size={14} />Вставить
	{/if}
</span>

<style>
	.inline-key {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
		justify-content: center;
		margin-inline: 0.25rem;
		border: 1px solid var(--border);
		border-radius: 0.25rem;
		color: var(--fg);
		vertical-align: middle;
		background: var(--surface);

		&--icon {
			width: 1.25rem;
			height: 1.25rem;
		}

		&--label {
			padding: 0.125rem 0.375rem;
			font-size: 0.75rem;
			font-weight: 500;
		}

		&--accent {
			border-color: rgb(16 185 129 / 40%);
			color: var(--accent);
			background: rgb(16 185 129 / 15%);
		}

		&--round {
			border-radius: 50%;
		}
	}
</style>
