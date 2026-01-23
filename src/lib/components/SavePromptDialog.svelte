<!--src/lib/components/SavePromptDialog.svelte-->
<script>
	import { savePrompt } from '$lib/utils/prompts.js';

	let { 
		isOpen = $bindable(false),
		promptSettings,
		onSave
	} = $props();

	let promptName = $state('');
	let savingPrompt = $state(false);
	let error = $state('');

	$effect(() => {
		if (isOpen) {
			promptName = '';
			error = '';
		}
	});

	async function handleSavePrompt() {
		if (!promptName.trim()) {
			error = '프롬프트 이름을 입력해주세요.';
			return;
		}
		savingPrompt = true;
		error = '';
		try {
			await savePrompt(promptName.trim(), promptSettings, false);
			promptName = '';
			isOpen = false;
			if (onSave) {
				onSave();
			}
		} catch (err) {
			console.error('프롬프트 저장 에러:', err);
			error = err.message || '프롬프트 저장에 실패했습니다.';
		} finally {
			savingPrompt = false;
		}
	}

	function handleCancel() {
		isOpen = false;
		promptName = '';
		error = '';
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick={handleCancel}>
		<div class="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-xl font-bold text-white mb-4">프롬프트 저장</h3>
			<div class="space-y-4">
				{#if error}
					<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
						{error}
					</div>
				{/if}
				<div>
					<label class="block text-white font-semibold mb-2">프롬프트 이름</label>
					<input
						type="text"
						bind:value={promptName}
						placeholder="예: 친근한 튜터"
						class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
						onkeydown={(e) => { if (e.key === 'Enter') handleSavePrompt(); }}
					/>
				</div>
				<div class="flex gap-3">
					<button
						onclick={handleCancel}
						class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
					>
						취소
					</button>
					<button
						onclick={handleSavePrompt}
						disabled={savingPrompt || !promptName.trim()}
						class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
					>
						{savingPrompt ? '저장 중...' : '저장'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
