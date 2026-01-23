<!--src/lib/components/PromptSettingsHeader.svelte-->
<script>
	let { 
		activeTab = $bindable('settings'),
		onClose,
		onTabChange
	} = $props();

	function handleTabClick(tab) {
		activeTab = tab;
		if (onTabChange) {
			onTabChange(tab);
		}
	}
</script>

<div class="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-2xl font-bold text-white">AI 튜터 설정</h2>
		<button
			onclick={onClose}
			class="text-gray-400 hover:text-white transition-colors"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
	<!-- 탭 -->
	<div class="flex gap-2 border-b border-gray-700">
		<button
			onclick={() => handleTabClick('settings')}
			class="px-4 py-2 font-semibold transition-colors {activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}"
		>
			설정
		</button>
		<button
			onclick={() => handleTabClick('saved')}
			class="px-4 py-2 font-semibold transition-colors {activeTab === 'saved' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}"
		>
			저장된 프롬프트
		</button>
	</div>
</div>
