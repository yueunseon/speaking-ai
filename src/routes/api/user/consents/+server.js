import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * 사용자 동의 정보 조회
 */
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

		// Supabase REST API 직접 호출
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		const response = await fetch(
			`${supabaseUrl}/rest/v1/user_consents?user_id=eq.${user.id}&select=*`,
			{
				headers: {
					'apikey': supabaseKey,
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			}
		);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Supabase REST API 에러:', response.status, errorText);
			return json({ error: '동의 정보 조회에 실패했습니다.' }, { status: response.status });
		}
		
		const data = await response.json();
		const consents = Array.isArray(data) && data.length > 0 ? data[0] : null;

		return json({ consents });
	} catch (error) {
		console.error('동의 정보 조회 에러:', error);
		return json({ error: '동의 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
	}
}

/**
 * 사용자 동의 정보 저장/업데이트
 */
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

		const { privacy_policy_consent, service_terms_consent } = await request.json();

		// 입력 검증
		if (typeof privacy_policy_consent !== 'boolean' || typeof service_terms_consent !== 'boolean') {
			return json({ error: '동의 여부를 올바르게 입력해주세요.' }, { status: 400 });
		}

		// 두 동의 모두 true여야 함
		if (!privacy_policy_consent || !service_terms_consent) {
			return json({ error: '모든 동의 항목에 동의해주세요.' }, { status: 400 });
		}

		// 기존 동의 정보 조회
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		const existingResponse = await fetch(
			`${supabaseUrl}/rest/v1/user_consents?user_id=eq.${user.id}&select=*`,
			{
				headers: {
					'apikey': supabaseKey,
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			}
		);
		
		const existingData = existingResponse.ok ? await existingResponse.json() : [];
		const existingConsents = Array.isArray(existingData) && existingData.length > 0 ? existingData[0] : null;

		// 동의 시각 설정 (기존에 동의하지 않았던 경우에만 현재 시각 기록)
		const now = new Date().toISOString();
		const privacy_consent_at = existingConsents?.privacy_policy_consent ? 
			existingConsents.privacy_policy_consent_at : now;
		const service_consent_at = existingConsents?.service_terms_consent ? 
			existingConsents.service_terms_consent_at : now;

		// 동의 정보 저장 또는 업데이트
		const insertData = {
			user_id: user.id,
			privacy_policy_consent: true,
			service_terms_consent: true,
			privacy_policy_consent_at: privacy_consent_at,
			service_terms_consent_at: service_consent_at
		};

		const response = await fetch(
			`${supabaseUrl}/rest/v1/user_consents`,
			{
				method: 'POST',
				headers: {
					'apikey': supabaseKey,
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Prefer': 'resolution=merge-duplicates,return=representation'
				},
				body: JSON.stringify(insertData)
			}
		);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Supabase REST API 에러:', response.status, errorText);
			return json({ error: '동의 정보 저장에 실패했습니다.' }, { status: response.status });
		}
		
		const data = await response.json();
		const consents = Array.isArray(data) && data.length > 0 ? data[0] : data;

		return json({ consents, message: '동의 정보가 저장되었습니다.' });
	} catch (error) {
		console.error('동의 정보 저장 에러:', error);
		return json({ error: '동의 정보 저장 중 오류가 발생했습니다.' }, { status: 500 });
	}
}
