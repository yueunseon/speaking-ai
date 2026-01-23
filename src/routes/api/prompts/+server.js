import { json } from '@sveltejs/kit';
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
		
		// 사용자 정보 확인
		const supabase = createSupabaseServerClient();
		const { data: { user }, error: userError } = await supabase.auth.getUser(token);
		
		if (userError || !user) {
			return json({ error: '인증에 실패했습니다.' }, { status: 401 });
		}

		// Supabase REST API 직접 호출
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		const response = await fetch(
			`${supabaseUrl}/rest/v1/user_prompts?user_id=eq.${user.id}&order=created_at.desc&select=*`,
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
			return json({ error: '프롬프트 조회에 실패했습니다.' }, { status: response.status });
		}
		
		const prompts = await response.json();

		return json({ prompts: prompts || [] });
	} catch (error) {
		console.error('프롬프트 조회 중 오류:', error);
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

		const { name, prompt_settings, is_default = false } = await request.json();

		if (!name || !name.trim()) {
			return json({ error: '프롬프트 이름이 필요합니다.' }, { status: 400 });
		}

		if (!prompt_settings) {
			return json({ error: '프롬프트 설정이 필요합니다.' }, { status: 400 });
		}

		// 기본 프롬프트로 설정하는 경우, 기존 기본 프롬프트 해제
		if (is_default) {
			const supabaseUrl = PUBLIC_SUPABASE_URL || '';
			const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
			
			// 기존 기본 프롬프트 해제
			await fetch(
				`${supabaseUrl}/rest/v1/user_prompts?user_id=eq.${user.id}&is_default=eq.true`,
				{
					method: 'PATCH',
					headers: {
						'apikey': supabaseKey,
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
						'Prefer': 'return=representation'
					},
					body: JSON.stringify({ is_default: false })
				}
			);
		}

		// 새 프롬프트 저장
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		const insertData = {
			user_id: user.id,
			name: name.trim(),
			prompt_settings: prompt_settings,
			is_default: is_default
		};
		
		const response = await fetch(
			`${supabaseUrl}/rest/v1/user_prompts`,
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
			return json({ error: '프롬프트 저장에 실패했습니다.' }, { status: response.status });
		}
		
		const prompts = await response.json();
		const prompt = Array.isArray(prompts) && prompts.length > 0 ? prompts[0] : prompts;

		return json({ prompt });
	} catch (error) {
		console.error('프롬프트 저장 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, url }) {
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

		const { id, name, prompt_settings, is_default } = await request.json();

		if (!id) {
			return json({ error: '프롬프트 ID가 필요합니다.' }, { status: 400 });
		}

		// 기본 프롬프트로 설정하는 경우, 기존 기본 프롬프트 해제
		if (is_default) {
			const supabaseUrl = PUBLIC_SUPABASE_URL || '';
			const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
			
			// 기존 기본 프롬프트 해제 (현재 프롬프트 제외)
			await fetch(
				`${supabaseUrl}/rest/v1/user_prompts?user_id=eq.${user.id}&is_default=eq.true&id=neq.${id}`,
				{
					method: 'PATCH',
					headers: {
						'apikey': supabaseKey,
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
						'Prefer': 'return=representation'
					},
					body: JSON.stringify({ is_default: false })
				}
			);
		}

		// 프롬프트 수정
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		const updateData = {};
		if (name !== undefined) updateData.name = name.trim();
		if (prompt_settings !== undefined) updateData.prompt_settings = prompt_settings;
		if (is_default !== undefined) updateData.is_default = is_default;
		
		const response = await fetch(
			`${supabaseUrl}/rest/v1/user_prompts?id=eq.${id}&user_id=eq.${user.id}`,
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
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Supabase REST API 에러:', response.status, errorText);
			return json({ error: '프롬프트 수정에 실패했습니다.' }, { status: response.status });
		}
		
		const prompts = await response.json();
		const prompt = Array.isArray(prompts) && prompts.length > 0 ? prompts[0] : prompts;

		return json({ prompt });
	} catch (error) {
		console.error('프롬프트 수정 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, url }) {
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

		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: '프롬프트 ID가 필요합니다.' }, { status: 400 });
		}

		// 프롬프트 삭제
		const supabaseUrl = PUBLIC_SUPABASE_URL || '';
		const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || '';
		
		const response = await fetch(
			`${supabaseUrl}/rest/v1/user_prompts?id=eq.${id}&user_id=eq.${user.id}`,
			{
				method: 'DELETE',
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
			return json({ error: '프롬프트 삭제에 실패했습니다.' }, { status: response.status });
		}

		return json({ success: true });
	} catch (error) {
		console.error('프롬프트 삭제 중 오류:', error);
		return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
