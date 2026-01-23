<!--src/lib/components/PromptModeSelector.svelte-->
<script>
	let { mode = $bindable('preset') } = $props();
</script>

<div>
	<label class="block text-white font-semibold mb-3">프롬프트 모드</label>
	<div class="space-y-2">
		<label class="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors {mode === 'preset' ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/50'}">
			<input
				type="radio"
				name="mode"
				value="preset"
				bind:group={mode}
				class="mt-1"
			/>
			<div class="flex-1">
				<div class="text-white font-medium">프리셋 옵션 사용</div>
				<div class="text-gray-400 text-sm mt-1">미리 정의된 옵션으로 튜터를 설정합니다</div>
			</div>
		</label>
		<label class="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors {mode === 'custom' ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/50'}">
			<input
				type="radio"
				name="mode"
				value="custom"
				bind:group={mode}
				class="mt-1"
			/>
			<div class="flex-1">
				<div class="text-white font-medium">커스텀 프롬프트 사용</div>
				<div class="text-gray-400 text-sm mt-1">직접 프롬프트를 작성하여 튜터를 설정합니다</div>
			</div>
		</label>
	</div>
</div>
