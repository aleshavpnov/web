<script lang="ts">
	import type { ClientConfig } from './apps.ts'
	import DownloadButton from './download-button.svelte'
	import InlineKey from './inline-key.svelte'
	import StepList from './step-list.svelte'

	/**
	 * Шаги добавления ссылки-подписки в приложение. У Incy кнопка «Вставить» добавляет подписку
	 * из буфера за один тап, поэтому отдельного шага «Добавить из буфера» (как у Happ) для него нет.
	 *
	 * Своему клиенту из кабинета (`openInAppHref` задан) подписка уходит диплинком в одно
	 * нажатие, а на сайте ссылки ещё нет — остаётся путь через буфер.
	 */
	let {
		client,
		openInAppHref,
		onOpenInApp,
	}: {
		client: ClientConfig
		/** Диплинк своего клиента с подпиской внутри; без него — шаги через буфер. */
		openInAppHref?: string
		/** Как открыть диплинк: в кабинете — `openLink` из Telegram SDK, а не обычный переход. */
		onOpenInApp?: () => void
	} = $props()

	const items = $derived.by(() => {
		if (client.id === 'aleshavpnov') return openInAppHref ? [ownOpen, ownPower] : [ownCopy, ownPaste, ownPower]

		return client.id === 'incy' ? [incyPaste, connect] : [happPlus, fromClipboard, connect]
	})
</script>

{#snippet ownOpen()}
	Нажмите кнопку — приложение откроется и&nbsp;добавит подписку само
	<DownloadButton kind="open" href={openInAppHref ?? ''} onopen={onOpenInApp} />
{/snippet}

{#snippet ownPower()}
	Нажмите {openInAppHref ? 'большую кнопку ' : ''}«Включить» <InlineKey key="power" />
{/snippet}

{#snippet ownCopy()}
	Скопируйте ссылку-подписку
{/snippet}

{#snippet ownPaste()}
	Откройте {client.name}, нажмите «Добавить подписку» и&nbsp;вставьте ссылку
{/snippet}

{#snippet incyPaste()}
	Скопируйте ссылку-подписку и&nbsp;добавьте её в&nbsp;{client.name}: справа снизу нажмите
	<InlineKey key="paste" />
{/snippet}

{#snippet happPlus()}
	Скопируйте ссылку-подписку и&nbsp;добавьте её в&nbsp;{client.name}: справа сверху нажмите
	<InlineKey key="plus" />
{/snippet}

{#snippet fromClipboard()}
	Выберите «Добавить из&nbsp;буфера»
{/snippet}

{#snippet connect()}
	Нажмите кнопку подключения <InlineKey key="power" />
{/snippet}

<StepList {items} />
