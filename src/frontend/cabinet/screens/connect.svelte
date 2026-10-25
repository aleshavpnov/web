<script lang="ts">
	/**
	 * Экран «Подключение»: ссылка-подписка + инструкция для выбранного приложения и платформы.
	 *
	 * Инструкция — общая с сайтом (`components/connect`): человек, дошедший до кабинета
	 * после сайта, видит ровно те же шаги, а править их приходится в одном месте.
	 */
	import { Download } from '@lucide/svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import Async from '#frontend/cabinet/components/async.svelte'
	import TextBone from '#frontend/cabinet/components/bones/text-bone.svelte'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import Spotlight from '#frontend/cabinet/components/spotlight.svelte'
	import { accessRes } from '#frontend/cabinet/state/cabinet.ts'
	import { navigate, screenParamAtom } from '#frontend/cabinet/state/screen.ts'
	import AddSubscriptionSteps from '#frontend/components/connect/add-subscription-steps.svelte'
	import {
		CLIENTS,
		detectPlatform,
		visibleApp,
		type ClientId,
		type SpotlightTarget,
	} from '#frontend/components/connect/apps.ts'
	import ClientLink from '#frontend/components/connect/client-link.svelte'
	import ClientToggle from '#frontend/components/connect/client-toggle.svelte'
	import InstallSteps from '#frontend/components/connect/install-steps.svelte'
	import PlatformDialog from '#frontend/components/connect/platform-dialog.svelte'

	import RefreshCard from './connect/refresh-card.svelte'
	import RouterCard from './connect/router-card.svelte'
	import SubscriptionLink from './connect/subscription-link.svelte'

	/**
	 * Что подсвечиваем, придя по диплинку из подсказки бота, и что при этом пишем. Ключ —
	 * второй сегмент хеша (`#/connect/refresh`), он же значение `data-spotlight` у цели.
	 */
	const SPOTLIGHT_NOTE: Record<SpotlightTarget, string> = {
		refresh: 'Нажмите эту кнопку в приложении — оно заберёт свежий профиль',
	}

	/**
	 * `routes` — цель из старых подсказок бота, пока маршруты ставились отдельной кнопкой.
	 * Сообщения с ней остались в чатах, а лечится то же самое теперь обновлением подписки.
	 */
	function spotlightFromParam(param: string | null): SpotlightTarget | null {
		return param === 'refresh' || param === 'routes' ? 'refresh' : null
	}

	const { data, loading, error } = accessRes

	let picked = $state<ClientId | null>(null)
	let platform = $state(detectPlatform())
	let platformOpen = $state(false)

	// Пока человек сам не переключил тогглер, показываем его приложение — API узнаёт
	// его по UA последних фетчей подписки. Нет — Happ.
	const client = $derived(picked ?? visibleApp($data?.app) ?? 'happ')
	const cfg = $derived(CLIENTS[client])

	// Пришли по кнопке из подсказки бота (см. services/notify.ts) — цель в хеше. Экран
	// пересоздаётся на каждый переход, поэтому параметр читаем один раз.
	const deepLink = spotlightFromParam(screenParamAtom())

	let spotlight = $state(deepLink)

	// Порядок карточек держится на самом диплинке, а не на подсветке: иначе карточка
	// уезжала бы вниз в тот момент, когда человек гасит подсказку.
	const focusRefresh = deepLink === 'refresh'

	void accessRes.load()
</script>

<!--
	Скелетон экрана: карточка ссылки и карточка инструкции. Шаги — четыре строки текста
	с местом под номер: инструкция всегда длиннее ссылки, и без неё карточка выглядела бы
	вдвое короче будущей.
