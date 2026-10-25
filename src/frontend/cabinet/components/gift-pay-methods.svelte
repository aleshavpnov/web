<script lang="ts">
	/**
	 * Способы оплаты подарка. Без шага «подписка или разово»: подарок всегда разовый, выбирать
	 * остаётся только чем платить — Platega или товар Tribute.
	 */
	import type { OneTimeMethod } from '#frontend/cabinet/api/schemas.ts'
	import { feeNote } from '#frontend/cabinet/lib/format.ts'
	import { GIFT_ICON, payMethodIcon } from '#frontend/cabinet/lib/pay-icons.ts'

	import PayOption from './pay-option.svelte'

	let {
		tributeUrl,
		tributeFee,
		oneTimeMethods,
		busy,
		onpay,
	}: {
		/** Подарочный товар Tribute; null — его нет, только разовая оплата. */
		tributeUrl: string | null
		tributeFee: string | undefined
		oneTimeMethods: OneTimeMethod[]
		busy: boolean
		/** Без аргумента — товар Tribute, иначе выбранный способ Platega. */
		onpay: (choice?: number) => void
	} = $props()
</script>

{#each oneTimeMethods as m, i (m.code)}
	<PayOption
		label={m.label}
		fee={feeNote(m.feePercent)}
		icon={payMethodIcon(m.code)}
		primary={i === 0}
		disabled={busy}
		onclick={() => onpay(m.code)}
	/>
{/each}
{#if tributeUrl}
	<PayOption
		label={oneTimeMethods.length > 0 ? 'Tribute' : 'Оплатить подарок'}
		fee={tributeFee}
		icon={GIFT_ICON}
		primary={oneTimeMethods.length === 0}
		disabled={busy}
		onclick={() => onpay()}
	/>
{/if}
