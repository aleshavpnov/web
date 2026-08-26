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
import { navigate, screenAtom, SCREEN_PARENT, type ScreenName } from '@/state/screen.ts'

const TABS: Array<{ name: ScreenName; label: string; Icon: typeof HomeIcon }> = [
	{ name: 'home', label: 'Главная', Icon: HomeIcon },
	// «Доступ», а не «Подключение»: шесть вкладок на 375px, и длинная подпись слипается
	// с соседней. Заголовок экрана при этом остаётся полным.
	{ name: 'connect', label: 'Доступ', Icon: PlugZapIcon },
	{ name: 'plans', label: 'Тарифы', Icon: CreditCardIcon },
	{ name: 'usage', label: 'Трафик', Icon: ActivityIcon },
	{ name: 'refs', label: 'Друзья', Icon: UsersIcon },
	{ name: 'more', label: 'Ещё', Icon: MoreHorizontalIcon },
]

export const Nav = reatomComponent(() => {
	const screen = screenAtom()
	// Подстраница подсвечивает вкладку предка: у витрины и оформления своей вкладки
	// нет, и без этого нижнее меню выглядело бы так, будто мы вообще вне кабинета.
	// Подъём по цепочке: «Оформление» — подстраница витрины, а та — вкладки тарифов.
	let current: ScreenName = screen
	while (SCREEN_PARENT[current]) current = SCREEN_PARENT[current]!

	return (
		<nav className="sticky bottom-0 z-10 -mx-4 mt-6 flex border-t border-border bg-background/95 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
			{TABS.map(({ name, label, Icon }) => (
				<button
					key={name}
					type="button"
					onClick={() => navigate(name)}
					className={cn(
						// min-h-14 — вкладка целиком тач-цель, а не одна иконка: промах по соседней
						// вкладке уводит на другой экран, и это самая частая ошибка пальцем.
						'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] leading-none',
						current === name ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
					)}
					aria-current={current === name ? 'page' : undefined}
				>
					<Icon className="size-6" />
					{label}
				</button>
			))}
		</nav>
	)
}, 'Nav')
