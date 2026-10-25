<script lang="ts">
	/**
	 * Экран «Ещё»: настройки уведомлений, «что нового» и вход в поддержку.
	 *
	 * Переписка остаётся в чате бота: там уже работают топики группы поддержки, вложения и
	 * уведомления. Кабинет только включает режим и уводит в чат.
	 */
	import { ChevronDown, Shield } from '@lucide/svelte'

	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'

	import { setSetting } from '#frontend/cabinet/api/client.ts'
	import type { SettingKey } from '#frontend/cabinet/api/schemas.ts'
	import Async from '#frontend/cabinet/components/async.svelte'
	import RowBone from '#frontend/cabinet/components/bones/row-bone.svelte'
	import TextBone from '#frontend/cabinet/components/bones/text-bone.svelte'
	import Button from '#frontend/cabinet/components/button.svelte'
	import Card from '#frontend/cabinet/components/card.svelte'
	import SectionTitle from '#frontend/cabinet/components/section-title.svelte'
	import SupportCard from '#frontend/cabinet/components/support-card.svelte'
	import Switch from '#frontend/cabinet/components/switch.svelte'
	import { formatDate } from '#frontend/cabinet/lib/format.ts'
	import { hapticError, openLink } from '#frontend/cabinet/lib/telegram.ts'
	import { overviewRes, settingsRes, whatsnewRes } from '#frontend/cabinet/state/cabinet.ts'
	import { toast } from '#frontend/lib/toast.ts'

	const TOGGLES: Array<{ key: SettingKey; label: string; hint: string }> = [
		{ key: 'notify', label: 'Уведомления о подписке', hint: 'Напоминания об окончании срока и оплате' },
		{ key: 'news', label: 'Анонсы обновлений', hint: 'Что нового в сервисе' },
		{ key: 'broadcast', label: 'Рассылки', hint: 'Редкие письма от команды' },
	]

	const overview = overviewRes.data
	const settings = settingsRes
	const whatsnew = whatsnewRes

	const settingsData = settings.data
	const settingsLoading = settings.loading
	const settingsError = settings.error
	const whatsnewData = whatsnew.data
	const whatsnewLoading = whatsnew.loading
	const whatsnewError = whatsnew.error

	let busy = $state<SettingKey | null>(null)
	let open = $state(false)

	void settingsRes.load()
	void whatsnewRes.load()

	// Кабинет могли открыть сразу на этой вкладке (перезагрузка вебвью помнит хеш) —
	// тогда overview ещё не загружался, а от него зависят и поддержка, и админка.
	if (overviewRes.data() === null) void overviewRes.load()

	async function toggle(key: SettingKey, next: boolean) {
		busy = key

		try {
			settingsRes.data.set(await setSetting(key, next))
		} catch (e) {
			hapticError()
			toast.error(e instanceof Error ? e.message : 'Не удалось сохранить')
		} finally {
			busy = null
		}
	}
</script>

