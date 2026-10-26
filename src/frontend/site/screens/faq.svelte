<script lang="ts">
	import { CircleHelp, Search } from '@lucide/svelte'
	import type { Snippet } from 'svelte'

	import Cta from '#frontend/components/cta.svelte'
	import Eyebrow from '#frontend/components/eyebrow.svelte'
	import Shell from '#frontend/components/shell.svelte'
	import { LEGAL_EMAIL as SUPPORT_EMAIL } from '#frontend/site/legal.ts'
	import { status } from '#frontend/site/state/status.ts'

	/** Диплинк на подписку «Прайм» в Tribute (кнопка Share у подписки в дашборде). */
	const TRIBUTE_SUB_URL = 'https://t.me/tribute/app?startapp=sVea'

	type Topic = 'access' | 'devices' | 'payment' | 'trouble'

	const TOPICS: { id: Topic; label: string }[] = [
		{ id: 'access', label: 'Доступ' },
		{ id: 'devices', label: 'Устройства' },
		{ id: 'payment', label: 'Оплата' },
		{ id: 'trouble', label: 'Если что-то не так' },
	]

	const ITEMS: { id: string; topic: Topic; q: string; a: Snippet }[] = [
		{ id: 'what-is', topic: 'access', q: 'Что такое Alesha Vepenov?', a: whatIs },
		{ id: 'trial', topic: 'access', q: 'Можно ли попробовать бесплатно?', a: trial },
		{ id: 'devices', topic: 'devices', q: 'Какие устройства и приложения поддерживаются?', a: devices },
		{ id: 'limits', topic: 'devices', q: 'Есть ли лимиты трафика или количества устройств?', a: limits },
		{ id: 'pricing', topic: 'payment', q: 'Сколько стоит и как оплатить?', a: pricing },
		{ id: 'gift', topic: 'payment', q: 'Можно ли подарить подписку?', a: gift },
		{ id: 'cancel', topic: 'payment', q: 'Как отменить подписку или отключить автопродление?', a: cancel },
		{ id: 'referral', topic: 'payment', q: 'Есть ли реферальная программа?', a: referral },
		{ id: 'speed', topic: 'trouble', q: 'Замедлится ли соединение?', a: speed },
		{ id: 'troubleshoot', topic: 'trouble', q: 'Не подключается — что делать?', a: troubleshoot },
	]

	let query = $state('')
	let active = $state<Topic>('access')
	// Ответы живут в сниппетах со ссылками, строки из них не достать: ищем по тексту карточек,
	// каким его видит посетитель.
	let texts = $state<Record<string, string>>({})

	const needle = $derived(query.trim().toLowerCase())
	const shown = $derived(new Set(ITEMS.filter((i) => !needle || texts[i.id]?.includes(needle)).map((i) => i.id)))

	function countIn(topic: Topic) {
		return ITEMS.filter((i) => i.topic === topic && shown.has(i.id)).length
	}

	function collect(node: HTMLElement, id: string) {
		texts[id] = (node.textContent ?? '').replace(/\s+/g, ' ').toLowerCase()
	}

	// Текущая тема в оглавлении — та, чей раздел сейчас у верхней трети экрана.
	const sections = new Map<Element, Topic>()
	let observer: IntersectionObserver | undefined

	$effect(() => {
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const topic = sections.get(entry.target)

					if (entry.isIntersecting && topic) active = topic
				}
			},
			{ rootMargin: '0px 0px -66% 0px' },
		)

		for (const node of sections.keys()) observer.observe(node)

		return () => observer?.disconnect()
	})

	function track(node: HTMLElement, topic: Topic) {
		sections.set(node, topic)
		observer?.observe(node)

		return () => {
			sections.delete(node)
			observer?.unobserve(node)
		}
	}
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

