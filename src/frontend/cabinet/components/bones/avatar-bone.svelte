<script lang="ts">
	import { UserRound } from '@lucide/svelte'
</script>

<!-- Круг на месте аватара — с силуэтом человека, размер тот же, что у `Avatar`. -->
<span class="avatar-bone" aria-hidden="true"><UserRound class="avatar-bone__icon" size={16} /></span>

<style>
	.avatar-bone {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--fg) 8%, transparent);
		animation: pulse 1.4s ease-in-out infinite;

		@media (--reduced-motion) {
			animation: none;
		}

		:global(.avatar-bone__icon) {
			color: color-mix(in srgb, var(--muted) 40%, transparent);
		}
	}

	@keyframes pulse {
		50% {
			opacity: 0.45;
		}
	}
</style>
