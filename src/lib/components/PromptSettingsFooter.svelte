<!--src/lib/components/PromptSettingsFooter.svelte-->
<script>
	let { 
		activeTab,
		onReset,
		onSave
	} = $props();
</script>

{#if activeTab === 'settings'}
	<div class="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3">
		<button
			onclick={onReset}
			class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
		>
			기본값으로 초기화
		</button>
		<button
			onclick={onSave}
			class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
		>
			적용
		</button>
	</div>
{/if}
