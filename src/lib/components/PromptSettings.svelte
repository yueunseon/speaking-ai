<!--src/lib/components/PromptSettings.svelte-->
<script>
	import PromptSettingsHeader from './PromptSettingsHeader.svelte';
	import PromptModeSelector from './PromptModeSelector.svelte';
	import PresetOptions from './PresetOptions.svelte';
	import CustomPromptInput from './CustomPromptInput.svelte';
	import SavedPromptsTab from './SavedPromptsTab.svelte';
	import SavePromptDialog from './SavePromptDialog.svelte';
	import PromptSettingsFooter from './PromptSettingsFooter.svelte';
	import { createDefaultPromptSettings, resetPromptSettings } from '$lib/utils/promptSettings.js';

	let { 
		isOpen = $bindable(false),
		promptSettings = $bindable(createDefaultPromptSettings()),
		onSave
	} = $props();

	let activeTab = $state('settings');
	let showSaveDialog = $state(false);
	let refreshKey = $state(0);

	function handleSave() {
		if (onSave) {
			onSave(promptSettings);
		}
		isOpen = false;
	}

	function handleReset() {
		promptSettings = resetPromptSettings();
	}

	function handleLoadPrompt(prompt) {
		promptSettings = { ...prompt.prompt_settings };
		activeTab = 'settings';
	}

	function handleTabChange(tab) {
		if (tab === 'saved') {
			refreshKey++;
		}
	}

	function handleSaveDialogSave() {
		showSaveDialog = false;
		refreshKey++;
		activeTab = 'saved';
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick={() => isOpen = false}>
		<div class="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700" onclick={(e) => e.stopPropagation()}>
			<!-- 헤더 -->
			<PromptSettingsHeader 
				bind:activeTab
				onClose={() => isOpen = false}
				onTabChange={handleTabChange}
			/>

			<!-- 내용 -->
			<div class="p-6 space-y-6">
				{#if activeTab === 'settings'}
					<!-- 프롬프트 모드 선택 -->
					<PromptModeSelector bind:mode={promptSettings.mode} />

					{#if promptSettings.mode === 'preset'}
						<!-- 프리셋 옵션 -->
						<PresetOptions bind:promptSettings={promptSettings} />
					{:else}
						<!-- 커스텀 프롬프트 입력 -->
						<CustomPromptInput bind:customPrompt={promptSettings.customPrompt} />
					{/if}
				{:else if activeTab === 'saved'}
					<!-- 저장된 프롬프트 목록 -->
					<SavedPromptsTab 
						promptSettings={promptSettings}
						onLoadPrompt={handleLoadPrompt}
						onShowSaveDialog={() => showSaveDialog = true}
						refreshKey={refreshKey}
					/>
				{/if}
			</div>

			<!-- 푸터 -->
			<PromptSettingsFooter 
				activeTab={activeTab}
				onReset={handleReset}
				onSave={handleSave}
			/>

			<!-- 프롬프트 저장 다이얼로그 -->
			<SavePromptDialog 
				bind:isOpen={showSaveDialog}
				promptSettings={promptSettings}
				onSave={handleSaveDialogSave}
			/>
		</div>
	</div>
{/if}
