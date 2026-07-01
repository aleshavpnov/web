import { reatomComponent } from '@reatom/react'
import { SearchX } from 'lucide-react'
import { navigate } from '@/state/screen.ts'
import { Layout } from '@/ui/components/Layout.tsx'

export const NotFound = reatomComponent(() => {
	return (
		<Layout>
			<main className="flex-1 px-4 py-8 w-full flex flex-col items-center justify-center text-center gap-6">
				<SearchX className="size-24 text-emerald-500" strokeWidth={1.5} />
				<div className="space-y-2">
					<h1 className="text-xl font-bold tracking-tight">404 — страница не найдена</h1>
					<p className="text-sm text-muted-foreground">
						Такой страницы не существует или она была удалена.
					</p>
				</div>
				<button
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					onClick={() => navigate('home')}
				>
					← На главную
				</button>
			</main>
		</Layout>
	)
})
