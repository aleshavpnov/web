<script lang="ts">
	import type { LucideProps } from '@lucide/svelte'

	// Логотип Happ (https://happ.su/imgs/logo_small.svg), красится через currentColor.
	let { class: className, size = 16 }: LucideProps = $props()
</script>

<svg class={className} height={size} viewBox="0 0 32 39" fill="currentColor" aria-hidden="true">
	<path d="M12.2983 4.41131L1.79344 14.9383L4.19455 0H13.1987L12.2983 4.41131Z" />
	<path
		d="M13.5989 4.81234L3.09405 15.3393L0 34.5887L10.5048 24.0617L10.7305 22.6581H12.0982L18.7012 16.0411H11.794L13.5989 4.81234Z"
	/>
	<path
		d="M18.4011 34.1877L28.906 23.6607L32 4.41131L21.4952 14.9383L21.2695 16.3419H19.9018L13.2988 22.9589H20.206L18.4011 34.1877Z"
	/>
	<path d="M30.3066 4.41131L19.8018 14.9383L22.2029 0H31.207L30.3066 4.41131Z" />
	<path d="M1.59335 34.5887L12.0982 24.0617L9.69709 39H0.692936L1.59335 34.5887Z" />
	<path d="M19.6017 34.5887L30.1065 24.0617L27.7054 39H18.7012L19.6017 34.5887Z" />
</svg>
