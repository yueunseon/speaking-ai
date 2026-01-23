<!--src/lib/components/AIResponse.svelte-->
<script>
	let { text, audioUrl } = $props();
</script>

{#if text || audioUrl}
	<div class="border-t border-gray-700 pt-6 mt-6">
		<h2 class="text-xl font-semibold text-white mb-4">AI 튜터 응답</h2>
		
		{#if text}
			<div class="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
				<p class="text-gray-300 whitespace-pre-wrap">{text}</p>
			</div>
		{/if}

		{#if audioUrl}
			<div class="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
				<audio controls src={audioUrl} class="w-full"></audio>
			</div>
		{/if}
	</div>
{/if}
