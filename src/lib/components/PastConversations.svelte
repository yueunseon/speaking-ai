<script>
	import { onMount } from 'svelte';
	import { getConversationSessions, getConversationRecords } from '$lib/utils/conversations.js';
	import { user } from '$lib/stores/auth.js';
	
	let { isOpen, onClose, onSelectSession } = $props();

	// 프롬프트 설정을 읽기 쉬운 텍스트로 변환
	function formatPromptSettings(settings) {
		if (!settings) return null;

		// 커스텀 프롬프트 모드인 경우
		if (settings.mode === 'custom' && settings.customPrompt) {
			return {
				mode: 'custom',
				customPrompt: settings.customPrompt
			};
		}

		// 프리셋 모드인 경우
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
			mode: 'preset',
			tone: toneLabels[settings.tone] || settings.tone,
			correctionStyle: correctionLabels[settings.correctionStyle] || settings.correctionStyle,
			responseLength: responseLengthLabels[settings.responseLength] || settings.responseLength,
			conversationStyle: conversationStyleLabels[settings.conversationStyle] || settings.conversationStyle
		};
	}

	let sessions = $state([]);
	let selectedSessionId = $state(null);
	let selectedSession = $state(null); // 선택된 세션 정보 저장
	let records = $state([]);
	let loading = $state(false);
	let error = $state('');

	onMount(async () => {
		if (isOpen) {
			await loadSessions();
		}
	});

	$effect(() => {
		if (isOpen) {
			loadSessions();
		}
	});

	async function loadSessions() {
		if (!$user) return;
		
		loading = true;
		error = '';
		
		try {
			const userId = $user.id;
			if (!userId) {
				throw new Error('사용자 ID를 가져올 수 없습니다.');
			}
			sessions = await getConversationSessions(userId);
		} catch (err) {
			console.error('세션 로드 에러:', err);
			error = err.message || '세션을 불러오는데 실패했습니다.';
		} finally {
			loading = false;
		}
	}

	async function loadRecords(sessionId) {
		console.log('📋 loadRecords 호출:', { sessionId });
		loading = true;
		error = '';
		
		try {
			const userId = $user?.id;
			if (!userId) {
				throw new Error('사용자 ID를 가져올 수 없습니다.');
			}
			
			// 선택된 세션 정보 찾기
			selectedSession = sessions.find(s => s.id === sessionId) || null;
			selectedSessionId = sessionId;
			
			console.log('📡 선택된 세션 정보:', {
				sessionId: selectedSession?.id,
				hasPromptSettings: !!selectedSession?.prompt_settings,
				promptSettings: selectedSession?.prompt_settings,
				promptSettingsType: typeof selectedSession?.prompt_settings
			});
			
			console.log('📡 getConversationRecords 호출:', { sessionId, userId });
			records = await getConversationRecords(sessionId, userId);
			console.log('✅ 기록 로드 완료:', { recordCount: records?.length || 0, records });
		} catch (err) {
			console.error('❌ 기록 로드 에러:', err);
			error = err.message || '기록을 불러오는데 실패했습니다.';
		} finally {
			loading = false;
		}
	}

	function handleSelectSession(session) {
		onSelectSession(session);
		onClose();
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
		onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
			<!-- 헤더 -->
			<div class="flex items-center justify-between p-6 border-b border-gray-700">
				<h2 class="text-2xl font-bold text-white">과거 대화 기록</h2>
				<button
					onclick={onClose}
					class="text-gray-400 hover:text-white transition-colors"
					aria-label="닫기"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- 내용 -->
			<div class="flex-1 overflow-hidden flex">
				<!-- 세션 목록 -->
				<div class="w-1/3 border-r border-gray-700 overflow-y-auto bg-gray-900/50">
					<div class="p-4">
						<h3 class="text-sm font-semibold text-gray-400 mb-3">대화 세션</h3>
						{#if loading && sessions.length === 0}
							<div class="flex items-center justify-center py-8">
								<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
							</div>
						{:else if error && sessions.length === 0}
							<div class="text-red-400 text-sm p-4">{error}</div>
						{:else if sessions.length === 0}
							<div class="text-gray-500 text-sm text-center py-8">
								과거 대화 기록이 없습니다.
							</div>
						{:else}
							<div class="space-y-2">
								{#each sessions as session}
									<button
										onclick={() => loadRecords(session.id)}
										class="w-full text-left p-3 rounded-lg transition-colors {selectedSessionId === session.id ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}"
									>
										<div class="font-semibold text-sm mb-1">대화 세션</div>
										<div class="text-xs opacity-75">
											{new Date(session.started_at).toLocaleDateString('ko-KR', {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- 기록 목록 -->
				<div class="flex-1 overflow-y-auto p-6">
					{#if selectedSessionId}
						{#if loading}
							<div class="flex items-center justify-center py-8">
								<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
							</div>
						{:else if error}
							<div class="text-red-400 text-sm">{error}</div>
						{:else if records.length === 0}
							<div class="text-gray-500 text-center py-8">
								이 세션에 기록이 없습니다.
							</div>
						{:else}
							<div class="space-y-4">
								<!-- 세션별 AI 튜터 설정 표시 (세션 헤더에 한 번만) -->
								{#if selectedSession?.prompt_settings}
									{@const sessionSettings = formatPromptSettings(selectedSession.prompt_settings)}
									{@const _ = (() => {
										console.log('🔍 프롬프트 설정 포맷팅:', {
											original: selectedSession.prompt_settings,
											formatted: sessionSettings,
											mode: sessionSettings?.mode
										});
										return null;
									})()}
									<div class="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
										<div class="flex items-center gap-2 mb-3">
											<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
											<span class="text-sm text-yellow-400 font-semibold">이 세션의 AI 튜터 설정</span>
										</div>
										{#if sessionSettings.mode === 'custom'}
											<!-- 커스텀 프롬프트 표시 -->
											<div class="space-y-2">
												<div class="text-xs text-gray-400 mb-2">커스텀 프롬프트 사용</div>
												<div class="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
													{sessionSettings.customPrompt}
												</div>
											</div>
										{:else}
											<!-- 프리셋 옵션 표시 -->
											<div class="grid grid-cols-2 gap-3 text-sm">
												<div class="text-gray-300">
													<span class="text-gray-500">톤:</span> {sessionSettings.tone}
												</div>
												<div class="text-gray-300">
													<span class="text-gray-500">교정:</span> {sessionSettings.correctionStyle}
												</div>
												<div class="text-gray-300">
													<span class="text-gray-500">응답 길이:</span> {sessionSettings.responseLength}
												</div>
												<div class="text-gray-300">
													<span class="text-gray-500">대화 스타일:</span> {sessionSettings.conversationStyle}
												</div>
											</div>
										{/if}
									</div>
								{/if}

								{#each records as record}
									<div class="pb-4 border-b border-gray-700 last:border-b-0 last:pb-0">
										<!-- 사용자 메시지 -->
										{#if record.user_text}
											<div class="mb-2">
												<div class="flex items-start gap-2">
													<div class="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
														<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
														</svg>
													</div>
													<div class="flex-1">
														<div class="text-xs text-blue-400 font-medium mb-1">내가 말한 내용</div>
														<div class="bg-gray-800 rounded-lg p-2 text-gray-300 text-sm whitespace-pre-wrap">
															{record.user_text}
														</div>
													</div>
												</div>
											</div>
										{/if}

										<!-- AI 응답 -->
										{#if record.ai_text}
											<div class="mb-2">
												<div class="flex items-start gap-2">
													<div class="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
														<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
															<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
														</svg>
													</div>
													<div class="flex-1">
														<div class="text-xs text-purple-400 font-medium mb-1">AI 응답</div>
														<div class="bg-gray-800 rounded-lg p-2 text-gray-300 text-sm whitespace-pre-wrap">
															{record.ai_text}
														</div>
													</div>
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					{:else}
						<div class="text-gray-500 text-center py-8">
							왼쪽에서 세션을 선택하세요.
						</div>
					{/if}
				</div>
			</div>

			<!-- 푸터 -->
			<div class="p-6 border-t border-gray-700 flex justify-end gap-3">
				<button
					onclick={onClose}
					class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
				>
					닫기
				</button>
			</div>
		</div>
	</div>
{/if}
