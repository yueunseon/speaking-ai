import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// 클라이언트 사이드용 Supabase 클라이언트
export const supabase = createClient(
	PUBLIC_SUPABASE_URL || '',
	PUBLIC_SUPABASE_ANON_KEY || '',
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true
		}
	}
);
