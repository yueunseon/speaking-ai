import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, url }) {
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

		const sessionId = url.searchParams.get('session_id');
		const recordId = url.searchParams.get('record_id');
		const apiType = url.searchParams.get('api_type'); // whisper, chat, tts
		const startDate = url.searchParams.get('start_date');
		const endDate = url.searchParams.get('end_date');

		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		// 쿼리 파라미터 구성
		let queryParams = `user_id=eq.${user.id}`;
		
		if (sessionId) {
			queryParams += `&session_id=eq.${sessionId}`;
		}
		
		if (recordId) {
			queryParams += `&record_id=eq.${recordId}`;
		}
		
		if (apiType) {
			queryParams += `&api_type=eq.${apiType}`;
		}
		
		if (startDate) {
			queryParams += `&created_at=gte.${startDate}`;
		}
		
		if (endDate) {
			queryParams += `&created_at=lte.${endDate}`;
		}
		
		queryParams += `&order=created_at.desc&select=*`;

		// api_usage_logs 조회
		const response = await fetch(
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
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Supabase REST API 에러:', response.status, errorText);
			return json({ error: '사용량 조회에 실패했습니다.' }, { status: response.status });
		}
		
		const logs = await response.json();

		// 통계 계산
		const stats = {
			total: {
				whisper: { count: 0, usage: 0, cost: 0, duration: 0 },
				chat: { count: 0, usage: 0, cost: 0, duration: 0 },
				tts: { count: 0, usage: 0, cost: 0, duration: 0 }
			},
			bySession: {},
			byRecord: {},
			overall: {
				totalCost: 0,
				totalDuration: 0,
				totalCount: logs.length
			}
		};

		logs.forEach(log => {
			const type = log.api_type;
			const cost = parseFloat(log.cost_usd) || 0;
			const duration = parseFloat(log.duration_seconds) || 0;
			const usage = parseFloat(log.usage_amount) || 0;

			// 전체 통계
			if (stats.total[type]) {
				stats.total[type].count += 1;
				stats.total[type].usage += usage;
				stats.total[type].cost += cost;
				stats.total[type].duration += duration;
			}

			// 세션별 통계
			if (log.session_id) {
				if (!stats.bySession[log.session_id]) {
					stats.bySession[log.session_id] = {
						whisper: { count: 0, usage: 0, cost: 0, duration: 0 },
						chat: { count: 0, usage: 0, cost: 0, duration: 0 },
						tts: { count: 0, usage: 0, cost: 0, duration: 0 },
						totalCost: 0,
						totalDuration: 0
					};
				}
				if (stats.bySession[log.session_id][type]) {
					stats.bySession[log.session_id][type].count += 1;
					stats.bySession[log.session_id][type].usage += usage;
					stats.bySession[log.session_id][type].cost += cost;
					stats.bySession[log.session_id][type].duration += duration;
				}
				stats.bySession[log.session_id].totalCost += cost;
				stats.bySession[log.session_id].totalDuration += duration;
			}

			// 기록별 통계
			if (log.record_id) {
				if (!stats.byRecord[log.record_id]) {
					stats.byRecord[log.record_id] = {
						whisper: { count: 0, usage: 0, cost: 0, duration: 0 },
						chat: { count: 0, usage: 0, cost: 0, duration: 0 },
						tts: { count: 0, usage: 0, cost: 0, duration: 0 },
						totalCost: 0,
						totalDuration: 0
					};
				}
				if (stats.byRecord[log.record_id][type]) {
					stats.byRecord[log.record_id][type].count += 1;
					stats.byRecord[log.record_id][type].usage += usage;
					stats.byRecord[log.record_id][type].cost += cost;
					stats.byRecord[log.record_id][type].duration += duration;
				}
				stats.byRecord[log.record_id].totalCost += cost;
				stats.byRecord[log.record_id].totalDuration += duration;
			}

			// 전체 통계
			stats.overall.totalCost += cost;
			stats.overall.totalDuration += duration;
		});

		return json({ 
			logs: logs || [],
			stats: stats
		});
	} catch (error) {
		console.error('사용량 조회 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
