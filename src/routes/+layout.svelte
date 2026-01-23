<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { goto } from '$app/navigation';
	import { user, loading } from '$lib/stores/auth.js';
	import { supabase } from '$lib/utils/supabase.js';

	let { children } = $props();

	async function handleLogout() {
		try {
			// 즉시 store 업데이트하여 UI 반영
			user.set(null);
			
			// Supabase 로그아웃 실행
			const { error } = await supabase.auth.signOut();
			
			if (error) {
				console.error('로그아웃 에러:', error);
			}
			
			// localStorage에서 Supabase 세션 데이터 직접 삭제
			const supabaseKeys = Object.keys(localStorage).filter(key => 
				key.startsWith('sb-') || key.includes('supabase')
			);
			supabaseKeys.forEach(key => localStorage.removeItem(key));
			
			// store 업데이트를 위해 잠시 대기
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// 페이지 전체를 리로드하여 모든 상태 초기화
			window.location.href = '/login';
		} catch (err) {
			console.error('로그아웃 중 오류:', err);
			// 에러 발생해도 store 업데이트 및 로그인 페이지로 이동
			user.set(null);
			window.location.href = '/login';
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !$loading}
	<nav class="bg-gray-800 border-b border-gray-700">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<a href="/" class="text-xl font-bold text-white">
						영어회화 연습
					</a>
				</div>
				<div class="flex items-center gap-4">
					{#if $user}
						<a
							href="/usage"
							class="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
							title="API 사용량 및 요금"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
							사용량
						</a>
						<a
							href="/profile"
							class="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
							title="개인정보 관리"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							프로필
						</a>
						<span class="text-gray-300 text-sm">
							{$user.email}
						</span>
						<button
							onclick={handleLogout}
							class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
						>
							로그아웃
						</button>
					{:else}
						<a
							href="/login"
							class="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
						>
							로그인
						</a>
						<a
							href="/signup"
							class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
						>
							회원가입
						</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>
{/if}

{@render children()}
