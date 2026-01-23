<!--src/lib/components/SavedPromptsTab.svelte-->
<script>
	import { getSavedPrompts, deletePrompt } from '$lib/utils/prompts.js';
	import { user } from '$lib/stores/auth.js';

	let { 
		promptSettings,
		onLoadPrompt,
		onShowSaveDialog,
		refreshKey = 0
	} = $props();

	let savedPrompts = $state([]);
	let loadingPrompts = $state(false);
	let error = $state('');

	$effect(() => {
		loadSavedPrompts();
	});

	$effect(() => {
		if (refreshKey > 0) {
			loadSavedPrompts();
		}
	});

	async function loadSavedPrompts() {
		if (!$user) return;
		loadingPrompts = true;
		error = '';
		try {
			savedPrompts = await getSavedPrompts();
		} catch (err) {
			console.error('프롬프트 로드 에러:', err);
			error = err.message || '저장된 프롬프트를 불러오는데 실패했습니다.';
		} finally {
			loadingPrompts = false;
		}
	}

	async function handleLoadPrompt(prompt) {
		if (onLoadPrompt) {
			onLoadPrompt(prompt);
		}
	}

	async function handleDeletePrompt(id) {
		if (!confirm('이 프롬프트를 삭제하시겠습니까?')) {
			return;
		}
		try {
			await deletePrompt(id);
			await loadSavedPrompts();
		} catch (err) {
			console.error('프롬프트 삭제 에러:', err);
			error = err.message || '프롬프트 삭제에 실패했습니다.';
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold text-white">저장된 프롬프트</h3>
		<button
			onclick={onShowSaveDialog}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
		>
			현재 설정 저장
		</button>
	</div>

	{#if error}
		<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
			{error}
		</div>
	{/if}

	{#if loadingPrompts}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
		</div>
	{:else if savedPrompts.length === 0}
		<div class="text-gray-500 text-center py-8">
			저장된 프롬프트가 없습니다.
		</div>
	{:else}
		<div class="space-y-2">
			{#each savedPrompts as prompt}
				<div class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-between">
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<span class="text-white font-semibold">{prompt.name}</span>
							{#if prompt.is_default}
								<span class="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">기본</span>
							{/if}
						</div>
						<div class="text-xs text-gray-400">
							{new Date(prompt.created_at).toLocaleDateString('ko-KR')}
						</div>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => handleLoadPrompt(prompt)}
							class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
						>
							불러오기
						</button>
						<button
							onclick={() => handleDeletePrompt(prompt.id)}
							class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
						>
							삭제
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
