<script lang="ts">
	import type { ClientConfig, Platform } from './apps.ts'
	import DownloadButton from './download-button.svelte'
	import StepList from './step-list.svelte'

	/**
	 * Шаги установки приложения. Маршруты отдельным шагом не ставятся: правила для РФ
	 * приходят вместе с подпиской.
	 */
	let { client, platform }: { client: ClientConfig; platform: Platform } = $props()

	const method = $derived(client.install[platform])
</script>

{#snippet install()}
	{#if method.kind === 'stores'}
		Установите приложение <DownloadButton kind="stores" stores={method.stores} device={method.device} />
	{:else if method.kind === 'direct'}
		Установите приложение <DownloadButton kind="direct" href={method.href} device={method.device} />
	{:else}
		{client.name} пока недоступен для&nbsp;этой платформы.
		<a class="link" href={client.site} target="_blank" rel="noopener noreferrer">Открыть сайт</a>
	{/if}
{/snippet}

<StepList items={[install]} />
