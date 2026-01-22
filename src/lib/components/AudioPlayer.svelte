<script>
	let { audioUrl, title } = $props();
</script>

{#if audioUrl}
	<div class="border-t border-gray-700 pt-6 mt-6">
		<h2 class="text-xl font-semibold text-white mb-4">{title}</h2>
		<div class="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
			<audio controls src={audioUrl} class="w-full"></audio>
		</div>
	</div>
{/if}
