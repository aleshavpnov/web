<script lang="ts">
	import { ChevronDown, CircleHelp } from '@lucide/svelte'
	import type { Snippet } from 'svelte'

	import BackLink from '#frontend/components/back-link.svelte'
	import Cta from '#frontend/components/cta.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import { LEGAL_EMAIL as SUPPORT_EMAIL } from '#frontend/site/legal.ts'
	import { status } from '#frontend/site/state/status.ts'

	/** Диплинк на подписку «Прайм» в Tribute (кнопка Share у подписки в дашборде). */
	const TRIBUTE_SUB_URL = 'https://t.me/tribute/app?startapp=sVea'

	const ITEMS: { id: string; q: string; a: Snippet }[] = [
		{ id: 'what-is', q: 'Что такое Alesha Vepenov?', a: whatIs },
		{ id: 'devices', q: 'Какие устройства и приложения поддерживаются?', a: devices },
		{ id: 'limits', q: 'Есть ли лимиты трафика или количества устройств?', a: limits },
		{ id: 'trial', q: 'Можно ли попробовать бесплатно?', a: trial },
		{ id: 'pricing', q: 'Сколько стоит и как оплатить?', a: pricing },
		{ id: 'gift', q: 'Можно ли подарить подписку?', a: gift },
		{ id: 'cancel', q: 'Как отменить подписку или отключить автопродление?', a: cancel },
		{ id: 'referral', q: 'Есть ли реферальная программа?', a: referral },
		{ id: 'speed', q: 'Замедлится ли соединение?', a: speed },
		{ id: 'troubleshoot', q: 'Не подключается — что делать?', a: troubleshoot },
	]
</script>

