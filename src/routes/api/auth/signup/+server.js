import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/utils/supabase-server.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, url }) {
	try {
		const { email, password, name } = await request.json();
		
		// 현재 사이트의 기본 URL 생성 (이메일 확인 링크 리다이렉트용)
		// 이메일 확인 후 콜백 페이지로 리다이렉트
		// 환경 변수에서 명시적으로 설정된 경우 사용, 없으면 자동 감지
		let origin = url.origin;
		
		// Vercel 배포 시 VERCEL_URL 환경 변수 확인 (선택사항)
		// 프로덕션에서는 url.origin이 자동으로 올바른 URL을 제공합니다
		const redirectTo = `${origin}/auth/callback`;

		// 입력 검증
		if (!email || !password) {
			return json(
				{ error: '이메일과 비밀번호는 필수입니다.' },
				{ status: 400 }
			);
		}

		if (password.length < 6) {
			return json(
				{ error: '비밀번호는 최소 6자 이상이어야 합니다.' },
				{ status: 400 }
			);
		}

		// 서버 사이드 Supabase 클라이언트 생성
		const supabase = createSupabaseServerClient();

		// Supabase 회원가입
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: redirectTo,
				data: {
					name: name || email.split('@')[0]
				}
			}
		});

		if (error) {
			console.error('Supabase 회원가입 에러:', error);
			
			// 이미 존재하는 이메일인 경우 더 명확한 메시지 제공
			let errorMessage = error.message || '회원가입에 실패했습니다.';
			
			if (error.message?.includes('already registered') || 
			    error.message?.includes('already exists') ||
			    error.message?.includes('User already registered')) {
				errorMessage = '이미 가입된 이메일 주소입니다. 로그인 페이지로 이동해주세요.';
			} else if (error.message?.includes('Invalid email')) {
				errorMessage = '유효하지 않은 이메일 주소입니다.';
			}
			
			return json(
				{ error: errorMessage },
				{ status: 400 }
			);
		}

		return json({
			user: data.user,
			message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.'
		});
	} catch (error) {
		console.error('회원가입 에러:', error);
		console.error('에러 상세:', {
			message: error.message,
			stack: error.stack,
			name: error.name
		});
		return json(
			{ error: error.message || '회원가입 중 오류가 발생했습니다.' },
			{ status: 500 }
		);
	}
}