<!-- Тумблеров ровно столько, сколько в `TOGGLES`: их набор известен без запроса. -->
{#snippet settingsSkeleton()}
	<Card>
		<span class="more__bone-title"><TextBone width="8rem" /></span>
		{#each TOGGLES as t (t.key)}
			<RowBone pad="md" lines={['11rem', '14rem']}>
				{#snippet tail()}<Skeleton width="3rem" height="1.75rem" round />{/snippet}
			</RowBone>
		{/each}
	</Card>
{/snippet}

{#snippet whatsnewSkeleton()}
	<Card>
		<span class="more__bone-title"><TextBone width="7rem" /></span>
		<div class="more__version-head">
			<Skeleton width="3.5rem" />
			<Skeleton width="5rem" height="0.75rem" />
		</div>
		<div class="more__bone-text">
			<Skeleton />
			<Skeleton />
			<Skeleton width="66%" />
		</div>
	</Card>
{/snippet}

<div class="more">
	<Async data={$settingsData} loading={$settingsLoading} error={$settingsError} skeleton={settingsSkeleton}>
		{#snippet children(values)}
			<Card>
				<SectionTitle>Уведомления</SectionTitle>
				<ul class="more__toggles">
					{#each TOGGLES as { key, label, hint } (key)}
						<li class="more__toggle">
							<label class="more__toggle-label" for={`toggle-${key}`}>
								<span class="more__toggle-title">{label}</span>
								<span class="more__toggle-hint">{hint}</span>
							</label>
							<!-- Тумблер, а не кнопка с подписью: состояние читается по положению, и тап
							     по нему не выглядит как «отправить». -->
							<Switch
								id={`toggle-${key}`}
								{label}
								checked={values[key]}
								disabled={busy === key}
								onchange={(next) => void toggle(key, next)}
							/>
						</li>
					{/each}
				</ul>
			</Card>
		{/snippet}
	</Async>

	{#if $overview?.support.available}<SupportCard />{/if}

	<!-- Вход в веб-админку — только тем, кому её отдаёт API (`adminMiniAppUrl`). Открываем через
	     `openTelegramLink`: админка живёт как Mini App и без Telegram-обёртки не авторизуется. -->
	{#if $overview?.adminMiniAppUrl}
		{@const adminUrl = $overview.adminMiniAppUrl}
		<Card>
			<SectionTitle>Администрирование</SectionTitle>
			<Button wide onclick={() => openLink(adminUrl)}>
				<Shield size={16} />
				Веб-админка
			</Button>
		</Card>
	{/if}

	<Async data={$whatsnewData} loading={$whatsnewLoading} error={$whatsnewError} skeleton={whatsnewSkeleton}>
		{#snippet children(news)}
			{#if news.items.length === 0}
				<Card><SectionTitle gap="none">Пока без новостей</SectionTitle></Card>
			{:else}
				<Card>
					<SectionTitle>Что нового</SectionTitle>
					<!-- Раскрываем только последнюю версию: остальные — история, за ней лезут редко. -->
					{#each news.items.slice(0, open ? undefined : 1) as item (item.version)}
						<article class="more__version">
							<div class="more__version-head">
								<span class="more__version-name">v{item.version}</span>
								<span class="more__version-date">{formatDate(item.date)}</span>
							</div>
							<p class="more__version-body">{item.body}</p>
						</article>
					{/each}
					{#if news.items.length > 1}
						<button type="button" class="more__history" onclick={() => (open = !open)}>
							{open ? 'Свернуть' : 'Показать прошлые версии'}
							<ChevronDown
								class={open ? 'more__chevron more__chevron--open' : 'more__chevron'}
								size={16}
							/>
						</button>
					{/if}
				</Card>
			{/if}
		{/snippet}
	</Async>
</div>

<style>
	.more {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__bone-title {
			display: block;
			margin-bottom: 0.5rem;
		}

		&__bone-text {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			margin-top: 0.25rem;
		}

		&__toggles {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		&__toggle {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			justify-content: space-between;
			padding-block: 0.75rem;

			& + & {
				border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
			}
		}

		&__toggle-label {
			cursor: pointer;
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		&__toggle-title {
			font-size: 0.875rem;
		}

		&__toggle-hint {
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__version {
			padding-block: 0.75rem;
			border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);

			&:first-of-type {
				padding-top: 0;
				border: 0;
			}
		}

		&__version-head {
			display: flex;
			gap: 0.5rem;
			align-items: baseline;
			justify-content: space-between;
		}

		&__version-name {
			font-size: 0.875rem;
			font-weight: 600;
		}

		&__version-date {
			font-size: 0.75rem;
			color: var(--muted);
		}

		&__version-body {
			margin-top: 0.25rem;
			font-size: 0.875rem;
			color: var(--muted);
			white-space: pre-line;
		}

		&__history {
			cursor: pointer;
			display: flex;
			gap: 0.25rem;
			align-items: center;
			justify-content: center;
			width: 100%;
			min-height: 2.75rem;
			padding: 0.5rem 0 0;
			border: 0;
			font: inherit;
			font-size: 0.875rem;
			color: var(--brand);
			background: none;

			:global(.more__chevron) {
				transition: rotate 0.2s;
			}

			:global(.more__chevron--open) {
				rotate: 180deg;
			}
		}
	}
</style>
