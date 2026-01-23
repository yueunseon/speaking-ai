<!--src/lib/components/DebugPanel.svelte-->
<script>
	let { debugInfo, isOpen } = $props();
</script>

{#if isOpen && debugInfo}
	<div class="border-t border-gray-700 pt-4 mt-4">
		<div class="bg-gray-900 rounded-lg p-4 border border-gray-700">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-lg font-semibold text-yellow-400">🔍 디버그 정보</h3>
				<button
					onclick={() => {
						const text = JSON.stringify(debugInfo, null, 2);
						navigator.clipboard.writeText(text);
					}}
					class="text-xs text-gray-400 hover:text-gray-300"
				>
					복사
				</button>
			</div>

			<div class="space-y-3 text-sm">
				<!-- 요청 정보 -->
				{#if debugInfo.request}
					<div>
						<div class="text-yellow-300 font-semibold mb-1">📤 요청 정보</div>
						<div class="bg-gray-800 rounded p-2 text-gray-300 font-mono text-xs overflow-x-auto">
							<div><strong>URL:</strong> {debugInfo.request.url}</div>
							<div><strong>Method:</strong> {debugInfo.request.method}</div>
							<div><strong>Timestamp:</strong> {debugInfo.request.timestamp}</div>
							{#if debugInfo.request.audioSize}
								<div><strong>Audio Size:</strong> {debugInfo.request.audioSize} bytes</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- 응답 정보 -->
				{#if debugInfo.response}
					<div>
						<div class="text-green-300 font-semibold mb-1">📥 응답 정보</div>
						<div class="bg-gray-800 rounded p-2 text-gray-300 font-mono text-xs overflow-x-auto">
							<div><strong>Status:</strong> {debugInfo.response.status} {debugInfo.response.statusText}</div>
							<div><strong>Timestamp:</strong> {debugInfo.response.timestamp}</div>
							{#if debugInfo.response.duration}
								<div><strong>Duration:</strong> {debugInfo.response.duration}ms</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- 에러 정보 -->
				{#if debugInfo.error}
					<div>
						<div class="text-red-300 font-semibold mb-1">❌ 에러 정보</div>
						<div class="bg-gray-800 rounded p-2 text-red-300 font-mono text-xs overflow-x-auto">
							<div><strong>Message:</strong> {debugInfo.error.message}</div>
							{#if debugInfo.error.name}
								<div><strong>Type:</strong> {debugInfo.error.name}</div>
							{/if}
							{#if debugInfo.error.status}
								<div><strong>Status Code:</strong> {debugInfo.error.status}</div>
							{/if}
							{#if debugInfo.error.details}
								<div class="mt-2">
									<strong>Details:</strong>
									<pre class="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(debugInfo.error.details, null, 2)}</pre>
								</div>
							{/if}
							{#if debugInfo.error.stack}
								<div class="mt-2">
									<strong>Stack:</strong>
									<pre class="mt-1 whitespace-pre-wrap break-words text-xs">{debugInfo.error.stack}</pre>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- 전체 로그 -->
				{#if debugInfo.logs && debugInfo.logs.length > 0}
					<div>
						<div class="text-blue-300 font-semibold mb-1">📋 로그</div>
						<div class="bg-gray-800 rounded p-2 max-h-40 overflow-y-auto">
							{#each debugInfo.logs as log}
								<div class="text-xs text-gray-400 mb-1">
									<span class="text-gray-500">[{log.time}]</span> {log.message}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
