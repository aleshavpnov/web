import type { ReactNode } from 'react'
import { Topbar } from '@/ui/components/Topbar.tsx'
import { Footer } from '@/ui/components/Footer.tsx'

/** Wraps every screen in a mobile-width column (header + content + footer), centered on wider viewports. */
export function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="dark min-h-screen bg-stone-950 text-stone-50">
			<div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
				<Topbar />
				{children}
				<Footer />
			</div>
		</div>
	)
}
