<script>
	import { formatTime } from '$lib/utils/format.js';
	
	let { conversations } = $props();
</script>

{#if conversations && conversations.length > 0}
	<div class="border-t border-gray-700 pt-6 mt-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold text-white">대화 기록</h2>
			<span class="text-sm text-gray-400">{conversations.length}개의 대화</span>
		</div>

		<div class="space-y-4 max-h-96 overflow-y-auto">
			{#each conversations as conversation, index}
				<div class="bg-gray-900 rounded-lg p-4 border border-gray-700">
					<!-- 대화 헤더 -->
					<div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
						<div class="text-xs text-gray-400">
							대화 #{index + 1}
						</div>
						<div class="text-xs text-gray-500">
							{new Date(conversation.timestamp).toLocaleTimeString()}
						</div>
					</div>

					<!-- 사용자 메시지 -->
					<div class="mb-3">
						<div class="flex items-start gap-2">
							<div class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="flex-1">
								<div class="text-xs text-gray-400 mb-1">사용자</div>
								{#if conversation.userAudio}
									<div class="bg-gray-800 rounded-lg p-2">
										<audio controls src={conversation.userAudio} class="w-full h-8"></audio>
									</div>
								{:else}
									<div class="bg-gray-800 rounded-lg p-2 text-gray-300 text-sm">
										(오디오 없음)
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- AI 응답 -->
					<div>
						<div class="flex items-start gap-2">
							<div class="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							</div>
							<div class="flex-1">
								<div class="text-xs text-gray-400 mb-1">AI 튜터</div>
								{#if conversation.aiText}
									<div class="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap">
										{conversation.aiText}
									</div>
								{/if}
								{#if conversation.aiAudio}
									<div class="bg-gray-800 rounded-lg p-2 mt-2">
										<audio controls src={conversation.aiAudio} class="w-full h-8"></audio>
									</div>
								{/if}
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
