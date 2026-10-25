<script lang="ts">
	import type { Health } from '#frontend/site/api/schemas.ts'

	/** Цветная точка состояния: зелёная, жёлтая, красная или серая, когда статус неизвестен. */
	let { status }: { status: Health } = $props()
</script>

<span class="health-dot health-dot--{status}" aria-hidden="true"></span>

<style>
	.health-dot {
		flex-shrink: 0;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--muted) 40%, transparent);

		&--operational {
			background: #10b981;
		}

		&--degraded {
			background: #f59e0b;
		}

		&--down {
			background: #ef4444;
		}
	}
</style>
