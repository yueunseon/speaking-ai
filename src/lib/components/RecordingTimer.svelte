<!--src/lib/components/RecordingTimer.svelte-->
<script>
	import { formatTime } from '$lib/utils/format.js';
	
	let { recordingTime, isRecording } = $props();
</script>

<div class="mb-6">
	{#if isRecording}
		<div class="flex items-center gap-3">
			<div class="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
			<span class="text-3xl font-mono font-bold text-white">
				{formatTime(recordingTime)}
			</span>
		</div>
	{:else}
		<div class="text-3xl font-mono font-bold text-gray-500">
			{formatTime(recordingTime)}
		</div>
	{/if}
</div>
