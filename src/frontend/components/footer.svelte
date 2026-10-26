<script lang="ts">
	import { FileText, Mail, ShieldCheck } from '@lucide/svelte'

	import { LEGAL_EMAIL } from '#frontend/site/legal.ts'
</script>

<footer class="footer">
	<nav class="footer__nav">
		<a class="footer__link" href="/privacy"><ShieldCheck size={14} />Политика конфиденциальности</a>
		<a class="footer__link" href="/terms"><FileText size={14} />Пользовательское соглашение</a>
		<a class="footer__link" href={`mailto:${LEGAL_EMAIL}`}><Mail size={14} />{LEGAL_EMAIL}</a>
	</nav>
</footer>

<style>
	.footer {
		margin-top: auto;
		padding: 1.25rem var(--gutter);
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
		font-size: 0.75rem;
		color: var(--muted);
		background: var(--bg);

		&__nav {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
			align-items: center;
			justify-content: center;
			max-width: var(--column);
			margin-inline: auto;
			text-align: center;
		}

		&__link {
			display: inline-flex;
			gap: 0.375rem;
			align-items: center;
			color: inherit;
			text-decoration: none;
			transition: color 0.15s;

			&:hover {
				color: var(--fg);
			}
		}
	}
</style>
