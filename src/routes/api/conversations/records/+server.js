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
		if (!sessionId) {
			return json({ error: 'session_id가 필요합니다.' }, { status: 400 });
		}

		// Supabase REST API 직접 호출 (RLS 정책 적용)
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		// conversation_records 조회 (user_id와 session_id로 필터링, created_at 오름차순으로 시간순 정렬)
		const response = await fetch(
			`${supabaseUrl}/rest/v1/conversation_records?user_id=eq.${user.id}&session_id=eq.${sessionId}&order=created_at.asc&select=*`,
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
			return json({ error: '기록 조회에 실패했습니다.' }, { status: response.status });
		}
		
		const records = await response.json();

		return json({ records: records || [] });
	} catch (error) {
		console.error('기록 조회 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const supabase = createSupabaseServerClient();
		
		// Authorization 헤더에서 토큰 가져오기
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader) {
			return json({ error: '인증이 필요합니다.' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		
		// 사용자 정보 가져오기
		const { data: { user }, error: userError } = await supabase.auth.getUser(token);
		
		if (userError || !user) {
			return json({ error: '인증에 실패했습니다.' }, { status: 401 });
		}

		const { session_id, user_audio_url, user_text, ai_text, ai_audio_url } = await request.json();

		if (!session_id) {
			return json({ error: '세션 ID가 필요합니다.' }, { status: 400 });
		}

		// Supabase REST API 직접 호출 (RLS 정책 적용)
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		const insertData = {
			user_id: user.id,
			session_id: session_id,
			user_audio_url: user_audio_url || null,
			user_text: user_text || null,
			ai_text: ai_text || null,
			ai_audio_url: ai_audio_url || null
		};
		
		console.log('📡 API: 기록 저장 시작', { sessionId: session_id, hasUserText: !!user_text, hasAiText: !!ai_text });
		
		const response = await fetch(
			`${supabaseUrl}/rest/v1/conversation_records`,
			{
				method: 'POST',
				headers: {
					'apikey': supabaseKey,
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Prefer': 'return=representation'
				},
				body: JSON.stringify(insertData)
			}
		);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Supabase REST API 에러:', response.status, errorText);
			return json({ error: '기록 저장에 실패했습니다.' }, { status: response.status });
		}
		
		const records = await response.json();
		// REST API는 배열을 반환할 수 있으므로 첫 번째 요소 사용
		const record = Array.isArray(records) && records.length > 0 ? records[0] : records;
		
		console.log('✅ API: 기록 저장 성공', record);
		return json({ record });
	} catch (error) {
		console.error('기록 저장 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
