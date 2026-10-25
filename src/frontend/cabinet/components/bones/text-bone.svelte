<script lang="ts">
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	/**
	 * Полоска на месте строки текста. Правило, которое держит высоту: полоска живёт
	 * в контейнере ростом со строку. Одна полоска в 12px вместо строки в 20px схлопнула бы
	 * блок на 8px — и вся карточка поехала бы вверх.
	 *
	 * `line` — рост строки: `xs` под `text-xs`, `sm` под `text-sm`, `xl` под `text-xl`.
	 */
	let {
		line = 'sm',
		width = '8rem',
		height = '0.875rem',
	}: { line?: 'xs' | 'sm' | 'base' | 'xl' | '2xl'; width?: string; height?: string } = $props()
</script>

<span class={['text-bone', `text-bone--${line}`]}><Skeleton {width} {height} /></span>

<style>
	.text-bone {
		display: flex;
		align-items: center;

		&--xs {
			height: 1rem;
		}

		&--sm {
			height: 1.25rem;
		}

		&--base {
			height: 1.5rem;
		}

		&--xl {
			height: 1.75rem;
		}

		&--2xl {
			height: 2rem;
		}
	}
</style>