{#snippet support(where: 'aside' | 'bottom')}
	<div class="faq__support faq__support--{where}">
		<p class="faq__support-title">Остались вопросы?</p>
		<p class="faq__support-text">
			Техподдержка отвечает прямо в&nbsp;чате Telegram-бота — попасть в&nbsp;него можно со&nbsp;страницы получения
			доступа. А&nbsp;если Telegram недоступен, можно написать на&nbsp;почту
			<a class="link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
		</p>
		<Cta href="/get">Получить доступ</Cta>
	</div>
{/snippet}

<Shell page="faq" wide>
	<div class="faq">
		<aside class="faq__aside">
			<header>
				<Eyebrow icon={CircleHelp}>доступ · оплата · настройка</Eyebrow>
				<h1 class="faq__title">Частые вопросы</h1>
			</header>
			<label class="faq__search">
				<Search size={16} />
				<input class="faq__search-input" type="search" placeholder="Поиск по вопросам" bind:value={query} />
			</label>
			<nav class="faq__topics" aria-label="Темы">
				{#each TOPICS as topic (topic.id)}
					<a
						class={['faq__topic', active === topic.id && 'faq__topic--active']}
						href={`#topic-${topic.id}`}
						aria-current={active === topic.id ? 'location' : undefined}
						onclick={() => (active = topic.id)}
					>
						{topic.label}<span class="faq__count">{countIn(topic.id)}</span>
					</a>
				{/each}
			</nav>
			{@render support('aside')}
		</aside>

		<div class="faq__content">
			{#each TOPICS as topic (topic.id)}
				<section
					class={['faq__section', countIn(topic.id) === 0 && 'faq__section--empty']}
					id={`topic-${topic.id}`}
					{@attach (node) => track(node, topic.id)}
				>
					<h2 class="faq__heading">{topic.label}</h2>
					{#each ITEMS.filter((i) => i.topic === topic.id) as item (item.id)}
						<article
							class={['faq__card', !shown.has(item.id) && 'faq__card--hidden']}
							id={item.id}
							{@attach (node) => collect(node, item.id)}
						>
							<h3 class="faq__question">{item.q}</h3>
							<p class="faq__answer">{@render item.a()}</p>
						</article>
					{/each}
				</section>
			{/each}
			{#if shown.size === 0}
				<p class="faq__empty">По&nbsp;запросу «{query.trim()}» ничего не&nbsp;нашлось.</p>
			{/if}
			{@render support('bottom')}
		</div>
	</div>
</Shell>

<style>
	.faq {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.75rem;

		@media (--md) {
			grid-template-columns: 18rem minmax(0, 1fr);
			gap: 3.5rem;
			align-items: start;
		}

		&__aside {
			display: flex;
			flex-direction: column;
			gap: 1.25rem;
			min-width: 0;

			@media (--md) {
				position: sticky;
				top: 1.5rem;
			}
		}

		&__title {
			font-size: clamp(1.75rem, 3.5vw, 2.125rem);
			font-weight: 800;
			line-height: 1.1;
			letter-spacing: -0.03em;
		}

		&__search {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			height: 2.75rem;
			padding: 0 0.75rem;
			border: 1px solid var(--border);
			border-radius: 0.75rem;
			color: var(--muted);
			background: var(--card);

			&:focus-within {
				border-color: var(--accent);
			}
		}

		&__search-input {
			flex: 1;
			min-width: 0;
			border: 0;
			font: inherit;
			font-size: 0.875rem;
			color: var(--fg);
			background: transparent;
			outline: 0;
		}

		&__topics {
			overflow-x: auto;
			display: flex;
			gap: 0.375rem;
			margin-inline: calc(var(--gutter) * -1);
			padding-inline: var(--gutter);

			@media (--md) {
				overflow: visible;
				flex-direction: column;
				gap: 0.125rem;
				margin-inline: 0;
				padding-inline: 0;
			}
		}

		&__topic {
			display: flex;
			flex-shrink: 0;
			gap: 0.75rem;
			align-items: center;
			justify-content: space-between;
			padding: 0.625rem 0.75rem;
			border: 1px solid var(--border);
			border-radius: 0.625rem;
			font-size: 0.875rem;
			font-weight: 600;
			color: color-mix(in srgb, var(--fg) 80%, transparent);
			text-decoration: none;
			white-space: nowrap;
			background: var(--card);
			transition:
				background-color 0.15s,
				color 0.15s;

			@media (--md) {
				border-color: transparent;
				background: none;
			}

			&:hover {
				color: var(--fg);
			}

			&--active,
			&--active:hover {
				border-color: transparent;
				font-weight: 700;
				color: var(--accent);
				background: color-mix(in srgb, var(--accent-fill) 14%, transparent);
			}
		}

		&__count {
			font-size: 0.8125rem;
			color: var(--muted);

			.faq__topic--active & {
				color: inherit;
			}
		}

		&__content {
			display: flex;
			flex-direction: column;
			gap: 2.5rem;
			min-width: 0;
		}

		&__section {
			scroll-margin-top: 1.5rem;
			display: flex;
			flex-direction: column;
			gap: 0.75rem;

			&--empty {
				display: none;
			}
		}

		&__heading {
			margin: 0 0 0.25rem;
			font-size: 1.375rem;
			font-weight: 800;
		}

		&__card {
			scroll-margin-top: 1.5rem;
			padding: 1.25rem 1.375rem;
			border: 1px solid var(--border);
			border-radius: 1rem;
			background: var(--card);

			&--hidden {
				display: none;
			}
		}

		&__question {
			margin: 0 0 0.5rem;
			font-size: 1rem;
			font-weight: 700;
		}

		&__answer {
			font-size: 0.875rem;
			line-height: 1.65;
			color: var(--muted);
		}

		&__empty {
			font-size: 0.9375rem;
			color: var(--muted);
		}

		&__support {
			display: grid;
			gap: 0.625rem;
			padding: 1rem 1.125rem;
			border: 1px solid var(--border);
			border-radius: 1rem;
			background: var(--card);

			&--aside {
				display: none;

				@media (--md) {
					display: grid;
				}
			}

			&--bottom {
				@media (--md) {
					display: none;
				}
			}
		}

		&__support-title {
			font-size: 0.9375rem;
			font-weight: 700;
		}

		&__support-text {
			font-size: 0.8125rem;
			line-height: 1.55;
			color: var(--muted);
		}
	}
</style>
