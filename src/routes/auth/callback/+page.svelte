<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/utils/supabase.js';
	import { page } from '$app/stores';
	
	let loading = $state(true);
	let error = $state('');
	let success = $state(false);

	onMount(async () => {
		try {
			// URL에서 토큰 해시 확인 (Supabase는 쿼리 파라미터로 전달)
			const searchParams = new URLSearchParams(window.location.search);
			const tokenHash = searchParams.get('token_hash');
			const type = searchParams.get('type');
			
			// 해시 프래그먼트에서도 확인 (일부 경우)
			const hashParams = new URLSearchParams(window.location.hash.substring(1));
			const tokenHashFromHash = hashParams.get('token_hash');
			const typeFromHash = hashParams.get('type');
			
			const finalTokenHash = tokenHash || tokenHashFromHash;
			const finalType = type || typeFromHash;

			if (finalTokenHash && finalType) {
				// 이메일 확인 처리
				const { data, error: verifyError } = await supabase.auth.verifyOtp({
					token_hash: finalTokenHash,
					type: finalType === 'email' ? 'email' : finalType
				});

				if (verifyError) {
					console.error('이메일 확인 에러:', verifyError);
					error = verifyError.message || '이메일 확인에 실패했습니다.';
					loading = false;
					return;
				}

				if (data.user) {
					success = true;
					// 성공 메시지 표시 후 로그인 페이지로 이동
					setTimeout(() => {
						goto('/login?verified=true');
					}, 2000);
				} else {
					error = '이메일 확인에 실패했습니다.';
					loading = false;
				}
			} else {
				// 토큰이 없으면 현재 세션 확인 (이미 확인된 경우)
				const { data: { session } } = await supabase.auth.getSession();
				if (session?.user) {
					// 이미 로그인되어 있으면 메인 페이지로
					goto('/');
				} else {
					// 토큰이 없고 세션도 없으면 로그인 페이지로
					goto('/login');
				}
			}
		} catch (err) {
			console.error('이메일 확인 에러:', err);
			error = err.message || '이메일 확인 중 오류가 발생했습니다.';
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
	<div class="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
		{#if loading}
			<div class="flex flex-col items-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
				<p class="text-gray-300 text-lg">이메일 확인 중...</p>
			</div>
		{:else if error}
			<div class="text-center">
				<svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<h1 class="text-2xl font-bold text-white mb-2">이메일 확인 실패</h1>
				<p class="text-red-400 mb-6">{error}</p>
				<a
					href="/login"
					class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
				>
					로그인 페이지로 이동
				</a>
			</div>
		{:else if success}
			<div class="text-center">
				<svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<h1 class="text-2xl font-bold text-white mb-2">이메일 확인 완료!</h1>
				<p class="text-gray-300 mb-6">계정이 성공적으로 활성화되었습니다. 로그인 페이지로 이동합니다...</p>
			</div>
		{/if}
	</div>
</div>
