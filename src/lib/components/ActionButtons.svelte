<script>
	let { 
		onSendToAI, 
		onDownload, 
		onReset, 
		isProcessing 
	} = $props();
</script>

<div class="flex gap-3 flex-wrap">
	<button
		onclick={onSendToAI}
		disabled={isProcessing}
		class="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-purple-800 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
	>
		{#if isProcessing}
			<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			처리 중...
		{:else}
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
			</svg>
			영어회화 연습
		{/if}
	</button>
	<button
		onclick={onDownload}
		class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
		</svg>
		다운로드
	</button>
	<button
		onclick={onReset}
		class="bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
		</svg>
		초기화
	</button>
</div>
