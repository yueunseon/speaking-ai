/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// Supabase는 클라이언트 사이드에서 자동으로 쿠키를 관리하므로
	// 서버 사이드에서는 기본 처리만 수행
	return resolve(event);
}
