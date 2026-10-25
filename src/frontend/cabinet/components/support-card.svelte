<script lang="ts">
	import { LifeBuoy, MessageSquarePlus } from '@lucide/svelte'

	import { openSupportChat } from '#frontend/cabinet/lib/support.ts'

	import Button from './button.svelte'
	import Card from './card.svelte'
	import SectionTitle from './section-title.svelte'

	/**
	 * Вход в поддержку. `help` — общая «Нужна помощь?» на главной и в «Ещё», `devices` —
	 * просьба поднять лимит устройств на «Трафике».
	 *
	 * Тарифом лимит не всегда решается: у самого вместительного он тоже конечен, а поводы
	 * бывают разные. Поэтому кнопка ведёт не в витрину, а в чат: человек пишет сам,
	 * своими словами, и лимит поднимают руками из админки (см. lib/support.ts).
	 */
	let { kind = 'help' }: { kind?: 'help' | 'devices' } = $props()

	let busy = $state(false)

	async function open() {
		busy = true

		try {
			await openSupportChat()
		} finally {
			busy = false
		}
	}
</script>

<Card>
	{#if kind === 'help'}
		<SectionTitle gap="xs">Нужна помощь?</SectionTitle>
		<p class="support-card__text">Напишите нам в&nbsp;чат бота — ответим там же. Можно прикладывать скриншоты.</p>
		<Button wide disabled={busy} onclick={open}>
			<LifeBuoy size={16} />
			{busy ? 'Открываем чат…' : 'Написать в поддержку'}
		</Button>
	{:else}
		<SectionTitle gap="xs">Не хватает устройств?</SectionTitle>
		<p class="support-card__text">
			Напишите в&nbsp;поддержку и&nbsp;расскажите, зачем вам больше: сколько устройств нужно и&nbsp;чьи они.
			Разберёмся индивидуально — лимит можно поднять и&nbsp;без смены тарифа.
		</p>
		<Button wide disabled={busy} onclick={open}>
			<MessageSquarePlus size={16} />
			{busy ? 'Открываем чат…' : 'Попросить больше устройств'}
		</Button>
	{/if}
</Card>

<style>
	.support-card__text {
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		color: var(--muted);
	}
</style>
