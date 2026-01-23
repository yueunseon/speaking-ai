<script>
	import { goto } from '$app/navigation';
	import { user, loading } from '$lib/stores/auth.js';
	import { supabase } from '$lib/utils/supabase.js';
	import { onMount } from 'svelte';
	
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let formLoading = $state(false);
	let hasRedirected = $state(false);
	let showPassword = $state(false);
	let emailVerified = $state(false);

	// URL 파라미터에서 이메일 확인 성공 여부 확인
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('verified') === 'true') {
			emailVerified = true;
			// URL에서 verified 파라미터 제거
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('verified');
			window.history.replaceState({}, '', newUrl);
		}
	});

	// 이미 로그인된 경우 홈으로 리다이렉트
	$effect(() => {
		if ($user && !$loading && !hasRedirected) {
			hasRedirected = true;
			// URL 파라미터에서 redirect 경로 확인
			const urlParams = new URLSearchParams(window.location.search);
			const redirectPath = urlParams.get('redirect') || '/';
			goto(redirectPath, { invalidateAll: true });
		}
	});

	async function handleLogin() {
		error = '';
		formLoading = true;

		if (!email || !password) {
			error = '이메일과 비밀번호를 입력해주세요.';
			formLoading = false;
			return;
		}

		try {
			const { data, error: authError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (authError) {
				error = authError.message;
				formLoading = false;
				return;
			}

			// 로그인 성공 - 명시적으로 리다이렉트
			if (data.session && data.user) {
				formLoading = false;
				
				// URL 파라미터에서 redirect 경로 확인
				const urlParams = new URLSearchParams(window.location.search);
				const redirectPath = urlParams.get('redirect') || '/';
				
				// 즉시 리다이렉트 (store 업데이트는 onAuthStateChange가 처리)
				hasRedirected = true;
				goto(redirectPath, { invalidateAll: true });
			}
		} catch (err) {
			console.error('로그인 에러:', err);
			error = '로그인 중 오류가 발생했습니다.';
			formLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
	<div class="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
		<h1 class="text-3xl font-bold text-white mb-2 text-center">로그인</h1>
		<p class="text-gray-400 text-center mb-6">계정에 로그인하세요</p>

		{#if emailVerified}
			<div class="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4">
				<div class="flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					이메일이 성공적으로 확인되었습니다! 이제 로그인할 수 있습니다.
				</div>
			</div>
		{/if}

		{#if error}
			<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-300 mb-2">
					이메일
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					placeholder="example@email.com"
					class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-300 mb-2">
					비밀번호
				</label>
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						bind:value={password}
						required
						placeholder="비밀번호를 입력하세요"
						class="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<button
						type="button"
						onclick={() => showPassword = !showPassword}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
						aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
					>
						{#if showPassword}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<button
				type="submit"
				disabled={formLoading}
				class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
			>
				{formLoading ? '로그인 중...' : '로그인'}
			</button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-gray-400">
				계정이 없으신가요?
				<a href="/signup" class="text-blue-400 hover:text-blue-300 font-semibold ml-1">
					회원가입
				</a>
			</p>
		</div>
	</div>
</div>
