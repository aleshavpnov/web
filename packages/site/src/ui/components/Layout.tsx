import type { ReactNode } from 'react'
import { Topbar } from '@/ui/components/Topbar.tsx'

/** Wraps every screen in a mobile-width column (header + content), centered on wider viewports. */
export function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
				<Topbar />
				{children}
			</div>
		</div>
	)
}
