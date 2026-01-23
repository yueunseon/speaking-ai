<script>
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth.js';
	
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let error = $state('');
	let loading = $state(false);
	let success = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	// 이미 로그인된 경우 홈으로 리다이렉트
	$effect(() => {
		if ($user) {
			goto('/');
		}
	});

	async function handleSignup() {
		error = '';
		success = false;

		// 입력 검증
		if (!email || !password || !confirmPassword) {
			error = '모든 필드를 입력해주세요.';
			return;
		}

		if (password !== confirmPassword) {
			error = '비밀번호가 일치하지 않습니다.';
			return;
		}

		if (password.length < 6) {
			error = '비밀번호는 최소 6자 이상이어야 합니다.';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password, name })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || '회원가입에 실패했습니다.';
				loading = false;
				
				// 이미 가입된 이메일인 경우 로그인 페이지로 안내
				if (data.error?.includes('이미 가입된')) {
					setTimeout(() => {
						goto('/login');
					}, 3000);
				}
				return;
			}

			success = true;
			loading = false;
			// 이메일 확인 안내를 위해 자동 리다이렉트 시간을 늘림
			setTimeout(() => {
				goto('/login');
			}, 5000);
		} catch (err) {
			error = '회원가입 중 오류가 발생했습니다.';
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
	<div class="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
		<h1 class="text-3xl font-bold text-white mb-2 text-center">회원가입</h1>
		<p class="text-gray-400 text-center mb-6">새 계정을 만들어보세요</p>

		{#if error}
			<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="bg-blue-900/30 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg mb-4">
				<div class="flex items-start gap-3">
					<svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					<div class="flex-1">
						<p class="font-semibold mb-2">회원가입이 완료되었습니다!</p>
						<p class="text-sm text-blue-200">
							입력하신 이메일 주소(<span class="font-semibold">{email}</span>)로 확인 링크를 전송했습니다.
						</p>
						<p class="text-sm text-blue-200 mt-2">
							이메일을 확인하여 계정을 활성화해주세요. 확인 후 로그인할 수 있습니다.
						</p>
						<p class="text-xs text-blue-300 mt-2 italic">
							(5초 후 로그인 페이지로 이동합니다)
						</p>
					</div>
				</div>
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSignup(); }} class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-300 mb-2">
					이름 (선택사항)
				</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					placeholder="홍길동"
					class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-300 mb-2">
					이메일 *
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
					비밀번호 *
				</label>
				<div class="relative">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						bind:value={password}
						required
						placeholder="최소 6자 이상"
						class="w-full px-4 py-3 pr-12 bg-gray-700 border {password && password.length < 6 ? 'border-red-500' : password && password.length >= 6 ? 'border-green-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
				{#if password && password.length < 6}
					<p class="mt-2 text-sm text-red-400 flex items-center gap-1">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						비밀번호는 최소 6자 이상이어야 합니다. (현재: {password.length}자)
					</p>
				{/if}
				{#if password && password.length >= 6}
					<p class="mt-2 text-sm text-green-400 flex items-center gap-1">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						비밀번호 기준을 만족합니다. (최소 6자 이상)
					</p>
				{/if}
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
					비밀번호 확인 *
				</label>
				<div class="relative">
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						id="confirmPassword"
						bind:value={confirmPassword}
						required
						placeholder="비밀번호를 다시 입력하세요"
						class="w-full px-4 py-3 pr-12 bg-gray-700 border {confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<button
						type="button"
						onclick={() => showConfirmPassword = !showConfirmPassword}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
						aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
					>
						{#if showConfirmPassword}
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
				{#if confirmPassword && password && password !== confirmPassword}
					<p class="mt-2 text-sm text-red-400 flex items-center gap-1">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						비밀번호가 일치하지 않습니다.
					</p>
				{/if}
				{#if confirmPassword && password && password === confirmPassword}
					<p class="mt-2 text-sm text-green-400 flex items-center gap-1">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						비밀번호가 일치합니다.
					</p>
				{/if}
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
			>
				{loading ? '처리 중...' : '회원가입'}
			</button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-gray-400">
				이미 계정이 있으신가요?
				<a href="/login" class="text-blue-400 hover:text-blue-300 font-semibold ml-1">
					로그인
				</a>
			</p>
		</div>
	</div>
</div>
