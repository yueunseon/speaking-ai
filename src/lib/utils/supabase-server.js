import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// 서버 사이드용 Supabase 클라이언트
export function createSupabaseServerClient() {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error(
			'Supabase 환경 변수가 설정되지 않았습니다.\n' +
			'.env 파일에 다음을 추가하세요:\n' +
			'PUBLIC_SUPABASE_URL=your_supabase_url\n' +
			'PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key'
		);
	}

	return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
