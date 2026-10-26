<script lang="ts">
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'
	import { watchTheme, schemeOf, type Scheme } from '@aimuzov/infra-site-kit/theme.js'

	// Внешний виджет-рейтинг (vpnstatus.site) — сильный внешний маркер: бэклинк на VPN-каталог
	// и запрос к стороннему домену. Монтируем с задержкой ~1с: в немедленный рендер (и в то,
	// что успеет прочитать наивный не-ждущий headless) он не попадает — живой посетитель
	// видит его через секунду.
	//
	// Место под виджет занято с первого кадра заготовкой его пропорций, картинка встаёт в него
	// без сдвига. Каталог не ответил — место схлопывается, вечной пустой рамки не остаётся.
	let show = $state(false)
	let phase = $state<'loading' | 'loaded' | 'failed'>('loading')
	let scheme = $state<Scheme>('light')

	$effect(() => {
		const timer = setTimeout(() => (show = true), 1000)

		return () => clearTimeout(timer)
	})

	$effect(() => watchTheme((theme, system) => (scheme = schemeOf(theme, system))))
</script>

{#if phase !== 'failed'}
	<div class="rating-badge">
		{#if phase === 'loading'}
			<div class="rating-badge__placeholder"><Skeleton height="100%" /></div>
		{/if}
		{#if show}
			<a
				class={['rating-badge__link', phase === 'loaded' && 'rating-badge__link--loaded']}
				href="https://vpnstatus.site/vpn/alesha-vpnov?utm_source=widget&utm_medium=badge&utm_campaign=owner"
				target="_blank"
				rel="noopener"
				aria-hidden={phase !== 'loaded'}
				tabindex={phase === 'loaded' ? undefined : -1}
			>
				<img
					class="rating-badge__image"
					src={`https://vpnstatus.site/vpn/alesha-vpnov/widget/compact?theme=${scheme}&reviews=0`}
					width="680"
					height="128"
					alt="Рейтинг Alesha Vepenov — 5 из 5"
					onload={() => (phase = 'loaded')}
					onerror={() => (phase = 'failed')}
				/>
			</a>
		{/if}
	</div>
{/if}

<style>
	.rating-badge {
		position: relative;
		aspect-ratio: 680 / 128;
		width: 100%;

		&__placeholder {
			position: absolute;
			inset: 0;
			overflow: hidden;
			display: flex;
			border-radius: 0.75rem;
		}

		&__link {
			display: block;
			width: 100%;
			opacity: 0;
			transition: opacity 0.3s;

			&--loaded {
				opacity: 1;
			}
		}

		&__image {
			width: 100%;
			height: auto;
		}
	}
</style>
