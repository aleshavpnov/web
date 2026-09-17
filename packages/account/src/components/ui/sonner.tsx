import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
	CircleCheckIcon,
	InfoIcon,
	TriangleAlertIcon,
	OctagonXIcon,
	Loader2Icon,
} from 'lucide-react'
import { reatomComponent } from '@reatom/react'
import type { CSSProperties } from 'react'

import { themeAtom } from '@/state/cabinet.ts'

/**
 * Отличие от версии в packages/site: тема берётся из themeAtom (его ведёт Telegram),
 * а не из next-themes — вебвью бывает тёмным при светлой системной теме, и наоборот.
 */
const Toaster = reatomComponent<ToasterProps>(
	(props) => (
		<Sonner
			theme={themeAtom()}
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
					'--border-radius': 'var(--radius)',
				} as CSSProperties
			}
			toastOptions={{ classNames: { toast: 'cn-toast' } }}
			{...props}
		/>
	),
	'Toaster',
)

export { Toaster }
