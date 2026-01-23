import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
	try {
		const supabase = createSupabaseServerClient();
		
		// 쿠키에서 세션 확인
		const authHeader = request.headers.get('authorization');
		
		if (authHeader) {
			const token = authHeader.replace('Bearer ', '');
			const { data: { user }, error } = await supabase.auth.getUser(token);
			
			if (error || !user) {
				return json({ user: null }, { status: 200 });
			}
			
			return json({ user }, { status: 200 });
		}

		// 세션이 없으면 null 반환
		return json({ user: null }, { status: 200 });
	} catch (error) {
		console.error('세션 확인 에러:', error);
		return json({ user: null }, { status: 200 });
	}
}