-->
{#snippet skeleton()}
	<div class="connect">
		<Card>
			<span class="connect__bone-title"><TextBone width="9rem" /></span>
			<Skeleton height="2.75rem" />
			<span class="connect__bone-button"><Skeleton height="2.75rem" /></span>
		</Card>

		<Card>
			<div class="connect__head">
				<TextBone width="8rem" />
				<TextBone width="8rem" height="0.75rem" />
			</div>
			<Skeleton width="14rem" height="2.75rem" />
			<div class="connect__bone-text">
				<Skeleton />
				<Skeleton width="66%" />
			</div>
			<ul class="connect__bone-steps">
				{#each { length: 4 }, i (i)}
					<li class="connect__bone-step">
						<Skeleton width="3.5rem" height="1.25rem" />
						<span class="connect__bone-lines">
							<Skeleton />
							<Skeleton width="50%" />
						</span>
					</li>
				{/each}
			</ul>
		</Card>
	</div>
{/snippet}

<!-- 409 — подписки нет. Это состояние экрана, а не сбой: показываем, что делать дальше. -->
{#if $error && /подписки нет/i.test($error)}
	<Card>
		<div class="connect__empty-title">Ссылки пока нет</div>
		<p class="connect__text connect__text--gap">
			Она появится здесь сразу после оплаты или выдачи пробного периода.
		</p>
		<div class="connect__empty-button">
			<Button variant="brand" wide onclick={() => navigate('plans')}>Выбрать тариф</Button>
		</div>
	</Card>
{:else}
	<Async data={$data} loading={$loading} error={$error} {skeleton} stack>
		{#snippet children(access)}
			<!-- По диплинку карточка обновления идёт первой: за ней и пришли. -->
			{#if focusRefresh}<RefreshCard client={cfg} focus />{/if}

			<SubscriptionLink url={access.subscriptionUrl} backup={access.subscriptionUrlBackup} />

			<Card>
				<div class="connect__head">
					<SectionTitle gap="none">Как подключить</SectionTitle>
					<button type="button" class="link connect__platform" onclick={() => (platformOpen = true)}>
						другое устройство?
					</button>
				</div>

				<ClientToggle bind:value={() => client, (v) => (picked = v)} />

				<p class="connect__text connect__text--intro">
					Установите и&nbsp;настройте <ClientLink client={cfg} /> — приложение, через&nbsp;которое работает соединение.
				</p>
				<InstallSteps client={cfg} {platform} />

				<div class="connect__add">
					<p class="connect__text connect__text--add">Добавьте ссылку-подписку в&nbsp;{cfg.name}:</p>
					<AddSubscriptionSteps client={cfg} />
				</div>
			</Card>

			<!-- Без диплинка карточка стоит после установки: сначала подключиться, потом
			     обновляться. Дубля нет — сверху она появляется только в фокус-режиме. -->
			{#if !focusRefresh}<RefreshCard client={cfg} focus={false} />{/if}

			{#if access.canUseRouter}<RouterCard />{/if}

			<p class="connect__footnote"><Download size={14} />Ссылка одна на все ваши устройства</p>

			<PlatformDialog open={platformOpen} bind:value={platform} onclose={() => (platformOpen = false)} />

			<!-- Диалог выбора платформы перекрыл бы подсветку — гасим её, пока он открыт. -->
			<Spotlight
				target={platformOpen ? null : spotlight}
				note={spotlight ? SPOTLIGHT_NOTE[spotlight] : ''}
				ondone={() => (spotlight = null)}
			/>
		{/snippet}
	</Async>
{/if}

<style>
	.connect {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__bone-title {
			display: block;
			margin-bottom: 0.75rem;
		}

		&__bone-button {
			display: block;
			margin-top: 0.75rem;
		}

		&__bone-text {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			margin-block: 0.75rem;
		}

		&__bone-steps {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		&__bone-step {
			display: flex;
			gap: 0.75rem;
		}

		&__bone-lines {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.375rem;
			min-width: 0;
		}

		&__head {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 0.75rem;
		}

		&__platform {
			min-height: 2.75rem;
			padding-inline: 0.25rem;
			font-size: 0.875rem;
		}

		&__text {
			font-size: 0.875rem;
			color: var(--muted);

			&--gap {
				margin-top: 0.5rem;
			}

			&--intro {
				margin-block: 0.75rem;
			}

			&--add {
				margin-bottom: 0.75rem;
			}
		}

		&__add {
			margin-top: 1rem;
			padding-top: 1rem;
			border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
		}

		&__empty-title {
			font-size: 1.125rem;
			font-weight: 600;
		}

		&__empty-button {
			margin-top: 1rem;
		}

		&__footnote {
			display: flex;
			gap: 0.375rem;
			align-items: center;
			justify-content: center;
			font-size: 0.75rem;
			color: var(--muted);
		}
	}
</style>
