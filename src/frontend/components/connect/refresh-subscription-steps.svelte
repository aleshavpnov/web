<script lang="ts">
	import type { ClientConfig } from './apps.ts'
	import InlineKey from './inline-key.svelte'
	import StepList from './step-list.svelte'

	/**
	 * Шаги обновления уже добавленной подписки. Сюда приходят по подсказке «профиль устарел»,
	 * где приложение давно стоит и ссылка добавлена, не хватает только свежих правил.
	 *
	 * Переподключение — обязательный второй шаг, а не вежливость: свежий профиль клиент
	 * забирает при обновлении, но поднятый туннель крутит старые правила, пока его не
	 * перезапустить. Так и вышло 28.08.2026: фетч ежечасный, а RU-домены шли мимо direct.
	 */
	let { client }: { client: ClientConfig } = $props()

	// У своего клиента кнопки обновления нет: свежий профиль он забирает при каждом включении.
	const items = $derived(client.id === 'aleshavpnov' ? [ownRestart] : [refresh, restart])
</script>

{#snippet ownRestart()}
	Выключите и&nbsp;снова включите VPN кнопкой <InlineKey key="power" /> — приложение заберёт свежий профиль
{/snippet}

{#snippet refresh()}
	Откройте {client.name} и&nbsp;нажмите у&nbsp;подписки <InlineKey key="refresh" spotlight="refresh" /> — приложение заберёт
	свежий профиль
{/snippet}

{#snippet restart()}
	Выключите и&nbsp;снова включите подключение <InlineKey key="power" /> — пока туннель поднят, работают старые правила
{/snippet}

<StepList {items} />
