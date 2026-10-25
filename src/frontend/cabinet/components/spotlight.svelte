<script lang="ts">
	/**
	 * Подсветка одной кнопки на затемнённом экране — финал диплинка из подсказки бота.
	 *
	 * Прокрутки к нужной карточке оказалось мало: экран длинный, кнопка мелкая, и человек
	 * всё равно не понимал, куда жать (разбор 28.08.2026). Поэтому гасим всё вокруг и
	 * оставляем светящуюся цель с запиской рядом.
	 *
	 * Вырез сделан гигантской тенью (`box-shadow: 0 0 0 9999px`), а не маской с дыркой:
	 * так затемнение и «окно» — один элемент, который не надо синхронизировать, а сама
	 * кнопка остаётся настоящей и кликается насквозь (`pointer-events: none` на слое).
	 *
	 * Координаты ставятся через `node.style` в эффекте, а не атрибутом `style`: его режет CSP.
	 * Гасится по любому касанию мимо цели, Escape и уходу с экрана: подсказка разовая.
	 */
	import { SPOTLIGHT_ATTR, type SpotlightTarget } from '#frontend/components/connect/apps.ts'

	let { target, note, ondone }: { target: SpotlightTarget | null; note: string; ondone: () => void } = $props()

	/** Отступ выреза от кнопки — чтобы свечение не липло к её краю. */
	const PAD = 8

	type Rect = { top: number; left: number; width: number; height: number }

	let el = $state<Element | null>(null)
	let rect = $state<Rect | null>(null)

	let hole = $state<HTMLElement>()
	let label = $state<HTMLElement>()
	let traps = $state<HTMLElement[]>([])

	// Цель появляется в DOM позже: экран рисуется после ответа `/access`, а диплинк открывается
	// сразу. Наблюдатель дешевле опроса и снимается вместе с эффектом.
	$effect(() => {
		el = null

		if (!target) return

		const find = () => document.querySelector(`[${SPOTLIGHT_ATTR}="${target}"]`)
		const found = find()

		if (found) {
			el = found

			return
		}

		const mo = new MutationObserver(() => {
			const late = find()

			if (late) {
				el = late
				mo.disconnect()
			}
		})

		mo.observe(document.body, { childList: true, subtree: true })

		return () => mo.disconnect()
	})

	// Позиция цели: считаем после скролла к ней и держим в актуальном состоянии, пока
	// экран елозит (мягкая прокрутка, догрузка карточек, поворот телефона).
	$effect(() => {
		const current = el

		rect = null

		if (!current) return

		current.scrollIntoView({ behavior: 'smooth', block: 'center' })

		const sync = () => {
			const r = current.getBoundingClientRect()

			rect = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
		}

		const raf = requestAnimationFrame(sync)
		const timer = setInterval(sync, 100)

		window.addEventListener('resize', sync)

		return () => {
			cancelAnimationFrame(raf)
			clearInterval(timer)
			window.removeEventListener('resize', sync)
		}
	})

	$effect(() => {
		if (!el) return

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') ondone()
		}

		document.addEventListener('keydown', onKey)

		return () => document.removeEventListener('keydown', onKey)
	})

	const px = (n: number) => `${n}px`

	$effect(() => {
		if (!rect || !hole || !label) return

		Object.assign(hole.style, {
			top: px(rect.top),
			left: px(rect.left),
			width: px(rect.width),
			height: px(rect.height),
		})

		// Записка снизу, если сверху не помещается: у кнопки над ней шапка экрана.
		const below = rect.top < 120

		Object.assign(label.style, {
			top: below ? px(rect.top + rect.height + 12) : '',
			bottom: below ? '' : px(window.innerHeight - rect.top + 12),
			left: px(Math.max(12, Math.min(rect.left, window.innerWidth - 252))),
		})

		// Ловушка тапа — четырьмя полосами ВОКРУГ цели, а не одним слоем поверх всего:
		// сплошной слой перехватывал бы и нажатие на саму подсвеченную кнопку, то есть
		// гасил подсказку вместо того, ради чего человек сюда пришёл.
		const boxes = [
			{ top: '0', left: '0', width: '100%', height: px(Math.max(0, rect.top)) },
			{ top: px(rect.top + rect.height), left: '0', width: '100%', bottom: '0' },
			{ top: px(rect.top), left: '0', width: px(Math.max(0, rect.left)), height: px(rect.height) },
			{ top: px(rect.top), left: px(rect.left + rect.width), right: '0', height: px(rect.height) },
		]

		boxes.forEach((box, i) => {
			const trap = traps[i]

			if (trap) Object.assign(trap.style, box)
		})
	})
</script>

{#if el && rect}
	<div class="spotlight" aria-hidden="true">
		{#each { length: 4 }, i (i)}
			<button
				bind:this={traps[i]}
				type="button"
				class="spotlight__trap"
				aria-label="Скрыть подсказку"
				tabindex="-1"
				onclick={ondone}
			></button>
		{/each}
		<div bind:this={hole} class="spotlight__hole"></div>
		<div bind:this={label} class="spotlight__note">{note}</div>
	</div>
{/if}

<style>
	.spotlight {
		pointer-events: none;
		position: fixed;
		z-index: 50;
		inset: 0;

		&__trap {
			pointer-events: auto;
			cursor: default;
			position: absolute;
			padding: 0;
			border: 0;
			background: transparent;
		}

		/* Одной тенью: свечение вокруг цели и заливка всего остального экрана. */
		&__hole {
			position: absolute;
			border-radius: calc(var(--radius) * 1.4);
			box-shadow:
				0 0 0 2px var(--brand),
				0 0 24px 6px color-mix(in srgb, var(--accent-fill) 45%, transparent),
				0 0 0 9999px rgb(0 0 0 / 50%);
		}

		/* Плашка темнее фирменного зелёного: белый текст на самом brand почти не читается. */
		&__note {
			position: absolute;
			max-width: 15rem;
			padding: 0.5rem 0.75rem;
			border-radius: var(--radius);
			font-size: 0.875rem;
			font-weight: 500;
			color: #fff;
			background: var(--accent);
			box-shadow: 0 20px 25px -5px rgb(0 0 0 / 20%);
		}
	}
</style>
