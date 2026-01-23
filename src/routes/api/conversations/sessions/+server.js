import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
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

		// 서버 사이드에서 Supabase REST API 직접 호출
		// RLS 정책이 작동하도록 사용자 토큰을 Authorization 헤더로 전달
		console.log('📡 API: 세션 조회 시작', { userId: user.id });
		
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		// Supabase REST API 직접 호출
		const response = await fetch(
			`${supabaseUrl}/rest/v1/conversation_sessions?user_id=eq.${user.id}&order=started_at.desc&select=*`,
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
			return json({ error: '세션 조회에 실패했습니다.' }, { status: response.status });
		}
		
		const sessions = await response.json();
		
		// 디버깅: 세션의 prompt_settings 확인
		if (sessions && Array.isArray(sessions)) {
			console.log('📋 조회된 세션들:', sessions.map(s => ({
				id: s.id,
				hasPromptSettings: !!s.prompt_settings,
				promptSettings: s.prompt_settings
			})));
		}
		const error = null; // REST API는 error 객체를 반환하지 않음

		console.log('📡 API: Supabase 응답', { 
			hasData: !!sessions, 
			sessionCount: sessions?.length || 0,
			hasError: !!error,
			error: error 
		});

		if (error) {
			console.error('❌ API: 세션 조회 에러:', error);
			return json({ error: '세션 조회에 실패했습니다.', details: error.message }, { status: 500 });
		}

		console.log('✅ API: 세션 조회 성공', { sessionCount: sessions?.length || 0 });
		return json({ sessions: sessions || [] });
	} catch (error) {
		console.error('세션 조회 중 오류:', error);
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

		const { title, prompt_settings } = await request.json();

		console.log('📝 세션 생성 요청 받음:', {
			userId: user.id,
			hasPromptSettings: !!prompt_settings,
			promptSettings: prompt_settings,
			promptSettingsType: typeof prompt_settings,
			promptSettingsStringified: JSON.stringify(prompt_settings)
		});

		// 새 세션 생성 (테이블 컬럼: id, user_id, started_at, prompt_settings)
		// Supabase REST API 직접 호출
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		// 프롬프트 설정이 유효한지 확인 (null이 아니고, 빈 객체가 아니고, 실제 데이터가 있는지)
		let validPromptSettings = null;
		if (prompt_settings) {
			if (typeof prompt_settings === 'object') {
				// 빈 객체가 아니고, 실제로 mode나 다른 필드가 있는지 확인
				const hasData = Object.keys(prompt_settings).length > 0 && (
					prompt_settings.mode || 
					prompt_settings.tone || 
					prompt_settings.customPrompt
				);
				if (hasData) {
					validPromptSettings = prompt_settings;
				}
			} else if (typeof prompt_settings === 'string' && prompt_settings.trim()) {
				// 문자열인 경우도 유효한 것으로 간주
				validPromptSettings = prompt_settings;
			}
		}
		
		const insertData = {
			user_id: user.id,
			started_at: new Date().toISOString(),
			prompt_settings: validPromptSettings
		};

		console.log('📤 DB에 저장할 데이터:', {
			insertData: insertData,
			insertDataStringified: JSON.stringify(insertData),
			promptSettingsType: typeof prompt_settings,
			promptSettingsIsObject: prompt_settings && typeof prompt_settings === 'object',
			validPromptSettings: validPromptSettings
		});
		
		const response = await fetch(
			`${supabaseUrl}/rest/v1/conversation_sessions`,
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
			return json({ error: '세션 생성에 실패했습니다.' }, { status: response.status });
		}
		
		const sessions = await response.json();
		// REST API는 배열을 반환할 수 있으므로 첫 번째 요소 사용
		const session = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : sessions;

		console.log('✅ 세션 생성 완료:', {
			sessionId: session?.id,
			hasPromptSettings: !!session?.prompt_settings,
			promptSettings: session?.prompt_settings
		});

		if (!session || !session.id) {
			console.error('세션 생성: 응답 데이터가 올바르지 않음', sessions);
			return json({ error: '세션 생성에 실패했습니다: 응답 데이터가 올바르지 않습니다.' }, { status: 500 });
		}

		return json({ session });
	} catch (error) {
		console.error('세션 생성 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
