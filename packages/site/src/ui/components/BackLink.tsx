import { ArrowLeft } from 'lucide-react'
import { navigate } from '@/state/screen.ts'

/** Кнопка возврата на главную в том же стиле, что и логотип-«Вернуться» в шапке. */
export function BackLink() {
	return (
		<button
			className="inline-flex items-center gap-2 text-sm font-bold whitespace-nowrap text-foreground hover:text-foreground/80 transition-colors"
			onClick={() => navigate('home')}
		>
			<ArrowLeft className="size-4 text-emerald-500" />
			Вернуться
		</button>
	)
}
