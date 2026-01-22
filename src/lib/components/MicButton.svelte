<script>
	let { isRecording, onStart, onStop } = $props();
</script>

<div class="mb-6">
	<div class="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center bg-gray-700 shadow-lg">
		{#if !isRecording}
			<button
				onclick={onStart}
				class="w-full h-full rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-600/50 hover:shadow-xl hover:shadow-red-600/50 hover:scale-105 active:scale-95"
				aria-label="녹음 시작"
			>
				<svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
				</svg>
			</button>
		{:else}
			<div class="w-full h-full rounded-full bg-red-600 flex items-center justify-center animate-pulse">
				<button
					onclick={onStop}
					class="w-full h-full rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
					aria-label="녹음 중지"
				>
					<svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
					</svg>
				</button>
			</div>
		{/if}
	</div>
</div>
