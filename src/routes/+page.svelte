<script>
	import { onMount } from 'svelte';
	import { AudioRecorder } from '$lib/utils/recording.js';
	import { sendAudioToAI } from '$lib/utils/ai.js';
	import { drawWaveform } from '$lib/utils/waveform.js';
	
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import MicPermissionStatus from '$lib/components/MicPermissionStatus.svelte';
	import MicButton from '$lib/components/MicButton.svelte';
	import RecordingTimer from '$lib/components/RecordingTimer.svelte';
	import Waveform from '$lib/components/Waveform.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import AIResponse from '$lib/components/AIResponse.svelte';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import ConversationHistory from '$lib/components/ConversationHistory.svelte';

	// 상태 관리
	let recorder = null;
	let isRecording = $state(false);
	let recordingTime = $state(0);
	let recordedAudio = $state(null);
	let audioBlob = $state(null);
	let errorMessage = $state('');
	let isProcessing = $state(false);
	let aiResponseText = $state('');
	let aiResponseAudio = $state(null);
	let micPermissionStatus = $state('prompt');
	let waveformCanvas = $state(null);
	let waveformInterval = null;
	let recordingTimerInterval = null;

	onMount(async () => {
		// 마이크 권한 상태 확인
		if (navigator.permissions) {
			try {
				const result = await navigator.permissions.query({ name: 'microphone' });
				micPermissionStatus = result.state;
				result.onchange = () => {
					micPermissionStatus = result.state;
				};
			} catch (e) {
				console.log('Permission query not supported');
			}
		}

		return () => {
			cleanup();
		};
	});

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
		try {
			errorMessage = '';
			recorder = new AudioRecorder();

			const success = await recorder.startRecording(
				() => {
					// 데이터 수집 중
				},
				(blob) => {
					// 녹음 완료
					audioBlob = blob;
					recordedAudio = URL.createObjectURL(blob);
					sendToAI(blob);
				},
				(error) => {
					errorMessage = error.message;
					isRecording = false;
					cleanup();
				}
			);

			if (success) {
				isRecording = true;
				recordingTime = 0;
				recordedAudio = null;
				audioBlob = null;
				aiResponseText = '';
				aiResponseAudio = null;

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
			}
		} catch (error) {
			errorMessage = error.message || '녹음 시작에 실패했습니다.';
			isRecording = false;
		}
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

			aiResponseText = result.text || '';
			
			if (result.audio) {
				aiResponseAudio = URL.createObjectURL(result.audio);
			}

			// 대화 기록에 추가
			if (aiResponseText) {
				addToConversationHistory();
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
		recordedAudio = null;
		audioBlob = null;
		aiResponseText = '';
		aiResponseAudio = null;
		recordingTime = 0;
		errorMessage = '';
		debugInfo = null;
		showDebug = false;
	}

	function addToConversationHistory() {
		if (aiResponseText) {
			const newConversation = {
				timestamp: new Date().toISOString(),
				userAudio: recordedAudio,
				aiText: aiResponseText,
				aiAudio: aiResponseAudio
			};
			
			conversations = [...conversations, newConversation];
			
			// 다음 녹음을 위해 초기화
			resetRecording();
		}
	}

	function clearConversationHistory() {
		conversations = [];
	}

	let debugInfo = $state(null);
	let showDebug = $state(false);
	let conversations = $state([]);
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
	<div class="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700">
		<h1 class="text-3xl font-bold text-white mb-2 text-center">영어회화 연습</h1>
		<p class="text-gray-400 text-center mb-4">영어로 말하고 AI 튜터와 대화해보세요</p>

		<MicPermissionStatus status={micPermissionStatus} />
		<ErrorDisplay errorMessage={errorMessage} />

		<!-- 녹음 버튼 -->
		<div class="flex flex-col items-center mb-8">
			<MicButton 
				isRecording={isRecording}
				onStart={startRecording}
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

		<!-- 녹음된 오디오 재생 -->
		{#if recordedAudio}
			<AudioPlayer audioUrl={recordedAudio} title="내가 녹음한 음성" />
		{/if}

		<!-- AI 응답 -->
		{#if isProcessing}
			<div class="border-t border-gray-700 pt-6 mt-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
					<p class="text-gray-400">AI가 응답을 생성하는 중...</p>
				</div>
			</div>
		{:else if aiResponseText}
			<AIResponse text={aiResponseText} />
		{/if}

		<!-- AI 응답 오디오 -->
		{#if aiResponseAudio}
			<AudioPlayer audioUrl={aiResponseAudio} title="AI 튜터 응답" />
		{/if}

		<!-- 액션 버튼 -->
		{#if recordedAudio || aiResponseText}
			<ActionButtons 
				onReset={resetRecording}
				onRetry={startRecording}
			/>
		{/if}

		<!-- 디버그 패널 -->
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

		<!-- 대화 기록 -->
		{#if conversations.length > 0}
			<ConversationHistory conversations={conversations} />
		{/if}

		<!-- 대화 기록 초기화 버튼 -->
		{#if conversations.length > 0}
			<div class="border-t border-gray-700 pt-4 mt-4">
				<button
					onclick={clearConversationHistory}
					class="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300 text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					대화 기록 모두 삭제
				</button>
			</div>
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
