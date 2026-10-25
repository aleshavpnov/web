<script lang="ts">
	import { CalendarClock } from '@lucide/svelte'

	import { ApiError, cancelSbpSubscription } from '#frontend/cabinet/api/client.ts'
	import type { Sub } from '#frontend/cabinet/api/schemas.ts'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import Row from '#frontend/cabinet/components/row.svelte'
	import { daysLeft, formatDate, formatDevices, formatRemaining } from '#frontend/cabinet/lib/format.ts'
	import { confirmAction, hapticError, hapticSuccess } from '#frontend/cabinet/lib/telegram.ts'
	import { overviewRes } from '#frontend/cabinet/state/cabinet.ts'
	import { toast } from '#frontend/lib/toast.ts'

	let { sub }: { sub: Sub } = $props()

	/** Ниже скольких дней срок подписки подсвечивается предупреждением. */
	const SOON_DAYS = 5

	const STATUS_NOTE: Record<string, string> = {
		// Отменённая подписка работает до конца оплаченного срока — это не поломка,
		// но продлевать её никто не будет, и сказать об этом надо заранее.
		cancelled: 'Автопродление выключено — после этой даты доступ закончится',
		pending: 'Ждём подтверждения оплаты. Обычно это занимает пару минут',
		expired: 'Срок закончился — продлите подписку, чтобы вернуть доступ',
	}

	const soon = $derived(daysLeft(sub.expiresAt) <= SOON_DAYS)
	const note = $derived(STATUS_NOTE[sub.status])
	// Дата списания — у того, кто продлевает. null — продлевать некому, даты нет; поля нет
	// вовсе только у старого бота, тогда остаётся дата Tribute, как было раньше.
	const chargeAt = $derived(
		sub.autoRenew === undefined ? sub.tributeExpiresAt : (sub.autoRenew?.nextChargeAt ?? null),
	)

	let busy = $state(false)

	/**
	 * Отключение автопродления по СБП. Tribute так не отключить — у него своя страница
	 * управления, поэтому кнопка только у Platega.
	 */
	async function cancelSbp() {
		const ok = await confirmAction(
			'Отключить автопродление по СБП? Больше ничего не спишется, доступ продолжит работать до конца оплаченного срока.',
		)

		if (!ok) return

		busy = true

		try {
			await cancelSbpSubscription()
			hapticSuccess()
			toast.success('Автопродление отключено')
			await overviewRes.load()
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось отключить автопродление')
		} finally {
			busy = false
		}
	}
</script>

<Card>
	<div class="paid-card__head">
		<div>
			<div class="paid-card__caption">Ваш тариф</div>
			<div class="paid-card__plan">{sub.planEmoji ? `${sub.planEmoji} ` : ''}{sub.planName}</div>
		</div>
		{#if sub.deviceLimit !== null}
			<div class="paid-card__caption paid-card__caption--end">{formatDevices(sub.deviceLimit)}</div>
		{/if}
	</div>

	<div class={['paid-card__term', soon && 'paid-card__term--soon']}>
		<CalendarClock class="paid-card__term-icon" size={16} />
		<span>{formatRemaining(sub.expiresAt)} · до {formatDate(sub.expiresAt)}</span>
	</div>

	{#if note}<p class="paid-card__note">{note}</p>{/if}

	<!-- Автогашение за шеринг: подписка по сроку живая, а соединение не работает — и без
	     этой плашки человек пойдёт искать поломку в приложении. -->
	{#if sub.sharingSuspendedAt}
		<p class="paid-card__suspended">
			Доступ приостановлен: подписка была подключена с очень многих адресов одновременно. Напишите
			в&nbsp;поддержку — разберёмся и вернём.
		</p>
	{/if}

	<!-- Списание показываем только когда оно расходится с концом доступа: совпало —
	     вторая дата ничего не добавляет, а вопросов вызывает много. -->
	{#if chargeAt && formatDate(chargeAt) !== formatDate(sub.expiresAt)}
		<Row label="Следующее списание">{formatDate(chargeAt)}</Row>
	{/if}

	{#if sub.autoRenew?.provider === 'platega'}<p class="paid-card__note">Автопродление по СБП</p>{/if}

	{#if sub.autoRenew?.cancelable}
		<div class="paid-card__cancel">
			<Button wide disabled={busy} onclick={cancelSbp}>{busy ? 'Отключаем…' : 'Отключить автопродление'}</Button>
		</div>
	{/if}
</Card>

<style>
	.paid-card {
		&__head {
			display: flex;
			gap: 0.75rem;
			align-items: flex-start;
			justify-content: space-between;
		}

		&__caption {
			font-size: 0.75rem;
			color: var(--muted);

			&--end {
				text-align: right;
			}
		}

		&__plan {
			margin-top: 0.125rem;
			font-size: 1.25rem;
			font-weight: 600;
		}

		&__term {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			margin-top: 0.75rem;
			font-size: 0.875rem;

			&--soon {
				color: var(--viz-warning);
			}

			:global(.paid-card__term-icon) {
				flex-shrink: 0;
			}
		}

		&__note {
			margin-top: 0.5rem;
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__suspended {
			margin-top: 0.75rem;
			padding: 0.5rem 0.75rem;
			border-radius: var(--radius);
			font-size: 0.875rem;
			color: var(--viz-critical);
			background: color-mix(in srgb, var(--viz-critical) 10%, transparent);
		}

		&__cancel {
			margin-top: 1rem;
		}
	}
</style>
