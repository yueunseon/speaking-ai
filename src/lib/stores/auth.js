import { writable } from 'svelte/store';
import { supabase } from '$lib/utils/supabase.js';

export const user = writable(null);
export const loading = writable(true);
export const session = writable(null); // 세션 정보 저장 (access_token 포함)

// 세션 업데이트 함수
async function updateSession() {
	try {
		const { data: { session: currentSession } } = await supabase.auth.getSession();
		session.set(currentSession);
		user.set(currentSession?.user ?? null);
		loading.set(false);
	} catch (error) {
		console.error('세션 업데이트 에러:', error);
		session.set(null);
		user.set(null);
		loading.set(false);
	}
}

// 초기 세션 확인
updateSession();

// 인증 상태 변경 감지
supabase.auth.onAuthStateChange(async (event, newSession) => {
	// INITIAL_SESSION은 앱 시작 시 기존 세션 확인 이벤트 (정상 동작)
	// 세션이 없으면 undefined가 나오는 것이 정상입니다
	if (event === 'INITIAL_SESSION') {
		if (newSession?.user) {
			console.log('기존 세션 발견:', newSession.user.email);
		}
	} else {
		// 다른 이벤트는 로그 출력
		console.log('인증 상태 변경:', event, newSession?.user?.email || '세션 없음');
	}
	
	// 세션 정보 저장 (access_token 포함)
	session.set(newSession);
	
	// SIGNED_OUT 이벤트 처리
	if (event === 'SIGNED_OUT') {
		user.set(null);
		loading.set(false);
		return;
	}
	
	user.set(newSession?.user ?? null);
	loading.set(false);
	
	// SIGNED_IN 이벤트 시 세션을 다시 확인하여 확실하게 업데이트
	if (event === 'SIGNED_IN') {
		await updateSession();
	}
});
