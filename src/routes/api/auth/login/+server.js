import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { email, password } = await request.json();

		// 입력 검증
		if (!email || !password) {
			return json(
				{ error: '이메일과 비밀번호를 입력해주세요.' },
				{ status: 400 }
			);
		}

		// 서버 사이드 Supabase 클라이언트 생성
		const supabase = createSupabaseServerClient();

		// Supabase 로그인
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return json(
				{ error: error.message },
				{ status: 401 }
			);
		}

		return json({
			user: data.user,
			session: data.session,
			message: '로그인되었습니다.'
		});
	} catch (error) {
		console.error('로그인 에러:', error);
		return json(
			{ error: '로그인 중 오류가 발생했습니다.' },
			{ status: 500 }
		);
	}
}
