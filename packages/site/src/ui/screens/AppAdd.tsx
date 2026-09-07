/**
 * Страница-мост `/app/add`: сюда кабинет отправляет диплинк с подпиской для своего
 * Android-клиента. Telegram открывает https-ссылки в Custom Tabs мимо App Links, а
 * автопереход по `intent://` Chrome блокирует — остаётся кнопка, по клику которой
 * приложение получает подписку.
 *
 * Подписка лежит во фрагменте адреса и на сервер не уходит; отсюда её тоже никуда не
 * отправляем — только собираем intent-ссылку для кнопки.
 */
import { reatomComponent } from '@reatom/react'
import { Download, Smartphone, SearchX } from 'lucide-react'
import { useState } from 'react'
import {
	APP_APK_URL,
	APP_PAGE,
	buildAppIntentUrl,
	decodeAppAddParam,
} from '@shared/connect/index.ts'

import { navigate } from '@/state/screen.ts'
import { BackLink } from '@/ui/components/BackLink.tsx'
import { Layout } from '@/ui/components/Layout.tsx'
import { ctaClass } from '@/ui/cta.ts'

/** Параметр `u` из `#u=…`, если это закодированный http(s)-адрес; иначе null. */
function readAddParam(hash: string): string | null {
	const u = new URLSearchParams(hash.replace(/^#/, '')).get('u')
	return u && decodeAppAddParam(u) ? u : null
}

export const AppAdd = reatomComponent(() => {
	// Читаем один раз: хеш нужен только для сборки ссылки, следить за ним незачем.
	const [u] = useState(() => readAddParam(window.location.hash))

	if (!u) {
		return (
			<Layout>
				<main className="flex-1 px-4 py-8 w-full flex flex-col items-center justify-center text-center gap-6">
					<SearchX className="size-24 text-emerald-500" strokeWidth={1.5} />
					<div className="space-y-2">
						<h1 className="text-xl font-bold tracking-tight">Ссылка неполная</h1>
						<p className="text-sm text-muted-foreground">
							Откройте её заново из&nbsp;кабинета в&nbsp;Telegram — кнопка «Открыть
							в&nbsp;приложении» на&nbsp;экране «Подключение».
						</p>
					</div>
					<button className={ctaClass} onClick={() => navigate('app')}>
						<Download className="size-4" />
						Страница приложения
					</button>
					<BackLink />
				</main>
			</Layout>
		)
	}

	return (
		<Layout>
			<main className="flex-1 px-4 py-8 w-full">
				<div className="mb-6">
					<p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-emerald-500 mb-2">
						<Smartphone className="size-3.5" />
						alesha vpnov
					</p>
					<h1 className="text-2xl font-bold tracking-tight">Добавить подписку</h1>
				</div>

				<div className="border border-border rounded-xl p-5">
					<p className="text-sm text-muted-foreground leading-relaxed mb-4">
						Нажмите кнопку — приложение откроется и&nbsp;добавит подписку само. Останется нажать
						«Включить».
					</p>
					<a href={buildAppIntentUrl(u, APP_PAGE)} className={`${ctaClass} cta-glow`}>
						<Smartphone className="size-4" />
						Открыть в приложении
					</a>
					<p className="mt-3 text-center text-xs text-muted-foreground">
						Нет приложения?{' '}
						<a
							href={APP_APK_URL}
							className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
						>
							Скачать APK
						</a>
					</p>
				</div>

				<div className="mt-6">
					<BackLink />
				</div>
			</main>
		</Layout>
	)
})
