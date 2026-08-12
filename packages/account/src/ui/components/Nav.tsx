/**
 * Нижняя навигация — под большой палец: кабинет открывают с телефона.
 * Пять вкладок; всё редкое (настройки, «что нового», поддержка) живёт в «Ещё».
 */
import { reatomComponent } from '@reatom/react'
import {
	ActivityIcon,
	CreditCardIcon,
	HomeIcon,
	MoreHorizontalIcon,
	PlugZapIcon,
	UsersIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils.ts'
import { navigate, screenAtom, type ScreenName } from '@/state/screen.ts'

const TABS: Array<{ name: ScreenName; label: string; Icon: typeof HomeIcon }> = [
	{ name: 'home', label: 'Главная', Icon: HomeIcon },
	{ name: 'connect', label: 'Подключение', Icon: PlugZapIcon },
	{ name: 'plans', label: 'Подписка', Icon: CreditCardIcon },
	{ name: 'usage', label: 'Трафик', Icon: ActivityIcon },
	{ name: 'refs', label: 'Друзья', Icon: UsersIcon },
	{ name: 'more', label: 'Ещё', Icon: MoreHorizontalIcon },
]

export const Nav = reatomComponent(() => {
	const current = screenAtom()

	return (
		<nav className="sticky bottom-0 z-10 -mx-4 mt-6 flex border-t border-border bg-background/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur">
			{TABS.map(({ name, label, Icon }) => (
				<button
					key={name}
					type="button"
					onClick={() => navigate(name)}
					className={cn(
						'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px]',
						current === name ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
					)}
					aria-current={current === name ? 'page' : undefined}
				>
					<Icon className="size-5" />
					{label}
				</button>
			))}
		</nav>
	)
}, 'Nav')
