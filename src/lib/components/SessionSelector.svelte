<script>
	import { onMount } from 'svelte';
	import { getConversationSessions, createConversationSession } from '$lib/utils/conversations.js';
	import { user } from '$lib/stores/auth.js';
	
	let { isOpen, onClose, onSelectSession, onCreateNew, promptSettings = null } = $props();
	
	let sessions = $state([]);
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

	async function handleCreateNew() {
		loading = true;
		error = '';
		
		try {
			const userId = $user?.id;
			if (!userId) {
				throw new Error('사용자 ID를 가져올 수 없습니다.');
			}
		// 프롬프트 설정을 전달 (메인 페이지에서 설정한 값 사용)
		console.log('📝 SessionSelector: 새 세션 생성', { 
			userId, 
			hasPromptSettings: !!promptSettings,
			promptSettings: promptSettings 
		});
		const newSession = await createConversationSession(null, userId, promptSettings);
			onCreateNew(newSession);
			onClose();
		} catch (err) {
			console.error('세션 생성 에러:', err);
			error = err.message || '새 세션 생성에 실패했습니다.';
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
		<div class="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
			<!-- 헤더 -->
			<div class="flex items-center justify-between p-6 border-b border-gray-700">
				<h2 class="text-xl font-bold text-white">대화 세션 선택</h2>
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
			<div class="p-6">
				{#if error}
					<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
						{error}
					</div>
				{/if}

				<!-- 새 대화 시작 버튼 -->
				<button
					onclick={handleCreateNew}
					disabled={loading}
					class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mb-4 flex items-center justify-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					{loading ? '생성 중...' : '새 대화 시작'}
				</button>

				{#if sessions.length > 0}
					<div class="mb-3">
						<div class="text-sm text-gray-400 mb-2">기존 대화 이어서 하기</div>
						<div class="space-y-2 max-h-64 overflow-y-auto">
							{#each sessions as session}
							<button
								onclick={() => handleSelectSession(session)}
								disabled={loading}
								class="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
							>
								<div class="font-semibold text-sm mb-1">대화 세션</div>
								<div class="text-xs text-gray-400">
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
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
