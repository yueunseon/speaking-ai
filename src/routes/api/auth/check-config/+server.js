import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const config = {
		hasUrl: !!PUBLIC_SUPABASE_URL,
		hasKey: !!PUBLIC_SUPABASE_ANON_KEY,
		urlLength: PUBLIC_SUPABASE_URL?.length || 0,
		keyLength: PUBLIC_SUPABASE_ANON_KEY?.length || 0,
		urlPrefix: PUBLIC_SUPABASE_URL?.substring(0, 20) || '없음',
		keyPrefix: PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || '없음'
	};

	return json(config);
}
