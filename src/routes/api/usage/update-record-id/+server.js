import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		// Authorization 헤더에서 토큰 가져오기
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		
		// 사용자 정보 먼저 확인
		const supabase = createSupabaseServerClient();
		const { data: { user }, error: userError } = await supabase.auth.getUser(token);
		
		if (userError || !user) {
			return json({ error: '인증에 실패했습니다.' }, { status: 401 });
		}

		const { recordId, sessionId, timeRange } = await request.json();

		if (!recordId || !sessionId) {
			return json({ error: 'recordId와 sessionId가 필요합니다.' }, { status: 400 });
		}

		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		// 시간 범위 내의 사용량 로그를 찾아서 record_id 업데이트
		// record_id가 null이고 session_id가 일치하고, 시간 범위 내에 있는 로그를 찾습니다
		const startTime = timeRange?.start || new Date(Date.now() - 60000).toISOString(); // 기본 1분 전
		const endTime = timeRange?.end || new Date().toISOString();

		// 먼저 해당 조건의 로그를 조회
		const queryParams = `user_id=eq.${user.id}&session_id=eq.${sessionId}&record_id=is.null&created_at=gte.${startTime}&created_at=lte.${endTime}&order=created_at.desc&select=id`;
		
		const findResponse = await fetch(
			`${supabaseUrl}/rest/v1/api_usage_logs?${queryParams}`,
			{
				headers: {
					'apikey': supabaseKey,
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Prefer': 'return=representation'
				}
			}
		);
		
		if (!findResponse.ok) {
			const errorText = await findResponse.text();
			console.error('❌ 사용량 로그 조회 실패:', findResponse.status, errorText);
			return json({ error: '사용량 로그 조회에 실패했습니다.' }, { status: findResponse.status });
		}
		
		const logs = await findResponse.json();
		
		if (!logs || logs.length === 0) {
			return json({ error: '업데이트할 사용량 로그를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 찾은 로그들의 record_id를 업데이트
		// Supabase REST API에서는 여러 행을 업데이트하기 위해 각 id에 대해 개별 업데이트하거나
		// 또는 in 연산자를 사용할 수 있습니다
		const logIds = logs.map(log => log.id);
		
		// 각 로그를 개별적으로 업데이트
		const updatePromises = logIds.map(logId => {
			return fetch(
				`${supabaseUrl}/rest/v1/api_usage_logs?id=eq.${logId}`,
				{
					method: 'PATCH',
					headers: {
						'apikey': supabaseKey,
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
						'Prefer': 'return=representation'
					},
					body: JSON.stringify({
						record_id: recordId
					})
				}
			);
		});

		const updateResponses = await Promise.all(updatePromises);
		
		// 모든 업데이트가 성공했는지 확인
		const failedUpdates = updateResponses.filter(res => !res.ok);
		if (failedUpdates.length > 0) {
			const errorText = await failedUpdates[0].text();
			console.error('❌ 일부 사용량 로그 업데이트 실패:', failedUpdates[0].status, errorText);
			return json({ 
				error: '일부 사용량 로그 업데이트에 실패했습니다.',
				successCount: updateResponses.length - failedUpdates.length,
				failedCount: failedUpdates.length
			}, { status: 207 }); // 207 Multi-Status
		}

		const updatedLogs = await updateResponses[0].json();
		
		return json({ 
			success: true,
			updatedCount: Array.isArray(updatedLogs) ? updatedLogs.length : 1
		});
	} catch (error) {
		console.error('사용량 로그 업데이트 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
