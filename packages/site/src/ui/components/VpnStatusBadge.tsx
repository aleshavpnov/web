import { reatomComponent } from '@reatom/react'
import { isDarkAtom } from '@/state/theme.ts'

export const VpnStatusBadge = reatomComponent(() => {
	const theme = isDarkAtom() ? 'dark' : 'light'
	return (
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
				alt="Рейтинг Alesha Vpnov на VPN Статус — 5 из 5"
			/>
		</a>
	)
}, 'VpnStatusBadge')
