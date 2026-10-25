<script lang="ts">
	import { watchTheme, schemeOf, type Scheme } from '@aimuzov/infra-site-kit/theme.js'

	// Внешний виджет-рейтинг (vpnstatus.site) — сильный внешний маркер: бэклинк на VPN-каталог
	// и запрос к стороннему домену. Монтируем с задержкой ~1с: в немедленный рендер (и в то,
	// что успеет прочитать наивный не-ждущий headless) он не попадает — живой посетитель
	// видит его через секунду. Место зарезервировано пропорцией виджета, и появление
	// не двигает вёрстку.
	let show = $state(false)
	let scheme = $state<Scheme>('light')

	$effect(() => {
		const timer = setTimeout(() => (show = true), 1000)

		return () => clearTimeout(timer)
	})

	$effect(() => watchTheme((theme, system) => (scheme = schemeOf(theme, system))))
</script>

<div class="rating-badge">
	{#if show}
		<a
			class="rating-badge__link"
			href="https://vpnstatus.site/vpn/alesha-vpnov?utm_source=widget&utm_medium=badge&utm_campaign=owner"
			target="_blank"
			rel="noopener"
		>
			<img
				class="rating-badge__image"
				src={`https://vpnstatus.site/vpn/alesha-vpnov/widget/compact?theme=${scheme}&reviews=0`}
				width="680"
				height="128"
				loading="lazy"
				alt="Рейтинг Alesha Vepenov — 5 из 5"
			/>
		</a>
	{/if}
</div>

<style>
	.rating-badge {
		aspect-ratio: 680 / 128;
		width: 100%;

		&__link {
			display: block;
			width: 100%;
		}

		&__image {
			width: 100%;
			height: auto;
		}
	}
</style>
