<!--src/lib/components/ErrorDisplay.svelte-->
<script>
	let { errorMessage } = $props();
</script>

{#if errorMessage}
	<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
		<div class="font-semibold mb-2">{errorMessage}</div>
		{#if errorMessage.includes('마이크')}
			<div class="text-sm text-red-200/80 mt-2 space-y-1">
				<p><strong>해결 방법:</strong></p>
				<ul class="list-disc list-inside ml-2 space-y-1">
					<li>브라우저 주소창 왼쪽의 자물쇠 아이콘(🔒) 또는 정보 아이콘(ℹ️) 클릭</li>
					<li>"사이트 설정" 또는 "권한" 메뉴 선택</li>
					<li>마이크 권한을 "허용"으로 변경</li>
					<li>페이지를 새로고침하고 다시 시도</li>
				</ul>
				<p class="mt-2 text-xs text-red-200/60">
					💡 HTTPS 연결이 필요할 수 있습니다. localhost는 자동으로 허용됩니다.
				</p>
			</div>
		{/if}
	</div>
{/if}
