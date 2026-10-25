<script lang="ts">
	/**
	 * Экран «Друзья»: реферальная ссылка с QR, счётчики и список приглашённых.
	 *
	 * Карточка ссылки устроена как на «Подключении»: тогглер доменов, строка с копированием
	 * по тапу и QR под кнопкой. Ссылка живёт в двух доменах: у части операторов основной
	 * не открывается, и другу надо дать ту, что откроется у него.
	 */
	import { QrCode, Share2 } from '@lucide/svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import Async from '#frontend/cabinet/components/async.svelte'
	import Avatar from '#frontend/cabinet/components/avatar.svelte'
	import AvatarBone from '#frontend/cabinet/components/bones/avatar-bone.svelte'
	import RowBone from '#frontend/cabinet/components/bones/row-bone.svelte'
	import TextBone from '#frontend/cabinet/components/bones/text-bone.svelte'
	import TileBone from '#frontend/cabinet/components/bones/tile-bone.svelte'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import CopyValue from '#frontend/cabinet/components/copy-value.svelte'
	import LinkSwitch, { type LinkKind } from '#frontend/cabinet/components/link-switch.svelte'
	import Qr from '#frontend/cabinet/components/qr.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import StatTile from '#frontend/cabinet/components/stat-tile.svelte'
	import { plural, shorten } from '#frontend/cabinet/lib/format.ts'
	import { openLink } from '#frontend/cabinet/lib/telegram.ts'
	import { referralsRes } from '#frontend/cabinet/state/cabinet.ts'

	const LINK_NOTE: Record<LinkKind, string> = {
		backup: 'Открывается и при ограничениях мобильного интернета. Подойдёт большинству — с неё же друг получит пробный доступ.',
		main: 'Прямая ссылка на сайт. У части операторов и при ограничениях мобильного интернета не открывается — давайте её, только если рекомендуемая не подошла.',
	}

	/** Текст к ссылке при пересылке другу. Цену сверять с FAQ сайта, если тарифы поменяются. */
	const SHARE_TEXT =
		'Безлимит, серверы в Европе, несколько способов подключения на случай блокировок. 3 дня бесплатно, дальше от 100 ₽ в месяц.'

	const { data, loading, error } = referralsRes

	// Зеркало по умолчанию: прямой сайт при ограничениях связи у друга не откроется.
	let kind = $state<LinkKind>('backup')
	let showQr = $state(false)

	void referralsRes.load()

	function share(url: string) {
		openLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(SHARE_TEXT)}`)
	}
</script>

<!--
	Скелетон экрана: карточка ссылки, три счётчика, список друзей с кругами аватаров.
	Переключатель доменов не рисуем: он есть не у всех, и пустая полоска обещала бы выбор,
	которого может не быть.
-->
{#snippet skeleton()}
	<div class="referrals">
		<Card>
			<span class="referrals__bone-gap"><TextBone width="7rem" /></span>
			<div class="referrals__bone-text">
				<Skeleton />
				<Skeleton width="75%" />
			</div>
			<!-- Строка со ссылкой — та же высота, что у кнопки: по ней и целятся пальцем. -->
			<Skeleton height="2.75rem" />
			<span class="referrals__bone-button"><Skeleton height="2.75rem" /></span>
			<span class="referrals__bone-button referrals__bone-button--tight"><Skeleton height="2.75rem" /></span>
		</Card>

		<div class="referrals__tiles">
			<TileBone label="4rem" value="2rem" hint="" />
			<TileBone label="3.5rem" value="2rem" hint="" />
			<TileBone label="4rem" value="2rem" hint="" />
		</div>

		<Card>
			<span class="referrals__bone-title"><TextBone width="8rem" /></span>
			{#each { length: 3 }, i (i)}
				<RowBone lines={['9rem']}>
					{#snippet leading()}<AvatarBone />{/snippet}
				</RowBone>
			{/each}
		</Card>
	</div>
{/snippet}

<Async data={$data} loading={$loading} error={$error} {skeleton} stack>
	{#snippet children(refs)}
		{@const link = kind === 'backup' && refs.linkBackup ? refs.linkBackup : refs.link}

		<Card>
			<SectionTitle gap="xs">Ваша ссылка</SectionTitle>
			<p class="referrals__text">
				Каждому, кто оплатит подписку по&nbsp;вашей ссылке, мы&nbsp;продлеваем вашу на&nbsp;{refs.rewardDays}
				{plural(refs.rewardDays, 'день', 'дня', 'дней')}.
			</p>

			<!-- Переключатель и сноска — только когда зеркало настроено: иначе это выбор
			     из одного варианта. Сноска стоит до ссылки: сначала человек понимает,
			     какую берёт. -->
			{#if refs.linkBackup}<LinkSwitch bind:kind notes={LINK_NOTE} />{/if}

			<CopyValue value={link} text={shorten(link)} mono />

			<div class="referrals__buttons">
				<Button wide onclick={() => share(refs.botLink ?? link)}>
					<Share2 size={16} />
					Поделиться в Telegram
				</Button>
				<!-- QR под кнопкой: переслать ссылку хотят чаще, чем показать код с экрана. -->
				<Button wide onclick={() => (showQr = !showQr)}>
					<QrCode size={16} />
					{showQr ? 'Скрыть QR' : 'Показать QR'}
				</Button>
			</div>

			{#if showQr}
				<div class="referrals__qr"><Qr value={link} alt="QR-код реферальной ссылки" /></div>
			{/if}
		</Card>

		<div class="referrals__tiles">
			<StatTile label="Переходов" value={refs.clicks} />
			<StatTile label="Пришли" value={refs.joined} />
			<StatTile label="Оплатили" value={refs.paid} />
		</div>

		{#if refs.invited.length > 0}
			<Card>
				<SectionTitle>Вы пригласили</SectionTitle>
				<ul class="referrals__friends">
					{#each refs.invited as friend (friend.tgId)}
						<li class="referrals__friend">
							<Avatar tgId={friend.tgId} label={friend.label} />
							<span class="referrals__friend-name">{friend.label}</span>
							<!-- Оплатившие отмечены словом, а не только цветом: это благодарность,
							     и она должна читаться. -->
							{#if friend.rewarded}<span class="referrals__paid">оплатил</span>{/if}
						</li>
					{/each}
				</ul>
			</Card>
		{/if}
	{/snippet}
</Async>

<style>
	.referrals {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__bone-gap {
			display: block;
			margin-bottom: 0.25rem;
		}

		&__bone-title {
			display: block;
			margin-bottom: 0.5rem;
		}

		&__bone-text {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			margin-bottom: 0.75rem;
		}

		&__bone-button {
			display: block;
			margin-top: 0.75rem;

			&--tight {
				margin-top: 0.5rem;
			}
		}

		&__text {
			margin-bottom: 0.75rem;
			font-size: 0.875rem;
			color: var(--muted);
		}

		&__buttons {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			margin-top: 0.75rem;
		}

		&__qr {
			margin-top: 0.75rem;
		}

		&__tiles {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.75rem;
		}

		&__friends {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		&__friend {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			padding-block: 0.5rem;

			& + & {
				border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
			}
		}

		&__friend-name {
			overflow: hidden;
			flex: 1;
			min-width: 0;
			font-size: 0.875rem;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__paid {
			flex-shrink: 0;
			font-size: 0.75rem;
			color: var(--brand);
		}
	}
</style>
