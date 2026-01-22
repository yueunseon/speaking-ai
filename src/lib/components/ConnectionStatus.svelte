<script>
	let { isConnected, isConnecting } = $props();
</script>

<div class="flex items-center justify-center gap-2 mb-4">
	<div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
		{isConnected 
			? 'bg-green-900/30 text-green-300 border border-green-700' 
			: isConnecting 
			? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
			: 'bg-gray-700 text-gray-400 border border-gray-600'
		}">
		<div class="w-2 h-2 rounded-full 
			{isConnected 
				? 'bg-green-500 animate-pulse' 
				: isConnecting 
				? 'bg-yellow-500 animate-pulse'
				: 'bg-gray-500'
			}">
		</div>
		<span>
			{isConnected 
				? 'AI 튜터 연결됨' 
				: isConnecting 
				? '연결 중...'
				: '연결 안 됨'
			}
		</span>
	</div>
</div>
