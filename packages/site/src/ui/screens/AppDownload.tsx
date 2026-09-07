/**
 * Страница своего Android-клиента «Alesha Vpnov»: скачать APK и понять, что дальше.
 * Сюда же уводит fallback intent-ссылки со страницы-моста, когда приложение не стоит.
 */
import { reatomComponent } from '@reatom/react'
import { Download, Smartphone, Zap } from 'lucide-react'
import { APP_APK_URL, APP_RELEASES_URL } from '@shared/connect/index.ts'

import { BackLink } from '@/ui/components/BackLink.tsx'
import { Layout } from '@/ui/components/Layout.tsx'
import { ctaClass } from '@/ui/cta.ts'

export const AppDownload = reatomComponent(() => {
	return (
		<Layout>
			<main className="flex-1 px-4 py-8 w-full">
				<div className="mb-6">
					<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
						<Smartphone className="size-3.5" />
						android
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Приложение Alesha Vpnov для Android</h1>
				</div>

				<div className="border border-border rounded-xl p-5">
					<p className="text-sm text-muted-foreground leading-relaxed mb-4">
						Одна кнопка «Включить» — и&nbsp;больше ничего настраивать не&nbsp;нужно. Подписка
						добавляется из&nbsp;кабинета одним нажатием, маршруты обхода приходят вместе с&nbsp;ней.
					</p>
					<a href={APP_APK_URL} className={ctaClass}>
						<Download className="size-4" />
						Скачать APK
					</a>
					<p className="mt-3 text-center text-xs text-muted-foreground">
						<a
							href={APP_RELEASES_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
						>
							Все версии
						</a>
					</p>
				</div>

				<div className="border border-border rounded-xl p-5 mt-4">
					<p className="flex items-center gap-2 font-semibold text-sm mb-1">
						<Zap className="size-4 text-emerald-500" />
						Установка
					</p>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Приложение ставится не&nbsp;из&nbsp;магазина, поэтому Android спросит разрешение
						на&nbsp;установку из&nbsp;этого источника — разрешите один раз. Дальше подписку добавьте
						из&nbsp;кабинета в&nbsp;Telegram: кнопка «Открыть в&nbsp;приложении» на&nbsp;экране
						«Подключение».
					</p>
				</div>

				<div className="mt-6">
					<BackLink />
				</div>
			</main>
		</Layout>
	)
})
