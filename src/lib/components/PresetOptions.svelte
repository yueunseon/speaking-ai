<!--src/lib/components/PresetOptions.svelte-->
<script>
	let { promptSettings = $bindable() } = $props();

	const toneOptions = [
		{ value: 'warm', label: '따뜻하고 격려하는', description: '친근하고 격려하는 톤으로 대화합니다' },
		{ value: 'formal', label: '정중하고 격식 있는', description: '정중하고 격식 있는 톤으로 대화합니다' },
		{ value: 'casual', label: '캐주얼하고 편안한', description: '편안하고 캐주얼한 톤으로 대화합니다' },
		{ value: 'friendly', label: '친근하고 활발한', description: '친근하고 활발한 톤으로 대화합니다' }
	];

	const correctionOptions = [
		{ value: 'gently', label: '부드럽게 교정', description: '실수를 부드럽게 지적하고 교정합니다' },
		{ value: 'strictly', label: '엄격하게 교정', description: '실수를 명확하게 지적하고 교정합니다' },
		{ value: 'never', label: '교정하지 않음', description: '실수를 지적하지 않고 자연스럽게 대화합니다' }
	];

	const responseLengthOptions = [
		{ value: 'concise', label: '간결하게', description: '짧고 간결한 응답을 제공합니다' },
		{ value: 'medium', label: '적당하게', description: '적당한 길이의 응답을 제공합니다' },
		{ value: 'detailed', label: '자세하게', description: '자세하고 긴 응답을 제공합니다' }
	];

	const conversationStyleOptions = [
		{ value: 'natural', label: '자연스러운 대화', description: '자연스럽고 자유로운 대화를 이어갑니다' },
		{ value: 'structured', label: '구조화된 대화', description: '주제를 정하고 구조화된 대화를 진행합니다' },
		{ value: 'free-form', label: '자유로운 대화', description: '완전히 자유로운 주제로 대화합니다' }
	];
</script>

<div class="space-y-6">
	<!-- 톤 설정 -->
	<div>
		<label class="block text-white font-semibold mb-3">대화 톤</label>
		<div class="space-y-2">
			{#each toneOptions as option}
				<label class="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors {promptSettings.tone === option.value ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/50'}">
					<input
						type="radio"
						name="tone"
						value={option.value}
						bind:group={promptSettings.tone}
						class="mt-1"
					/>
					<div class="flex-1">
						<div class="text-white font-medium">{option.label}</div>
						<div class="text-gray-400 text-sm mt-1">{option.description}</div>
					</div>
				</label>
			{/each}
		</div>
	</div>

	<!-- 실수 교정 방식 -->
	<div>
		<label class="block text-white font-semibold mb-3">실수 교정 방식</label>
		<div class="space-y-2">
			{#each correctionOptions as option}
				<label class="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors {promptSettings.correctionStyle === option.value ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/50'}">
					<input
						type="radio"
						name="correctionStyle"
						value={option.value}
						bind:group={promptSettings.correctionStyle}
						class="mt-1"
					/>
					<div class="flex-1">
						<div class="text-white font-medium">{option.label}</div>
						<div class="text-gray-400 text-sm mt-1">{option.description}</div>
					</div>
				</label>
			{/each}
		</div>
	</div>

	<!-- 응답 길이 -->
	<div>
		<label class="block text-white font-semibold mb-3">응답 길이</label>
		<div class="space-y-2">
			{#each responseLengthOptions as option}
				<label class="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors {promptSettings.responseLength === option.value ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/50'}">
					<input
						type="radio"
						name="responseLength"
						value={option.value}
						bind:group={promptSettings.responseLength}
						class="mt-1"
					/>
					<div class="flex-1">
						<div class="text-white font-medium">{option.label}</div>
						<div class="text-gray-400 text-sm mt-1">{option.description}</div>
					</div>
				</label>
			{/each}
		</div>
	</div>

	<!-- 대화 스타일 -->
	<div>
		<label class="block text-white font-semibold mb-3">대화 스타일</label>
		<div class="space-y-2">
			{#each conversationStyleOptions as option}
				<label class="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors {promptSettings.conversationStyle === option.value ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700/50'}">
					<input
						type="radio"
						name="conversationStyle"
						value={option.value}
						bind:group={promptSettings.conversationStyle}
						class="mt-1"
					/>
					<div class="flex-1">
						<div class="text-white font-medium">{option.label}</div>
						<div class="text-gray-400 text-sm mt-1">{option.description}</div>
					</div>
				</label>
			{/each}
		</div>
	</div>
</div>
