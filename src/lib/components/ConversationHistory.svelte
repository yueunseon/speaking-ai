<!--src/lib/components/ConversationHistory.svelte-->
<script>
	let { conversations } = $props();
</script>

{#if conversations && conversations.length > 0}
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold text-white">대화 기록</h2>
			<span class="text-sm text-gray-400">{conversations.length}개의 대화</span>
		</div>

		<div class="space-y-4 max-h-64 overflow-y-auto">
			{#each conversations as conversation, index}
				<div class="space-y-2 pb-3 border-b border-gray-700 last:border-b-0 last:pb-0">
					<!-- 내가 말한 내용 -->
					<div class="mb-2">
						<div class="flex items-start gap-2">
							<div class="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
								<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-xs text-blue-400 font-medium mb-1">내가 말한 내용</div>
								<div class="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap">
									{conversation.userText || '(인식된 내용 없음)'}
								</div>
							</div>
						</div>
					</div>

					<!-- AI 응답 -->
					<div class="mb-2">
						<div class="flex items-start gap-2">
							<div class="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
								<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-xs text-purple-400 font-medium mb-1">AI 응답</div>
								<div class="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap">
									{conversation.aiText || ''}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* 스크롤바 스타일링 */
	:global(.space-y-4)::-webkit-scrollbar {
		width: 6px;
	}
	
	:global(.space-y-4)::-webkit-scrollbar-track {
		background: #1f2937;
		border-radius: 3px;
	}
	
	:global(.space-y-4)::-webkit-scrollbar-thumb {
		background: #4b5563;
		border-radius: 3px;
	}
	
	:global(.space-y-4)::-webkit-scrollbar-thumb:hover {
		background: #6b7280;
	}
</style>
