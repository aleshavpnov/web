import { ShieldCheck, FileText, Mail } from 'lucide-react'
import { navigate } from '@/state/screen.ts'
import { LEGAL_EMAIL } from '@/ui/screens/legal-shell.tsx'

const linkClass = 'inline-flex items-center gap-1.5 hover:text-foreground transition-colors'

/** Нижний колонтитул со ссылками на юридические документы и контакт поддержки. */
export function Footer() {
	return (
		<footer className="mt-auto border-t border-border/50 px-4 py-5 text-xs text-muted-foreground">
			<nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
				<button className={linkClass} onClick={() => navigate('privacy')}>
					<ShieldCheck className="size-3.5" />
					Политика конфиденциальности
				</button>
				<button className={linkClass} onClick={() => navigate('terms')}>
					<FileText className="size-3.5" />
					Пользовательское соглашение
				</button>
				<a href={`mailto:${LEGAL_EMAIL}`} className={linkClass}>
					<Mail className="size-3.5" />
					{LEGAL_EMAIL}
				</a>
			</nav>
		</footer>
	)
}
