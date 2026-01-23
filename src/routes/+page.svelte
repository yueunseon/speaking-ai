<script>
	import { onMount } from 'svelte';
	import { AudioRecorder } from '$lib/utils/recording.js';
	import { sendAudioToAI } from '$lib/utils/ai.js';
	import { drawWaveform } from '$lib/utils/waveform.js';
	import { getConversationSessions, createConversationSession, saveConversationRecord, uploadAudioToStorage, getConversationRecords } from '$lib/utils/conversations.js';
	import { user, loading } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { getSeoulTimeISOString } from '$lib/utils/format.js';
	
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import MicPermissionStatus from '$lib/components/MicPermissionStatus.svelte';
	import MicButton from '$lib/components/MicButton.svelte';
	import RecordingTimer from '$lib/components/RecordingTimer.svelte';
	import Waveform from '$lib/components/Waveform.svelte';
	import AIResponse from '$lib/components/AIResponse.svelte';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import ConversationHistory from '$lib/components/ConversationHistory.svelte';
	import PastConversations from '$lib/components/PastConversations.svelte';
	import SessionSelector from '$lib/components/SessionSelector.svelte';

	// 상태 관리
	let recorder = null;
	let isRecording = $state(false);
	let recordingTime = $state(0);
	let audioBlob = $state(null);
	let errorMessage = $state('');
	let isProcessing = $state(false);
	let userText = $state(''); // 사용자가 말한 내용
	let aiResponseText = $state(''); // AI 튜터 응답
	let aiResponseAudioBlob = $state(null); // AI 응답 오디오 Blob (자동 재생용)
	let micPermissionStatus = $state('prompt');
	let waveformCanvas = $state(null);
	let waveformInterval = null;
	let recordingTimerInterval = null;

	// $user 상태 변화 감지하여 자동으로 과거 세션 확인
	$effect(() => {
		const currentUserId = $user?.id;
		if ($user && !$loading && currentUserId && currentUserId !== lastCheckedUserId) {
			// 새로운 사용자이거나 아직 확인하지 않은 경우에만 호출
			checkAttempts = 0; // 새 사용자면 카운터 리셋
			checkPastSessions();
		} else if (!$user && !$loading) {
			hasPastSessions = false;
			lastCheckedUserId = null;
			checkAttempts = 0;
		}
	});

	onMount(async () => {
		if (!$user && !$loading) return;

		if ($user && navigator.permissions) {
			try {
				const result = await navigator.permissions.query({ name: 'microphone' });
				micPermissionStatus = result.state;
				result.onchange = () => { micPermissionStatus = result.state; };
			} catch (e) {
				// Permission query not supported
			}
		}

		// onMount에서는 $effect가 처리하므로 여기서는 호출하지 않음

		return () => cleanup();
	});

	async function checkPastSessions() {
		if (!$user) {
			hasPastSessions = false;
			return;
		}
		if (checkingSessions) {
			return; // 이미 확인 중
		}
		const userId = $user.id;
		if (!userId) {
			hasPastSessions = false;
			return;
		}
		// 호출 횟수 제한 확인
		if (checkAttempts >= MAX_CHECK_ATTEMPTS) {
			console.warn(`⚠️ checkPastSessions: 최대 호출 횟수(${MAX_CHECK_ATTEMPTS}) 초과, 중단`);
			return;
		}
		checkAttempts++;
		checkingSessions = true;
		lastCheckedUserId = userId;
		
		try {
			// 타임아웃 설정
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('세션 조회 타임아웃')), CHECK_TIMEOUT);
			});
			
			const sessionsPromise = getConversationSessions(userId);
			const sessions = await Promise.race([sessionsPromise, timeoutPromise]);
			
			hasPastSessions = Array.isArray(sessions) && sessions.length > 0;
		} catch (e) {
			console.error('❌ checkPastSessions 에러:', e?.message || e);
			hasPastSessions = false;
			// 타임아웃이 아닌 경우에만 재시도 가능 (횟수 제한 내에서)
			if (checkAttempts < MAX_CHECK_ATTEMPTS && e?.message !== '세션 조회 타임아웃') {
				console.log(`🔄 재시도 가능 (${checkAttempts}/${MAX_CHECK_ATTEMPTS})`);
			}
		} finally {
			checkingSessions = false;
		}
	}

	function cleanup() {
		if (recorder) {
			recorder.cleanup();
			recorder = null;
		}
		if (waveformInterval) {
			clearInterval(waveformInterval);
			waveformInterval = null;
		}
		if (recordingTimerInterval) {
			clearInterval(recordingTimerInterval);
			recordingTimerInterval = null;
		}
	}

	async function startRecording() {
		console.log('=== startRecording 호출됨 ===');
		console.log('상태:', { 
			user: $user, 
			userEmail: $user?.email,
			isRecording, 
			currentSessionId, 
			hasPastSessions,
			checkingSessions
		});
		
		try {
			// 로그인 확인
			if (!$user) {
				console.log('❌ 로그인하지 않음, 리다이렉트');
				errorMessage = '로그인이 필요합니다.';
				goto('/login?redirect=/');
				return;
			}

			console.log('✅ 로그인 확인됨, 세션 확인 중...', { currentSessionId, hasPastSessions });

			// 세션이 없고 과거 기록이 있으면 세션 선택 모달 표시
			if (!currentSessionId && hasPastSessions) {
				console.log('📋 세션 선택 모달 표시');
				showSessionSelector = true;
				return;
			}

			// 세션이 없으면 새로 생성 (비동기로 처리, 실패해도 녹음 진행)
			if (!currentSessionId) {
				console.log('🆕 새 세션 생성 시작 (비동기)');
				const userId = $user?.id;
				if (userId) {
					// 세션 생성을 비동기로 처리 (녹음 시작을 막지 않음)
					createConversationSession(null, userId)
						.then((newSession) => {
							if (newSession && newSession.id) {
								currentSessionId = newSession.id;
								console.log('✅ 세션 생성 성공 (비동기):', currentSessionId);
							} else {
								console.warn('⚠️ 세션 생성 결과가 예상과 다름:', newSession);
							}
						})
						.catch((error) => {
							console.error('❌ 세션 생성 에러 (비동기, 녹음은 계속 진행):', error);
							// 세션 생성 실패해도 녹음은 계속 진행
						});
				} else {
					console.warn('⚠️ 사용자 ID가 없어 세션 생성을 건너뜀 (녹음은 계속 진행)');
				}
			}

			console.log('녹음 시작 준비 완료, AudioRecorder 생성');

			errorMessage = '';
			recorder = new AudioRecorder();
			console.log('AudioRecorder 생성 완료, 녹음 시작 시도');

			const success = await recorder.startRecording(
				() => {
					// 데이터 수집 중
					console.log('녹음 데이터 수집 중...');
				},
				(blob) => {
					// 녹음 완료
					console.log('녹음 완료, AI로 전송');
					audioBlob = blob;
					sendToAI(blob);
				},
				(error) => {
					console.error('녹음 에러:', error);
					errorMessage = error.message;
					isRecording = false;
					cleanup();
				}
			);

			console.log('녹음 시작 결과:', success);

			if (success) {
				console.log('녹음 성공, 상태 업데이트');
				isRecording = true;
				recordingTime = 0;
				audioBlob = null;
				userText = '';
				aiResponseText = '';
				aiResponseAudioBlob = null;

				// 녹음 타이머 시작 (1초마다 업데이트)
				recordingTimerInterval = setInterval(() => {
					recordingTime += 1;
				}, 1000);

				// 웨이브폼 업데이트 시작 (100ms마다 업데이트)
				if (waveformCanvas) {
					waveformInterval = setInterval(() => {
						const data = recorder.getWaveformData();
						if (data && waveformCanvas) {
							drawWaveform(waveformCanvas, data);
						}
					}, 100);
				}
			} else {
				console.error('녹음 시작 실패');
				errorMessage = '녹음을 시작할 수 없습니다. 마이크 권한을 확인해주세요.';
			}
		} catch (error) {
			console.error('startRecording 전체 에러:', error);
			errorMessage = error.message || '녹음 시작에 실패했습니다.';
			isRecording = false;
		}
	}

	async function handleSelectSession(session) {
		console.log('세션 선택됨:', session);
		currentSessionId = session.id;
		
		// 과거 기록 불러오기
		try {
			const userId = $user?.id;
			if (userId) {
				console.log('과거 기록 불러오기 시작...');
				const records = await getConversationRecords(session.id, userId);
				console.log('과거 기록 불러오기 완료:', records);
				
				// conversations 배열에 추가 (과거순으로 정렬되어 있음)
				conversations = records.map(record => ({
					timestamp: record.created_at,
					userText: record.user_text || '',
					aiText: record.ai_text || ''
				}));
				
				console.log('conversations 업데이트 완료:', conversations.length, '개 기록');
			}
		} catch (error) {
			console.error('과거 기록 불러오기 실패:', error);
			// 에러가 발생해도 녹음은 계속 진행
		}
		
		// 녹음 시작
		startRecording();
	}

	function handleCreateNewSession(session) {
		currentSessionId = session.id;
		// 녹음 시작
		startRecording();
	}

	function stopRecording() {
		if (recorder && isRecording) {
			recorder.stopRecording();
			isRecording = false;

			// 타이머 및 웨이브폼 업데이트 중지
			if (recordingTimerInterval) {
				clearInterval(recordingTimerInterval);
				recordingTimerInterval = null;
			}
			if (waveformInterval) {
				clearInterval(waveformInterval);
				waveformInterval = null;
			}

			// 웨이브폼 초기화
			if (waveformCanvas) {
				const ctx = waveformCanvas.getContext('2d');
				ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
			}
		}
	}

	async function sendToAI(blob) {
		if (!blob) return;

		isProcessing = true;
		errorMessage = '';

		try {
			const result = await sendAudioToAI(blob, 'webm', (debug) => {
				debugInfo = debug;
				showDebug = true;
			});

			// 사용자 텍스트와 AI 응답 텍스트 저장
			userText = result.userText || '';
			aiResponseText = result.text || '';
			
			// AI 응답 오디오 자동 재생
			if (result.audio) {
				aiResponseAudioBlob = result.audio;
				// 오디오 자동 재생
				const audio = new Audio(URL.createObjectURL(result.audio));
				audio.play().catch(err => {
					console.warn('오디오 자동 재생 실패:', err);
				});
			}

			// 대화 기록에 추가 (userText, aiResponseText 명시 전달)
			const uText = result.userText || '';
			const aText = result.text || '';
			if (aText) {
				await addToConversationHistory(uText, aText, blob, result.audio);
			}
		} catch (error) {
			console.error('AI 통신 실패:', error);
			errorMessage = error.message || 'AI 응답을 받는 중 오류가 발생했습니다.';
			debugInfo = {
				error: {
					message: error.message,
					name: error.name,
					stack: error.stack
				}
			};
			showDebug = true;
		} finally {
			isProcessing = false;
		}
	}

	function resetRecording() {
		audioBlob = null;
		userText = '';
		aiResponseText = '';
		aiResponseAudioBlob = null;
		recordingTime = 0;
		errorMessage = '';
		debugInfo = null;
		showDebug = false;
	}

	async function addToConversationHistory(uText, aText, userBlob, aiBlob) {
		console.log('=== addToConversationHistory 시작 ===', { hasUserText: !!uText, hasAiText: !!aText });
		
		const newConversation = {
			timestamp: getSeoulTimeISOString(),
			userText: uText,
			aiText: aText
		};
		
		if (!aText || !currentSessionId || !$user) {
			console.log('조건 불만족, 로컬 기록에만 추가');
			conversations = [...conversations, newConversation];
			resetRecording();
			return;
		}

		try {
			const userId = $user.id;
			if (!userId) {
				conversations = [...conversations, newConversation];
				resetRecording();
				return;
			}

			console.log('Supabase에 기록 저장 시작...');
			const recordData = {
				session_id: currentSessionId,
				user_audio_url: null,
				user_text: uText,
				ai_text: aText,
				ai_audio_url: null
			};
			
			await saveConversationRecord(recordData, userId);
			console.log('✅ 기록 저장 완료');

			conversations = [...conversations, newConversation];
			console.log('로컬 기록 추가 완료');
		} catch (error) {
			console.error('❌ 기록 저장 에러:', error);
			conversations = [...conversations, newConversation];
		} finally {
			resetRecording();
		}
	}

	function clearConversationHistory() {
		conversations = [];
	}

	// 세션 종료 함수
	async function endSession() {
		console.log('세션 종료:', currentSessionId);
		currentSessionId = null;
		conversations = []; // 현재 세션의 대화 기록도 초기화
		resetRecording();
		
		// 과거 세션 다시 확인 (버튼 활성화를 위해)
		if ($user) {
			await checkPastSessions();
		}
		
		console.log('세션 종료 완료, 다음 녹음 시 새 세션이 생성됩니다.');
	}

	let debugInfo = $state(null);
	let showDebug = $state(false);
	let conversations = $state([]);
	
	// 세션 관리
	let currentSessionId = $state(null);
	let hasPastSessions = $state(false);
	let showSessionSelector = $state(false);
	let showPastConversations = $state(false);
	let checkingSessions = $state(false);
	let lastCheckedUserId = $state(null); // 마지막으로 확인한 userId
	let checkAttempts = $state(0); // 호출 횟수 추적
	const MAX_CHECK_ATTEMPTS = 3; // 최대 호출 횟수
	const CHECK_TIMEOUT = 5000; // 타임아웃 (5초)
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
	<div class="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700">
		<div class="flex items-center justify-between mb-4">
			<div class="flex-1">
				<h1 class="text-3xl font-bold text-white mb-2 text-center">영어회화 연습</h1>
				<p class="text-gray-400 text-center">영어로 말하고 AI 튜터와 대화해보세요</p>
			</div>
			{#if $user}
				<button
					onclick={() => showPastConversations = true}
					disabled={!hasPastSessions || checkingSessions}
					class="ml-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-semibold flex items-center gap-2"
					title={!hasPastSessions ? '과거 기록이 없습니다' : '과거 대화 기록 보기'}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					과거 기록
				</button>
			{/if}
		</div>

		{#if $loading}
			<!-- 로딩 중 -->
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		{:else if !$user}
			<!-- 로그인하지 않은 경우 -->
			<div class="text-center py-12">
				<div class="mb-6">
					<svg class="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<h2 class="text-2xl font-bold text-white mb-2">로그인이 필요합니다</h2>
					<p class="text-gray-400 mb-8">영어회화 연습을 사용하려면 로그인해주세요.</p>
				</div>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/login?redirect=/"
						class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
						</svg>
						로그인
					</a>
					<a
						href="/signup"
						class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
						</svg>
						회원가입
					</a>
				</div>
			</div>
		{:else}
			<!-- 로그인한 경우 - 기존 UI -->
			<MicPermissionStatus status={micPermissionStatus} />
			<ErrorDisplay errorMessage={errorMessage} />

			<!-- 대화 기록 (최상단) -->
			{#if conversations.length > 0}
				<div class="mb-6">
					<ConversationHistory conversations={conversations} />
				</div>
			{/if}

			<!-- 스크립트 (현재 대화) -->
			<!-- 사용자 텍스트 -->
			{#if userText}
				<div class="mb-6">
					<div class="mb-4">
						<div class="text-xs text-gray-400 mb-2">내가 말한 내용</div>
						<div class="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm">
							{userText}
						</div>
					</div>
				</div>
			{/if}

			<!-- AI 응답 -->
			{#if isProcessing}
				<div class="mb-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
						<p class="text-gray-400">AI가 응답을 생성하는 중...</p>
					</div>
				</div>
			{:else if aiResponseText}
				<div class="mb-6">
					<AIResponse text={aiResponseText} />
				</div>
			{/if}

			<!-- 녹음 버튼 -->
			<div class="flex flex-col items-center mb-8">
				<MicButton 
					isRecording={isRecording}
					onStart={() => {
						console.log('MicButton onStart 클릭됨');
						startRecording();
					}}
					onStop={stopRecording}
				/>

				<!-- 녹음 시간 표시 -->
				<RecordingTimer 
					recordingTime={recordingTime}
					isRecording={isRecording}
				/>

				<!-- 웨이브폼 -->
				<Waveform 
					bind:canvas={waveformCanvas}
					isRecording={isRecording}
				/>
			</div>

			<!-- 액션 버튼 -->
			{#if userText || aiResponseText}
				<div class="border-t border-gray-700 pt-6 mt-6">
					<ActionButtons 
						onReset={resetRecording}
						onRetry={startRecording}
					/>
				</div>
			{/if}

			<!-- 세션 종료 버튼 (대화 중 항상 표시, 녹음 중에도 노출) -->
			{#if currentSessionId || conversations.length > 0}
				<div class="border-t border-gray-700 pt-6 mt-6">
					<button
						type="button"
						onclick={async (e) => {
							e.preventDefault();
							e.stopPropagation();
							if (!confirm('대화 세션을 종료하시겠습니까? 다음 녹음 시 새로운 세션이 시작됩니다.')) return;
							if (isRecording) {
								stopRecording();
								await new Promise(r => setTimeout(r, 100));
							}
							endSession();
						}}
						class="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isProcessing}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
						세션 종료
					</button>
					<p class="text-xs text-gray-500 text-center mt-2">
						세션을 종료하면 다음 녹음 시 새로운 대화가 시작됩니다. {#if isRecording}(녹음 중 클릭 시 녹음이 먼저 중지됩니다){/if}
					</p>
				</div>
			{/if}

			<!-- 디버그 패널 (세션 종료 버튼 아래) -->
			{#if debugInfo}
				<div class="border-t border-gray-700 pt-4 mt-4">
					<button
						onclick={() => showDebug = !showDebug}
						class="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						{showDebug ? '디버그 정보 숨기기' : '디버그 정보 보기'}
					</button>
				</div>
			{/if}
			<DebugPanel debugInfo={debugInfo} isOpen={showDebug} />

			<!-- 세션 선택 모달 -->
			<SessionSelector
				isOpen={showSessionSelector}
				onClose={() => showSessionSelector = false}
				onSelectSession={handleSelectSession}
				onCreateNew={handleCreateNewSession}
			/>

			<!-- 과거 대화 기록 모달 -->
			<PastConversations
				isOpen={showPastConversations}
				onClose={() => showPastConversations = false}
				onSelectSession={(session) => {
					currentSessionId = session.id;
					showPastConversations = false;
				}}
			/>
		{/if}
	</div>
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
