<script lang="ts">
	/** QR во всю ширину карточки: код рисуем крупно, чтобы читался с чужого телефона. */
	let { value, alt }: { value: string; alt: string } = $props()

	let qr = $state<string | null>(null)
	let box: HTMLDivElement

	$effect(() => {
		let alive = true

		// Библиотеку тянем только здесь: QR раскрывают редко, а в общем чанке она тормозила
		// первое открытие кабинета.
		// width 1024 — с запасом под ширину экрана на ретине: масштабируем вниз, не вверх.
		import('qrcode')
			.then(({ default: QRCode }) => QRCode.toDataURL(value, { margin: 1, width: 1024 }))
			.then((data) => {
				if (alive) qr = data
			})
			.catch(() => {
				if (alive) qr = null
			})

		return () => {
			alive = false
		}
	})

	// Код раскрывают кнопкой внизу карточки, и он открывается за краем экрана.
	// nearest — довести до края и не двигать, когда QR уже виден целиком;
	// место под панель вкладок держит scroll-margin (scrollIntoView учитывает его).
	$effect(() => {
		box.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
	})
</script>

<div bind:this={box} class="qr">
	{#if qr}<img class="qr__image" src={qr} {alt} />{/if}
</div>

<style>
	.qr {
		scroll-margin-bottom: 8rem;
		overflow: hidden;
		aspect-ratio: 1;
		width: 100%;
		padding: 0.75rem;
		border-radius: calc(var(--radius) * 1.4);
		background: #fff;

		&__image {
			width: 100%;
			height: 100%;
		}
	}
</style>
