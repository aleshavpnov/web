<script lang="ts">
	import { watchTheme, schemeOf, type Scheme } from '@aimuzov/infra-site-kit/theme.js'

	// Внешний виджет-рейтинг (vpnstatus.site) — сильный внешний маркер: бэклинк на VPN-каталог
	// и запрос к стороннему домену. Монтируем с задержкой ~1с: в немедленный рендер (и в то,
	// что успеет прочитать наивный не-ждущий headless) он не попадает — живой посетитель
	// видит его через секунду. Место под него не держим: виджет проявляется, только когда
	// картинка загрузилась, иначе на её месте оставалась пустая дыра.
	let show = $state(false)
	let loaded = $state(false)
	let scheme = $state<Scheme>('light')

	$effect(() => {
		const timer = setTimeout(() => (show = true), 1000)

		return () => clearTimeout(timer)
	})

	$effect(() => watchTheme((theme, system) => (scheme = schemeOf(theme, system))))
</script>

{#if show}
	<a
		class={['rating-badge', loaded && 'rating-badge--loaded']}
		href="https://vpnstatus.site/vpn/alesha-vpnov?utm_source=widget&utm_medium=badge&utm_campaign=owner"
		target="_blank"
		rel="noopener"
		aria-hidden={!loaded}
		tabindex={loaded ? undefined : -1}
	>
		<img
			class="rating-badge__image"
			src={`https://vpnstatus.site/vpn/alesha-vpnov/widget/compact?theme=${scheme}&reviews=0`}
			width="680"
			height="128"
			alt="Рейтинг Alesha Vepenov — 5 из 5"
			onload={() => (loaded = true)}
		/>
	</a>
{/if}

<style>
	.rating-badge {
		overflow: hidden;
		display: block;
		height: 0;
		opacity: 0;
		transition: opacity 0.3s;

		&--loaded {
			height: auto;
			opacity: 1;
		}

		&__image {
			width: 100%;
			height: auto;
		}
	}
</style>
