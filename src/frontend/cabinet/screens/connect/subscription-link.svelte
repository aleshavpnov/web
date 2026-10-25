<script lang="ts">
	import { QrCode } from '@lucide/svelte'

	import { issueDeviceClaim } from '#frontend/cabinet/api/client.ts'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import CopyValue from '#frontend/cabinet/components/copy-value.svelte'
	import LinkSwitch, { type LinkKind } from '#frontend/cabinet/components/link-switch.svelte'
	import Qr from '#frontend/cabinet/components/qr.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import { readClaim, saveClaim, withClaim } from '#frontend/cabinet/lib/device-claim.ts'
	import { shorten } from '#frontend/cabinet/lib/format.ts'

	/** Ссылка-подписка: копирование одним тапом + QR для соседнего устройства. */
	let { url, backup }: { url: string; backup: string | null } = $props()

	const LINK_NOTE: Record<LinkKind, string> = {
		backup: 'Обновляется и при ограничениях мобильного интернета. Подойдёт большинству — начинайте с неё.',
		main: 'Тот же доступ напрямую, без промежуточного узла. При ограничениях у оператора перестаёт обновляться — берите её, только если рекомендуемая не открывается.',
	}

	// Зеркало по умолчанию: при ограничениях связи прямая не обновляется, а люди берут
	// то, что выбрано сразу, и потом пишут, что ничего не работает.
	let kind = $state<LinkKind>('backup')
	let showQr = $state(false)
	let claim = $state(readClaim())

	const link = $derived(kind === 'backup' && backup ? backup : url)
	// Токен метки «это устройство» едет только в копируемой ссылке: её вставляют в приложение
	// на этом же телефоне. QR сканируют с другого устройства, и метка ушла бы туда.
	const copyLink = $derived(withClaim(link, claim))

	issueDeviceClaim(readClaim())
		.then(({ token }) => {
			saveClaim(token)
			claim = token
		})
		.catch(() => {
			// Без метки ссылка работает как раньше.
		})
</script>

<Card>
	<SectionTitle gap="lg">Ссылка-подписка</SectionTitle>

	<!-- Переключатель доменов появляется только когда зеркало настроено:
	     иначе это выбор из одного варианта. -->
	{#if backup}<LinkSwitch bind:kind notes={LINK_NOTE} />{/if}

	<CopyValue value={copyLink} text={shorten(link)} mono />

	<div class="subscription-link__qr-button">
		<Button wide onclick={() => (showQr = !showQr)}>
			<QrCode size={16} />
			{showQr ? 'Скрыть QR' : 'Показать QR'}
		</Button>
	</div>

	{#if showQr}
		<div class="subscription-link__qr">
			<Qr value={link} alt="QR-код ссылки-подписки" />
			<p class="subscription-link__qr-note">
				Отсканируйте с&nbsp;другого устройства — приложение добавит подписку само.
			</p>
		</div>
	{/if}
</Card>

<style>
	.subscription-link {
		&__qr-button {
			margin-top: 0.75rem;
		}

		&__qr {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			align-items: center;
			margin-top: 0.75rem;
		}

		&__qr-note {
			font-size: 0.75rem;
			color: var(--muted);
			text-align: center;
		}
	}
</style>
