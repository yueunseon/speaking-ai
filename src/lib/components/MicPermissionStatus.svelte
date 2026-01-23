<!--src/lib/components/MicPermissionStatus.svelte-->
<script>
	let { status } = $props();
</script>

{#if status === 'denied'}
	<div class="bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg mb-6 text-sm text-center">
		⚠️ 마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.
	</div>
{:else if status === 'granted'}
	<div class="bg-green-900/30 border border-green-700 text-green-300 px-4 py-2 rounded-lg mb-6 text-sm text-center">
		✓ 마이크 권한이 허용되었습니다.
	</div>
{/if}
