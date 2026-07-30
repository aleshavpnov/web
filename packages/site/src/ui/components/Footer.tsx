import { navigate } from '@/state/screen.ts'
import { LEGAL_EMAIL } from '@/ui/screens/legal-shell.tsx'

const linkClass = 'hover:text-foreground transition-colors'

/** Нижний колонтитул со ссылками на юридические документы и контакт поддержки. */
export function Footer() {
	return (
		<footer className="mt-auto border-t border-border/50 px-4 py-5 text-xs text-muted-foreground">
			<nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<button className={linkClass} onClick={() => navigate('privacy')}>
					Политика конфиденциальности
				</button>
				<button className={linkClass} onClick={() => navigate('terms')}>
					Пользовательское соглашение
				</button>
				<a href={`mailto:${LEGAL_EMAIL}`} className={linkClass}>
					{LEGAL_EMAIL}
				</a>
			</nav>
		</footer>
	)
}
