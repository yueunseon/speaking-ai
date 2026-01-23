<!--src/lib/components/CustomPromptInput.svelte-->
<script>
	let { customPrompt = $bindable('') } = $props();
</script>

<div>
	<label class="block text-white font-semibold mb-3">커스텀 프롬프트</label>
	<div class="space-y-2">
		<textarea
			bind:value={customPrompt}
			placeholder="예: You are a friendly and patient English conversation tutor. Your role is to help users practice English conversation. Provide natural, conversational responses. Gently correct mistakes when appropriate. Encourage users to speak more. Ask follow-up questions to keep the conversation flowing. Speak in a warm, encouraging tone. Keep your responses concise and natural, as if you're having a real conversation."
			class="w-full h-64 p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
		></textarea>
		<div class="text-gray-400 text-xs">
			<p class="mb-1">💡 팁:</p>
			<ul class="list-disc list-inside space-y-1 ml-2">
				<li>AI 튜터의 역할과 행동 방식을 자세히 설명하세요</li>
				<li>응답 스타일, 톤, 교정 방식을 명시할 수 있습니다</li>
				<li>영어로 작성하면 더 정확한 결과를 얻을 수 있습니다</li>
			</ul>
		</div>
	</div>
</div>
