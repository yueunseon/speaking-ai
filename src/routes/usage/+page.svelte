<!--src/routes/usage/+page.svelte-->
<script>
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth.js';
	import { getApiUsage, formatUsage, formatCost, formatDuration } from '$lib/utils/usage.js';
	import ApiUsageStats from '$lib/components/ApiUsageStats.svelte';
	import { getConversationSessions } from '$lib/utils/conversations.js';

	let loading = true;
	let error = null;
	let usageData = null;
	let sessions = [];
	let selectedSessionId = null;
	let dateRange = {
		start: null,
		end: null
	};

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		if (!$user) {
			error = '로그인이 필요합니다.';
			loading = false;
			return;
		}

		loading = true;
		error = null;

		try {
			// 세션 목록 로드
			const userId = $user.id;
			sessions = await getConversationSessions(userId);

			// 사용량 데이터 로드
			await loadUsage();
		} catch (err) {
			console.error('데이터 로드 실패:', err);
			error = err.message || '데이터를 불러오는데 실패했습니다.';
		} finally {
			loading = false;
		}
	}

	async function loadUsage() {
		try {
			const params = {};
			if (selectedSessionId) {
				params.sessionId = selectedSessionId;
			}
			if (dateRange.start) {
				params.startDate = new Date(dateRange.start).toISOString();
			}
			if (dateRange.end) {
				// 종료일의 끝 시간까지 포함
				const endDate = new Date(dateRange.end);
				endDate.setHours(23, 59, 59, 999);
				params.endDate = endDate.toISOString();
			}

			usageData = await getApiUsage(params);
		} catch (err) {
			console.error('사용량 조회 실패:', err);
			error = err.message || '사용량을 불러오는데 실패했습니다.';
		}
	}

	function handleSessionChange(event) {
		selectedSessionId = event.target.value || null;
		loadUsage();
	}

	function handleDateRangeChange() {
		loadUsage();
	}

	function clearFilters() {
		selectedSessionId = null;
		dateRange = { start: null, end: null };
		loadUsage();
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-white mb-2">API 사용량 및 요금</h1>
		<p class="text-gray-400">OpenAI API 사용량과 요금을 확인할 수 있습니다.</p>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="text-gray-400">로딩 중...</div>
		</div>
	{:else if error}
		<div class="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
			<div class="text-red-200">{error}</div>
		</div>
	{:else if usageData}
		<!-- 필터 -->
		<div class="bg-gray-800 rounded-lg p-4 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">세션 선택</label>
					<select
						value={selectedSessionId || ''}
						onchange={handleSessionChange}
						class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">전체 세션</option>
						{#each sessions as session}
							<option value={session.id}>
								{new Date(session.started_at).toLocaleString('ko-KR')}
							</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">시작 날짜</label>
					<input
						type="date"
						bind:value={dateRange.start}
						onchange={handleDateRangeChange}
						class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">종료 날짜</label>
					<input
						type="date"
						bind:value={dateRange.end}
						onchange={handleDateRangeChange}
						class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>
			<div class="mt-4">
				<button
					onclick={clearFilters}
					class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
				>
					필터 초기화
				</button>
			</div>
		</div>

		<!-- 전체 통계 -->
		<ApiUsageStats stats={usageData.stats} title="전체 사용량 통계" />

		<!-- 세션별 통계 -->
		{#if usageData.stats?.bySession && Object.keys(usageData.stats.bySession).length > 0}
			<div class="mt-8">
				<h2 class="text-2xl font-semibold text-white mb-4">세션별 사용량</h2>
				<div class="space-y-4">
					{#each Object.entries(usageData.stats.bySession) as [sessionId, sessionStats]}
						{@const session = sessions.find(s => s.id === sessionId)}
						<div class="bg-gray-800 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<h3 class="text-md font-semibold text-white">
									{session ? new Date(session.started_at).toLocaleString('ko-KR') : sessionId}
								</h3>
								<div class="text-sm text-gray-400">
									총 {formatCost(sessionStats.totalCost)} | {formatDuration(sessionStats.totalDuration)}
								</div>
							</div>
							<ApiUsageStats stats={{ total: sessionStats, overall: sessionStats }} title="" />
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 상세 로그 -->
		{#if usageData.logs && usageData.logs.length > 0}
			<div class="mt-8">
				<h2 class="text-2xl font-semibold text-white mb-4">상세 로그</h2>
				<div class="bg-gray-800 rounded-lg overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-700">
								<tr>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">시간</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">API 타입</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">모델</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">사용량</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">요금</th>
									<th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">소요 시간</th>
								</tr>
							</thead>
							<tbody>
								{#each usageData.logs as log}
									<tr class="border-t border-gray-700 hover:bg-gray-700/50">
										<td class="px-4 py-3 text-sm text-gray-300">
											{new Date(log.created_at).toLocaleString('ko-KR')}
										</td>
										<td class="px-4 py-3 text-sm text-white">
											{log.api_type === 'whisper' ? 'Whisper' : log.api_type === 'chat' ? 'Chat' : 'TTS'}
										</td>
										<td class="px-4 py-3 text-sm text-gray-300">{log.model || '-'}</td>
										<td class="px-4 py-3 text-sm text-gray-300">
											{formatUsage(log.usage_amount, log.usage_unit)}
										</td>
										<td class="px-4 py-3 text-sm text-green-400">{formatCost(log.cost_usd)}</td>
										<td class="px-4 py-3 text-sm text-gray-300">
											{formatDuration(log.duration_seconds || 0)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{:else}
			<div class="text-center py-12 text-gray-400">
				사용량 데이터가 없습니다.
			</div>
		{/if}
	{/if}
</div>
