<script lang="ts" module>
	export type LinkKind = 'main' | 'backup'
</script>

<script lang="ts">
	import { Info } from '@lucide/svelte'

	import Segmented from './segmented.svelte'

	/**
	 * Выбор домена ссылки: рекомендуемое зеркало или прямой адрес, и сноска, зачем нужна
	 * выбранная. Подпись стоит у обеих, а не только у прямой: иначе выбор выглядит как
	 * «рекомендуемая и какая-то ещё», и человек не понимает, когда брать вторую.
	 */
	let { kind = $bindable(), notes }: { kind: LinkKind; notes: Record<LinkKind, string> } = $props()

	const OPTIONS = [
		{ value: 'backup', label: 'Рекомендуемая' },
		{ value: 'main', label: 'Прямая' },
	] as const
</script>

<div class="link-switch">
	<Segmented bind:value={kind} options={OPTIONS} />
	<p class="link-switch__note">
		<Info class="link-switch__icon" size={16} />
		<span>{notes[kind]}</span>
	</p>
</div>

<style>
	.link-switch {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.75rem;

		&__note {
			display: flex;
			gap: 0.5rem;
			align-items: flex-start;
			padding: 0.625rem 0.75rem;
			border-radius: var(--radius);
			font-size: 0.875rem;
			background: var(--surface);
		}

		:global(.link-switch__icon) {
			flex-shrink: 0;
			margin-top: 0.125rem;
			color: var(--brand);
		}
	}
</style>
