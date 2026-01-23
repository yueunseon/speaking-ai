<!--src/lib/components/ApiUsageStats.svelte-->
<script>
	import { formatUsage, formatCost, formatDuration } from '$lib/utils/usage.js';

	let { stats, title = '사용량 통계' } = $props();

	function getApiTypeLabel(type) {
		const labels = {
			whisper: 'Whisper (음성→텍스트)',
			chat: 'Chat (대화 생성)',
			tts: 'TTS (텍스트→음성)'
		};
		return labels[type] || type;
	}

	function getApiTypeUnit(type) {
		const units = {
			whisper: 'minutes',
			chat: 'tokens',
			tts: 'characters'
		};
		return units[type] || '';
	}
</script>

{#if stats}
	<div class="api-usage-stats">
		<h3 class="text-lg font-semibold text-white mb-4">{title}</h3>
		
		<!-- 전체 통계 -->
		<div class="mb-6 p-4 bg-gray-800 rounded-lg">
			<h4 class="text-md font-semibold text-white mb-3">전체 통계</h4>
			<div class="grid grid-cols-3 gap-4">
				<div class="text-center">
					<div class="text-2xl font-bold text-blue-400">{stats.overall?.totalCount || 0}</div>
					<div class="text-sm text-gray-400">총 호출 횟수</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-400">{formatCost(stats.overall?.totalCost || 0)}</div>
					<div class="text-sm text-gray-400">총 요금</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-purple-400">{formatDuration(stats.overall?.totalDuration || 0)}</div>
					<div class="text-sm text-gray-400">총 사용 시간</div>
				</div>
			</div>
		</div>

		<!-- API 타입별 통계 -->
		<div class="space-y-4">
			<h4 class="text-md font-semibold text-white mb-3">API 타입별 통계</h4>
			
			{#each ['whisper', 'chat', 'tts'] as type}
				{#if stats.total?.[type] && stats.total[type].count > 0}
					<div class="p-4 bg-gray-800 rounded-lg">
						<div class="flex items-center justify-between mb-2">
							<h5 class="text-sm font-semibold text-white">{getApiTypeLabel(type)}</h5>
							<span class="text-xs text-gray-400">{stats.total[type].count}회 호출</span>
						</div>
						<div class="grid grid-cols-3 gap-4 mt-3">
							<div>
								<div class="text-lg font-semibold text-blue-300">
									{formatUsage(stats.total[type].usage, getApiTypeUnit(type))}
								</div>
								<div class="text-xs text-gray-400">사용량</div>
							</div>
							<div>
								<div class="text-lg font-semibold text-green-300">
									{formatCost(stats.total[type].cost)}
								</div>
								<div class="text-xs text-gray-400">요금</div>
							</div>
							<div>
								<div class="text-lg font-semibold text-purple-300">
									{formatDuration(stats.total[type].duration)}
								</div>
								<div class="text-xs text-gray-400">사용 시간</div>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style>
	.api-usage-stats {
		color: white;
	}
</style>
