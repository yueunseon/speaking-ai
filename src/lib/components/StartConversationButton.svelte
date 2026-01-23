<!--src/lib/components/StartConversationButton.svelte-->
<script>
	let { onStart, isConnecting, isConnected } = $props();
</script>

{#if !isConnected && !isConnecting}
	<div class="flex flex-col items-center mb-8">
		<button
			onclick={onStart}
			class="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
			</svg>
			<span class="text-lg">AI와 대화 시작</span>
		</button>
		<p class="text-gray-400 text-sm mt-3 text-center">
			버튼을 클릭하여 AI 튜터와 실시간 영어 대화를 시작하세요
		</p>
	</div>
{:else if isConnecting}
	<div class="flex flex-col items-center mb-8">
		<div class="bg-gray-700 text-gray-300 font-semibold py-4 px-8 rounded-xl flex items-center gap-3">
			<svg class="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<span>AI 튜터 연결 중...</span>
		</div>
	</div>
{/if}
