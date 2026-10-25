<script lang="ts">
	/**
	 * Список устройств с переименованием и удалением.
	 *
	 * «Забыть» убирает устройство из списка и из счётчика, но доступ не отзывает: ключ у всех
	 * устройств общий, отдельного у них нет. Поэтому рядом стоит честная кнопка «Отключить
	 * все устройства» — она перевыпускает и ссылку-подписку, и ключ, и это единственный способ
	 * выгнать чужого.
	 */
	import { TriangleAlert } from '@lucide/svelte'

	import { ApiError, rotateAccess } from '#frontend/cabinet/api/client.ts'
	import type { Device, DeviceGateMode } from '#frontend/cabinet/api/schemas.ts'
	import { confirmAction, hapticError, hapticSuccess } from '#frontend/cabinet/lib/telegram.ts'
	import { navigate } from '#frontend/cabinet/state/screen.ts'
	import { toast } from '#frontend/lib/toast.ts'

	import Button from './button.svelte'
	import Card from './card.svelte'
	import DeviceRow from './device-row.svelte'
	import SectionTitle from './section-title.svelte'

	let {
		devices,
		gate,
		suspended,
		onchanged,
	}: {
		devices: Device[]
		/** Режим слотов устройств: в enforce «Забыть» освобождает слот по-настоящему. */
		gate: DeviceGateMode
		/** Доступ приостановлен за шеринг — перевыпуск ссылки не поможет, кнопку прячем. */
		suspended: boolean
		onchanged: () => void | Promise<void>
	} = $props()

	let rotating = $state(false)

	// Убранное устройство вернулось, значит мелкая подсказка не сработала.
	// Говорим прямо и выдвигаем перевыпуск вперёд.
	const intruder = $derived(devices.some((d) => d.returned))
	// Своё устройство сверху: его ищут первым, чтобы отличить от чужих.
	const sorted = $derived([...devices].sort((a, b) => Number(b.current) - Number(a.current)))

	async function rotate() {
		const ok = await confirmAction(
			'Выпустить новую ссылку и новый ключ? Все устройства, включая это, отключатся в течение нескольких минут. Свои подключите заново по новой ссылке.',
		)

		if (!ok) return

		rotating = true

		try {
			await rotateAccess()
			hapticSuccess()
			toast.success('Готово: старые ссылка и ключ отключены. Добавьте новую ссылку в приложение')
			await onchanged()
			// Новую ссылку человек берёт на экране подключения — ведём туда сразу.
			navigate('connect')
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось перевыпустить ссылку')
		} finally {
			rotating = false
		}
	}
</script>

<Card>
	<SectionTitle>Устройства</SectionTitle>
	{#if devices.length === 0}
		<p class="device-list__empty">За это окно подписку никто не&nbsp;забирал.</p>
	{:else}
		<ul class="device-list">
			{#each sorted as device (device.id)}
				<DeviceRow {device} {gate} {onchanged} />
			{/each}
		</ul>
	{/if}

	{#if !suspended}
		<div class="device-list__footer">
			{#if intruder}
				<div class="device-list__alert">
					<TriangleAlert class="device-list__alert-icon" size={16} />
					<span>
						Кто-то подключается по вашей ссылке. Выпустите новую — все устройства отключатся, а свои
						подключите заново.
					</span>
				</div>
			{:else}
				<p class="device-list__hint">
					{gate === 'enforce'
						? 'Удаление освобождает слот: устройство сможет обновить подписку, только если слот будет свободен. Чтобы отключить всех разом — выпустите новую ссылку.'
						: 'Удаление из списка не отключает устройство: ссылка-подписка общая. Чтобы отключить всех разом — выпустите новую.'}
				</p>
			{/if}
			<Button variant={intruder ? 'primary' : 'outline'} wide disabled={rotating} onclick={rotate}>
				{rotating ? 'Выпускаем…' : 'Отключить все устройства'}
			</Button>
		</div>
	{/if}
</Card>

<style>
	.device-list {
		margin: 0;
		padding: 0;
		list-style: none;

		/* Строки — отдельные компоненты, поэтому разделитель между ними ставит список. */
		:global(.device-row + .device-row) {
			border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
		}

		&__empty {
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__footer {
			margin-top: 1rem;
			padding-top: 1rem;
			border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
		}

		&__alert {
			display: flex;
			gap: 0.5rem;
			align-items: flex-start;
			margin-bottom: 0.75rem;
			padding: 0.75rem;
			border-radius: var(--radius);
			font-size: 0.875rem;
			color: var(--danger);
			background: color-mix(in srgb, var(--danger) 10%, transparent);

			:global(.device-list__alert-icon) {
				flex-shrink: 0;
				margin-top: 0.125rem;
			}
		}

		&__hint {
			margin-bottom: 0.75rem;
			font-size: 0.75rem;
			color: var(--muted);
		}
	}
</style>
