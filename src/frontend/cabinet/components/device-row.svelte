<script lang="ts">
	import { Check, Pencil, Smartphone, Trash2, X } from '@lucide/svelte'

	import { ApiError, forgetDevice, renameDevice } from '#frontend/cabinet/api/client.ts'
	import type { Device, DeviceGateMode } from '#frontend/cabinet/api/schemas.ts'
	import { formatAgo } from '#frontend/cabinet/lib/format.ts'
	import { confirmAction, hapticError, hapticSuccess } from '#frontend/cabinet/lib/telegram.ts'
	import { toast } from '#frontend/lib/toast.ts'

	import Button from './button.svelte'

	let { device, gate, onchanged }: { device: Device; gate: DeviceGateMode; onchanged: () => void | Promise<void> } =
		$props()

	let editing = $state(false)
	let draft = $state('')
	let busy = $state(false)
	let input = $state<HTMLInputElement>()

	/** Как подписать устройство: имя клиента → модель → честное «неизвестное». */
	const title = $derived(device.name ?? device.model ?? 'Неизвестное устройство')
	// Когда имя своё, модель уходит в подпись — иначе непонятно, что это за железка.
	const meta = $derived(
		[device.name ? device.model : null, device.os, formatAgo(device.lastSeen)].filter(Boolean).join(' · '),
	)

	$effect(() => {
		if (editing) input?.focus()
	})

	async function save() {
		busy = true

		try {
			await renameDevice(device.id, draft)
			hapticSuccess()
			editing = false
			await onchanged()
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось сохранить имя')
		} finally {
			busy = false
		}
	}

	async function forget() {
		// Спрашиваем: строка исчезает, и человек должен понимать, что именно произойдёт —
		// пока гейт не в enforce, доступ цел; в enforce освобождается слот.
		const ok = await confirmAction(
			gate === 'enforce'
				? `Убрать «${title}» и освободить слот? Устройство сможет обновить подписку, только если слот останется свободным.`
				: `Убрать «${title}» из списка? Доступ не отключится — устройство вернётся, если снова подключится.`,
		)

		if (!ok) return

		busy = true

		try {
			await forgetDevice(device.id)
			hapticSuccess()
			await onchanged()
		} catch (e) {
			hapticError()
			toast.error(e instanceof ApiError ? e.message : 'Не удалось убрать устройство')
		} finally {
			busy = false
		}
	}
</script>

{#if editing}
	<li class="device-row">
		<input
			bind:this={input}
			bind:value={draft}
			class="device-row__input"
			maxlength={40}
			placeholder={device.model ?? 'Название устройства'}
			onkeydown={(e) => {
				if (e.key === 'Enter') void save()

				if (e.key === 'Escape') editing = false
			}}
		/>
		<Button variant="ghost" size="icon" disabled={busy} aria-label="Сохранить" onclick={save}>
			<span class="device-row__ok"><Check size={16} /></span>
		</Button>
		<Button variant="ghost" size="icon" aria-label="Отмена" onclick={() => (editing = false)}>
			<X size={16} />
		</Button>
	</li>
{:else}
	<li class={['device-row', busy && 'device-row--busy']}>
		<Smartphone class="device-row__icon" size={16} />
		<div class="device-row__body">
			<div class="device-row__head">
				<span class="device-row__title">{title}</span>
				{#if device.current}<span class="device-row__current">Это устройство</span>{/if}
			</div>
			<div class="device-row__meta">{meta}</div>
			{#if device.returned}
				<div class="device-row__returned">
					Удаляли, но оно подключилось снова — ссылкой пользуется кто-то ещё
				</div>
			{/if}
		</div>
		<Button
			variant="ghost"
			size="icon"
			disabled={busy}
			aria-label="Переименовать"
			onclick={() => {
				draft = device.name ?? ''
				editing = true
			}}
		>
			<span class="device-row__action"><Pencil size={16} /></span>
		</Button>
		<Button variant="ghost" size="icon" disabled={busy} aria-label="Убрать из списка" onclick={forget}>
			<span class="device-row__action"><Trash2 size={16} /></span>
		</Button>
	</li>
{/if}

<style>
	.device-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding-block: 0.5rem;

		&--busy {
			opacity: 0.6;
		}

		:global(.device-row__icon) {
			flex-shrink: 0;
			color: var(--muted);
		}

		&__input {
			flex: 1;
			min-width: 0;
			min-height: 2.75rem;
			padding-inline: 0.75rem;
			border: 0;
			border-radius: var(--radius);
			font: inherit;
			font-size: 0.875rem;
			color: inherit;
			background: var(--surface);
			outline: none;

			&:focus {
				box-shadow: 0 0 0 2px var(--brand);
			}
		}

		&__ok {
			display: flex;
			color: var(--brand);
		}

		&__action {
			display: flex;
			color: var(--muted);
		}

		&__body {
			flex: 1;
			min-width: 0;
		}

		&__head {
			display: flex;
			gap: 0.5rem;
			align-items: center;
		}

		&__title {
			overflow: hidden;
			font-size: 0.875rem;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__current {
			flex-shrink: 0;
			padding: 0.125rem 0.5rem;
			border-radius: 999px;
			font-size: 0.75rem;
			color: var(--brand);
			background: color-mix(in srgb, var(--brand) 10%, transparent);
		}

		&__meta {
			overflow: hidden;
			font-size: 0.75rem;
			color: var(--muted);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__returned {
			font-size: 0.75rem;
			color: var(--viz-warning);
		}
	}
</style>
