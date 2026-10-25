<script lang="ts">
	import type { ClientConfig } from './apps.ts'

	/** Название клиента ссылкой на его сайт, с фирменной иконкой. */
	let { client }: { client: ClientConfig } = $props()
</script>

<a class="client-link" href={client.site} target="_blank" rel="noopener noreferrer">
	<client.Icon class="client-link__icon" size="0.95em" />{client.name}
</a>

<style>
	.client-link {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
		font-weight: 600;
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 2px;

		&:hover {
			color: var(--accent-hover);
		}

		:global(.client-link__icon) {
			flex-shrink: 0;
			width: auto;
		}
	}
</style>
