<script lang="ts">
	import { Activity, CalendarClock, Smartphone, Users } from '@lucide/svelte'

	import TileBone from '#frontend/cabinet/components/bones/tile-bone.svelte'
</script>

<!--
	Плитки на своих местах: те же четыре, с теми же иконками. Раньше их было две — и в
	момент, когда приходил `summary`, всё под ними уезжало вниз на высоту ряда.
-->
<div class="widgets-bone">
	<TileBone icon={Activity} value="5rem" hint="4rem" />
	<TileBone icon={Smartphone} value="2rem" hint="7rem" />
	<TileBone icon={Users} value="2rem" hint="6rem" />
	<TileBone icon={CalendarClock} value="4rem" hint="8rem" />
</div>

<style>
	.widgets-bone {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
</style>