{#snippet tribute()}
	<a class="link" href={TRIBUTE_SUB_URL} target="_blank" rel="noopener noreferrer">Tribute</a>
{/snippet}

{#snippet whatIs()}
	Частный сервис для своих — закрытая сеть, а&nbsp;не&nbsp;массовый публичный сервис. Серверы в&nbsp;Европе,
	а&nbsp;в&nbsp;подписке — несколько профилей с&nbsp;разными способами подключения: если один перестал работать,
	достаточно переключиться на&nbsp;соседний. Доступ оформляется через Telegram-бот, а&nbsp;здесь на&nbsp;сайте можно <a
		class="link"
		href="/get">получить пробный доступ</a
	>
	и&nbsp;следить за
	<a class="link" href="/status">состоянием серверов</a>.
{/snippet}

{#snippet devices()}
	iOS, Android, Windows и&nbsp;macOS. Рекомендуем бесплатные приложения Happ или Incy (Incy недоступен
	на&nbsp;Windows) — сайт и&nbsp;бот дают ссылки под нужную платформу. Подписка также работает в&nbsp;других
	совместимых клиентах вроде v2rayNG, Hiddify и&nbsp;NekoBox — достаточно импортировать её по&nbsp;ссылке или QR-коду.
{/snippet}

{#snippet limits()}
	Трафик безлимитный и&nbsp;скорость не&nbsp;режется ни&nbsp;на&nbsp;одном тарифе — отличается только число устройств:
	«Эконом»&nbsp;— одно, «Прайм»&nbsp;— до&nbsp;трёх, «Семья»&nbsp;— до&nbsp;десяти. Подписки, оформленные раньше,
	сохраняют прежние условия без&nbsp;ограничения по&nbsp;устройствам.
{/snippet}

{#snippet trial()}
	Да. В&nbsp;Telegram-боте выдаётся пробный период на&nbsp;3&nbsp;дня. Если сам Telegram не&nbsp;открывается, поможет
	страница <a class="link" href="/get">«Получить доступ»</a> — временный доступ на&nbsp;3&nbsp;часа и&nbsp;до&nbsp;5&nbsp;ГБ
	трафика, без регистрации и&nbsp;оплаты. Его как раз хватит, чтобы зайти в&nbsp;бот и&nbsp;получить пробный период или
	оформить подписку.
{/snippet}

{#snippet pricing()}
	Три тарифа, все помесячные: «Эконом»&nbsp;— 100&nbsp;₽ за&nbsp;одно устройство, «Прайм»&nbsp;— 149&nbsp;₽
	за&nbsp;три, «Семья»&nbsp;— 449&nbsp;₽ за&nbsp;десять. Серверы и&nbsp;скорость во&nbsp;всех одинаковые. Оплата
	проходит через сервис {@render tribute()} прямо в&nbsp;Telegram, доступ активируется автоматически в&nbsp;течение минуты
	после оплаты.
{/snippet}

{#snippet gift()}
	Да. В&nbsp;Telegram-боте есть кнопка «Подарить подписку»: выбираете тариф, оплачиваете через
	{@render tribute()} и&nbsp;получаете в&nbsp;чат ссылку-сертификат. Перешлите её&nbsp;тому, кому дарите&nbsp;— он&nbsp;откроет
	ссылку, и&nbsp;доступ включится сам. Заранее заводить бота получателю не&nbsp;нужно. Подарок&nbsp;— разовая оплата на&nbsp;месяц:
	карта не&nbsp;привязывается и&nbsp;больше ничего не&nbsp;списывается, а&nbsp;продлить подписку получатель сможет сам.
{/snippet}

{#snippet cancel()}
	В&nbsp;любой момент через {@render tribute()} — там&nbsp;же, где проходила оплата, доступны управление подпиской, смена
	карты и&nbsp;отмена. После отмены доступ сохраняется до&nbsp;конца оплаченного периода.
{/snippet}

{#snippet referral()}
	Да. За&nbsp;каждого друга, оформившего первую оплату по&nbsp;персональной ссылке, начисляются дополнительные дни
	подписки. Ссылка — в&nbsp;Telegram-боте.
{/snippet}

{#snippet speed()}
	Серверы стоят на&nbsp;быстрых европейских каналах, а&nbsp;приложение автоматически подключается к&nbsp;самому
	быстрому из&nbsp;доступных и&nbsp;переключается на&nbsp;резервный при сбоях. В&nbsp;повседневных сценариях разница
	незаметна.
{/snippet}

{#snippet troubleshoot()}
	Сначала стоит проверить <a class="link" href="/status">страницу статуса</a> — возможно, идут работы. Затем обновить
	подписку в&nbsp;приложении и&nbsp;убедиться, что включены «маршруты» (нужны для работы из&nbsp;России). Если
	не&nbsp;помогло — написать
	{#if $status?.botUsername}
		<a
			class="link"
			href={`https://t.me/${$status.botUsername}?start=support`}
			target="_blank"
			rel="noopener noreferrer">в&nbsp;техподдержку в&nbsp;Telegram-боте</a
		>,
	{:else}
		в&nbsp;техподдержку в&nbsp;Telegram-боте,
	{/if}
	приложив скриншот и&nbsp;указав устройство, — ответ придёт в&nbsp;тот&nbsp;же чат. Или на&nbsp;почту
	<a class="link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
{/snippet}

<Shell page="faq">
	<div class="faq">
		<header class="faq__head">
			<Eyebrow icon={CircleHelp}>доступ · оплата · настройка</Eyebrow>
			<h1 class="faq__title">Частые вопросы</h1>
		</header>

		<div class="faq__list">
			{#each ITEMS as item (item.id)}
				<details class="faq__item" id={item.id}>
					<summary class="faq__question">
						{item.q}
						<ChevronDown class="faq__chevron" size={16} />
					</summary>
					<p class="faq__answer">{@render item.a()}</p>
				</details>
			{/each}
		</div>

		<div class="faq__more">
			<p class="faq__more-title">Остались вопросы?</p>
			<p class="faq__more-text">
				Техподдержка отвечает прямо в&nbsp;чате Telegram-бота — попасть в&nbsp;него можно со&nbsp;страницы
				получения доступа. А&nbsp;если Telegram недоступен, можно написать на&nbsp;почту
				<a class="link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
			</p>
			<Cta href="/get">Получить доступ</Cta>
		</div>

		<div class="faq__back"><BackLink /></div>
	</div>
</Shell>

<style>
	.faq {
		&__head {
			margin-bottom: 1.5rem;
		}

		&__title {
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.025em;
		}

		&__item {
			border-bottom: 1px solid var(--border);

			&[open] :global(.faq__chevron) {
				rotate: 180deg;
			}
		}

		&__question {
			cursor: pointer;
			display: flex;
			gap: 1rem;
			align-items: center;
			justify-content: space-between;
			padding-block: 1rem;
			font-size: 0.875rem;
			font-weight: 500;
			list-style: none;

			&::-webkit-details-marker {
				display: none;
			}

			&:hover {
				text-decoration: underline;
			}
		}

		:global(.faq__chevron) {
			flex-shrink: 0;
			color: var(--muted);
			transition: rotate 0.2s;
		}

		&__answer {
			padding-bottom: 1rem;
			font-size: 0.875rem;
			line-height: 1.625;
			color: var(--muted);
		}

		&__more {
			margin-top: 2rem;
			padding: 1.25rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 1.4);
		}

		&__more-title {
			margin-bottom: 0.25rem;
			font-size: 0.875rem;
			font-weight: 600;
		}

		&__more-text {
			margin-bottom: 1rem;
			font-size: 0.875rem;
			line-height: 1.625;
			color: var(--muted);
		}

		&__back {
			margin-top: 1.5rem;
		}
	}
</style>
