import { reatomComponent } from '@reatom/react'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.tsx'
import { bridgeAtom, bridgeBusyAtom, bridgeErrorAtom, requestBridge } from '@/state/bridge.ts'
import { navigate } from '@/state/screen.ts'
import { Topbar } from '@/ui/components/Topbar.tsx'
import { Footer } from '@/ui/components/Footer.tsx'

function friendlyError(e: string) {
	if (e === 'rate-limit') return 'Слишком много запросов — попробуйте позже.'
	return 'Не удалось получить доступ. Попробуйте позже.'
}

function useCountdown(expiresAt: string | null) {
	const [remaining, setRemaining] = useState('')

	useEffect(() => {
		if (!expiresAt) return
		const tick = () => {
			const diff = new Date(expiresAt).getTime() - Date.now()
			if (diff <= 0) {
				setRemaining('истёк')
				return
			}
			const h = Math.floor(diff / 3_600_000)
			const m = Math.floor((diff % 3_600_000) / 60_000)
			const s = Math.floor((diff % 60_000) / 1000)
			setRemaining(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
		}
		tick()
		const id = setInterval(tick, 1000)
		return () => clearInterval(id)
	}, [expiresAt])

	return remaining
}

const guideSteps: Record<string, { step: string; text: ReactNode }[]> = {
	ios: [
		{
			step: '1',
			text: (
				<>
					Установите <b className="text-foreground">HAPP</b> из App Store
				</>
			),
		},
		{
			step: '2',
			text: (
				<>
					Нажмите <b className="text-foreground">+</b> → «Добавить из буфера»
				</>
			),
		},
		{ step: '3', text: <>Включите подключение — готово</> },
	],
	android: [
		{
			step: '1',
			text: (
				<>
					Установите <b className="text-foreground">HAPP</b> из Google Play или APK
				</>
			),
		},
		{
			step: '2',
			text: (
				<>
					Нажмите <b className="text-foreground">+</b> → «Из буфера обмена»
				</>
			),
		},
		{ step: '3', text: <>Включите подключение — готово</> },
	],
	pc: [
		{
			step: '1',
			text: (
				<>
					Установите <b className="text-foreground">HAPP</b> с сайта или GitHub
				</>
			),
		},
		{
			step: '2',
			text: (
				<>
					Добавьте подписку через <b className="text-foreground">+</b> → вставьте ссылку
				</>
			),
		},
		{ step: '3', text: <>Нажмите «Подключить»</> },
	],
}

const BridgePanel = reatomComponent(() => {
	const bridge = bridgeAtom()
	const busy = bridgeBusyAtom()
	const error = bridgeErrorAtom()
	const countdown = useCountdown(bridge?.expiresAt ?? null)

	useEffect(() => {
		if (error) toast.error(friendlyError(error))
	}, [error])

	const copyUrl = async () => {
		if (!bridge?.subscriptionUrl) return
		await navigator.clipboard.writeText(bridge.subscriptionUrl)
		toast.success('Ссылка скопирована')
	}

	if (!bridge) {
		return (
			<div className="flex flex-col items-start gap-4">
				<p className="text-sm text-stone-400 leading-relaxed">
					Получите временный доступ на 3 часа / 256 МБ. Ссылка-подписка откроется в HAPP.
				</p>
				<button
					disabled={busy}
					className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
					onClick={() => void requestBridge()}
				>
					{busy ? 'Получаем доступ…' : 'Получить доступ'}
				</button>
			</div>
		)
	}

	const shortUrl =
		bridge.subscriptionUrl.length > 42
			? bridge.subscriptionUrl.slice(0, 42) + '…'
			: bridge.subscriptionUrl

	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<p className="text-xs text-stone-500 uppercase tracking-wider">ссылка-подписка</p>
				<div className="flex items-center gap-2">
					<div className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2.5 text-sm text-stone-300 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
						{shortUrl}
					</div>
					<button
						className="shrink-0 bg-stone-800 hover:bg-stone-700 text-foreground text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors"
						onClick={() => void copyUrl()}
					>
						Копировать
					</button>
				</div>
			</div>

			<a
				href={bridge.deepLink}
				className="block bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm text-center py-3 rounded-lg transition-colors"
			>
				↗ Открыть в Telegram
			</a>

			<div className="flex items-center gap-2 text-sm text-stone-400">
				<span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
				Истекает через <span className="text-foreground tabular-nums font-medium">{countdown}</span>
			</div>
		</div>
	)
})

export const Access = reatomComponent(() => {
	return (
		<div className="dark min-h-screen flex flex-col bg-stone-950 text-stone-50">
			<Topbar />
			<main className="flex-1 px-5 py-8 max-w-md mx-auto w-full">
				<div className="mb-6">
					<p className="text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
						пробный доступ · 3 часа / 256 МБ
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Ваша ссылка готова</h1>
				</div>

				<div className="flex flex-col gap-4">
					{/* Левая колонка: доступ */}
					<div className="border border-stone-800 rounded-xl p-5 space-y-1">
						<p className="text-xs text-stone-500 uppercase tracking-wider mb-4">Ваш доступ</p>
						<BridgePanel />
					</div>

					{/* Правая колонка: гайд */}
					<div className="border border-stone-800 rounded-xl p-5">
						<p className="text-xs text-stone-500 uppercase tracking-wider mb-4">Как подключить</p>
						<Tabs defaultValue="ios">
							<TabsList variant="line" className="mb-5">
								<TabsTrigger value="ios">iOS</TabsTrigger>
								<TabsTrigger value="android">Android</TabsTrigger>
								<TabsTrigger value="pc">ПК</TabsTrigger>
							</TabsList>
							{Object.entries(guideSteps).map(([platform, steps]) => (
								<TabsContent key={platform} value={platform}>
									<ol className="space-y-3">
										{steps.map(({ step, text }) => (
											<li key={step} className="flex gap-3 items-start">
												<span className="text-emerald-500 font-bold text-sm w-4 shrink-0">
													{step}
												</span>
												<span className="text-sm text-stone-300 leading-relaxed">{text}</span>
											</li>
										))}
									</ol>
								</TabsContent>
							))}
						</Tabs>
					</div>
				</div>

				<div className="mt-6">
					<button
						className="text-sm text-stone-500 hover:text-stone-300 transition-colors"
						onClick={() => navigate('home')}
					>
						← На главную
					</button>
				</div>
			</main>
			<Footer />
		</div>
	)
})
