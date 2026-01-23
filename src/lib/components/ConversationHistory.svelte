<!--src/lib/components/ConversationHistory.svelte-->
<script>
	import { formatUsage, formatCost, formatDuration, formatModelName } from '$lib/utils/usage.js';

	let { conversations } = $props();

	// 프롬프트 설정을 읽기 쉬운 텍스트로 변환
	function formatPromptSettings(settings) {
		if (!settings) return null;

		const toneLabels = {
			warm: '따뜻하고 격려하는',
			formal: '정중하고 격식 있는',
			casual: '캐주얼하고 편안한',
			friendly: '친근하고 활발한'
		};

		const correctionLabels = {
			gently: '부드럽게 교정',
			strictly: '엄격하게 교정',
			never: '교정하지 않음'
		};

		const responseLengthLabels = {
			concise: '간결하게',
			medium: '적당하게',
			detailed: '자세하게'
		};

		const conversationStyleLabels = {
			natural: '자연스러운 대화',
			structured: '구조화된 대화',
			'free-form': '자유로운 대화'
		};

		return {
			tone: toneLabels[settings.tone] || settings.tone,
			correctionStyle: correctionLabels[settings.correctionStyle] || settings.correctionStyle,
			responseLength: responseLengthLabels[settings.responseLength] || settings.responseLength,
			conversationStyle: conversationStyleLabels[settings.conversationStyle] || settings.conversationStyle
		};
	}
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
								<div class="flex items-center justify-between mb-1">
									<div class="text-xs text-blue-400 font-medium">내가 말한 내용</div>
									{#if conversation.usage?.byType?.whisper && conversation.usage.byType.whisper.length > 0}
										{@const whisperLog = conversation.usage.byType.whisper[0]}
										<div class="text-xs text-gray-500 flex items-center gap-1">
											<span>Whisper</span>
											<span class="text-green-400">{formatCost(whisperLog.cost_usd)}</span>
										</div>
									{/if}
								</div>
								<div class="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap">
									{conversation.userText || '(인식된 내용 없음)'}
								</div>
								{#if conversation.usage?.byType?.whisper && conversation.usage.byType.whisper.length > 0}
									{@const whisperLog = conversation.usage.byType.whisper[0]}
									<div class="mt-1 text-xs text-gray-500 flex items-center gap-2">
										<span>사용량: {formatUsage(whisperLog.usage_amount, whisperLog.usage_unit)}</span>
										<span>•</span>
										<span>모델: {formatModelName(whisperLog.model)}</span>
										<span>•</span>
										<span>소요 시간: {formatDuration(whisperLog.duration_seconds || 0)}</span>
									</div>
								{/if}
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
								<div class="flex items-center justify-between mb-1">
									<div class="text-xs text-purple-400 font-medium">AI 응답</div>
									{#if conversation.usage}
										<div class="text-xs text-gray-500 flex items-center gap-1">
											{#if conversation.usage.byType?.chat && conversation.usage.byType.chat.length > 0}
												{@const chatLog = conversation.usage.byType.chat[0]}
												<span>Chat</span>
												<span class="text-green-400">{formatCost(chatLog.cost_usd)}</span>
											{/if}
											{#if conversation.usage.byType?.tts && conversation.usage.byType.tts.length > 0}
												{@const ttsLog = conversation.usage.byType.tts[0]}
												<span>+ TTS</span>
												<span class="text-green-400">{formatCost(ttsLog.cost_usd)}</span>
											{/if}
											{#if conversation.usage.totalCost > 0}
												<span class="text-yellow-400 font-semibold">총 {formatCost(conversation.usage.totalCost)}</span>
											{/if}
										</div>
									{/if}
								</div>
								<div class="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap">
									{conversation.aiText || ''}
								</div>
								{#if conversation.usage}
									<div class="mt-1 space-y-1">
										{#if conversation.usage.byType?.chat && conversation.usage.byType.chat.length > 0}
											{@const chatLog = conversation.usage.byType.chat[0]}
											<div class="text-xs text-gray-500 flex items-center gap-2">
												<span>Chat 사용량: {formatUsage(chatLog.usage_amount, chatLog.usage_unit)}</span>
												<span>•</span>
												<span>모델: {formatModelName(chatLog.model)}</span>
												{#if chatLog.metadata?.inputTokens && chatLog.metadata?.outputTokens}
													<span>•</span>
													<span>(입력: {chatLog.metadata.inputTokens}, 출력: {chatLog.metadata.outputTokens})</span>
												{/if}
												<span>•</span>
												<span>소요 시간: {formatDuration(chatLog.duration_seconds || 0)}</span>
											</div>
										{/if}
										{#if conversation.usage.byType?.tts && conversation.usage.byType.tts.length > 0}
											{@const ttsLog = conversation.usage.byType.tts[0]}
											<div class="text-xs text-gray-500 flex items-center gap-2">
												<span>TTS 사용량: {formatUsage(ttsLog.usage_amount, ttsLog.usage_unit)}</span>
												<span>•</span>
												<span>모델: {formatModelName(ttsLog.model)}</span>
												<span>•</span>
												<span>소요 시간: {formatDuration(ttsLog.duration_seconds || 0)}</span>
											</div>
										{/if}
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
