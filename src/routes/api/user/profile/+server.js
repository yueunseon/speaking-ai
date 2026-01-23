import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * 사용자 프로필 조회
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
			`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user.id}&select=*`,
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
			return json({ error: '프로필 조회에 실패했습니다.' }, { status: response.status });
		}
		
		const data = await response.json();
		const profile = Array.isArray(data) && data.length > 0 ? data[0] : null;

		return json({ profile });
	} catch (error) {
		console.error('프로필 조회 에러:', error);
		return json({ error: '프로필 조회 중 오류가 발생했습니다.' }, { status: 500 });
	}
}

/**
 * 사용자 프로필 저장/업데이트
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

		const { name, phone_number } = await request.json();

		// 입력 검증
		if (!name || !phone_number) {
			return json({ error: '이름과 전화번호를 모두 입력해주세요.' }, { status: 400 });
		}

		// 전화번호 형식 검증 (간단한 검증)
		const phoneRegex = /^[0-9\-+() ]+$/;
		if (!phoneRegex.test(phone_number)) {
			return json({ error: '올바른 전화번호 형식이 아닙니다.' }, { status: 400 });
		}

		// Supabase REST API 직접 호출
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		// 기존 프로필 확인
		const checkResponse = await fetch(
			`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user.id}&select=id`,
			{
				headers: {
					'apikey': supabaseKey,
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			}
		);
		
		const existingData = checkResponse.ok ? await checkResponse.json() : [];
		const existingProfile = Array.isArray(existingData) && existingData.length > 0 ? existingData[0] : null;
		
		const updateData = {
			name,
			phone_number
		};
		
		let response;
		
		if (existingProfile) {
			// 기존 프로필이 있으면 PATCH로 업데이트
			response = await fetch(
				`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user.id}`,
				{
					method: 'PATCH',
					headers: {
						'apikey': supabaseKey,
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
						'Prefer': 'return=representation'
					},
					body: JSON.stringify(updateData)
				}
			);
		} else {
			// 기존 프로필이 없으면 POST로 생성
			const insertData = {
				user_id: user.id,
				name,
				phone_number
			};
			
			response = await fetch(
				`${supabaseUrl}/rest/v1/user_profiles`,
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
		}
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Supabase REST API 에러:', response.status, errorText);
			return json({ error: '프로필 저장에 실패했습니다.' }, { status: response.status });
		}
		
		const data = await response.json();
		const profile = Array.isArray(data) && data.length > 0 ? data[0] : data;

		return json({ profile, message: '프로필이 저장되었습니다.' });
	} catch (error) {
		console.error('프로필 저장 에러:', error);
		return json({ error: '프로필 저장 중 오류가 발생했습니다.' }, { status: 500 });
	}
}
