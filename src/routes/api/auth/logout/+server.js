import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const supabase = createSupabaseServerClient();
		const { error } = await supabase.auth.signOut();

		if (error) {
			return json(
				{ error: error.message },
				{ status: 400 }
			);
		}

		return json({
			message: '로그아웃되었습니다.'
		});
	} catch (error) {
		console.error('로그아웃 에러:', error);
		return json(
			{ error: '로그아웃 중 오류가 발생했습니다.' },
			{ status: 500 }
		);
	}
}
