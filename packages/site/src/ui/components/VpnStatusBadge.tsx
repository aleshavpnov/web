import { reatomComponent } from '@reatom/react'
import { useEffect, useState } from 'react'
import { isDarkAtom } from '@/state/theme.ts'

export const VpnStatusBadge = reatomComponent(() => {
	const theme = isDarkAtom() ? 'dark' : 'light'
	// Внешний виджет-рейтинг (vpnstatus.site) — сильный внешний маркер: бэклинк на VPN-каталог
	// + запрос к стороннему домену. Монтируем с задержкой ~1с: в немедленный рендер (и в то,
	// что успеет прочитать наивный не-ждущий headless) он не попадает — живой пользователь
	// видит его через секунду. Место зарезервировано (aspect-ratio виджета) → появление не
	// двигает layout.
	const [show, setShow] = useState(false)
	useEffect(() => {
		const t = setTimeout(() => setShow(true), 1000)
		return () => clearTimeout(t)
	}, [])
	return (
		<div className="w-full aspect-[680/128]">
			{show && (
				<a
					href="https://vpnstatus.site/vpn/alesha-vpnov?utm_source=widget&utm_medium=badge&utm_campaign=owner"
					target="_blank"
					rel="noopener"
					className="block w-full"
				>
					<img
						src={`https://vpnstatus.site/vpn/alesha-vpnov/widget/compact?theme=${theme}&reviews=0`}
						width={680}
						height={128}
						loading="lazy"
						className="w-full h-auto"
						alt="Рейтинг Alesha Vepenov — 5 из 5"
					/>
				</a>
			)}
		</div>
	)
}, 'VpnStatusBadge')
