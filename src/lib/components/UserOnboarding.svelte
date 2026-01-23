<!--src/lib/components/UserOnboarding.svelte-->
<script>
	import { session } from '$lib/stores/auth.js';
	import { get } from 'svelte/store';
	
	let { onComplete } = $props();
	
	let name = $state('');
	let phoneNumber = $state('');
	let privacyConsent = $state(false);
	let serviceConsent = $state(false);
	let error = $state('');
	let loading = $state(false);
	let showPrivacyPolicy = $state(false);
	let showServiceTerms = $state(false);

	async function handleSubmit() {
		error = '';
		
		// 입력 검증
		if (!name || !phoneNumber) {
			error = '이름과 전화번호를 모두 입력해주세요.';
			return;
		}

		if (!privacyConsent || !serviceConsent) {
			error = '모든 동의 항목에 동의해주세요.';
			return;
		}

		// 전화번호 형식 검증
		const phoneRegex = /^[0-9\-+() ]+$/;
		if (!phoneRegex.test(phoneNumber)) {
			error = '올바른 전화번호 형식이 아닙니다.';
			return;
		}

		loading = true;

		try {
			const currentSession = get(session);
			if (!currentSession?.access_token) {
				error = '인증이 필요합니다. 다시 로그인해주세요.';
				loading = false;
				return;
			}

			// 프로필 저장
			const profileResponse = await fetch('/api/user/profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${currentSession.access_token}`
				},
				body: JSON.stringify({
					name,
					phone_number: phoneNumber
				})
			});

			if (!profileResponse.ok) {
				const profileError = await profileResponse.json();
				throw new Error(profileError.error || '프로필 저장에 실패했습니다.');
			}

			// 동의 정보 저장
			const consentsResponse = await fetch('/api/user/consents', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${currentSession.access_token}`
				},
				body: JSON.stringify({
					privacy_policy_consent: true,
					service_terms_consent: true
				})
			});

			if (!consentsResponse.ok) {
				const consentsError = await consentsResponse.json();
				throw new Error(consentsError.error || '동의 정보 저장에 실패했습니다.');
			}

			// 완료 콜백 호출
			if (onComplete) {
				onComplete();
			}
		} catch (err) {
			console.error('온보딩 에러:', err);
			error = err.message || '정보 저장 중 오류가 발생했습니다.';
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
	<div class="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
		<h1 class="text-3xl font-bold text-white mb-2 text-center">환영합니다!</h1>
		<p class="text-gray-400 text-center mb-6">서비스 이용을 위해 정보를 입력해주세요</p>

		{#if error}
			<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-300 mb-2">
					이름 *
				</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					required
					placeholder="홍길동"
					class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="phoneNumber" class="block text-sm font-medium text-gray-300 mb-2">
					전화번호 *
				</label>
				<input
					type="tel"
					id="phoneNumber"
					bind:value={phoneNumber}
					required
					placeholder="010-1234-5678"
					class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<p class="mt-1 text-xs text-gray-400">숫자, 하이픈(-), 괄호(), 공백만 입력 가능합니다</p>
			</div>

			<div class="space-y-3 pt-4 border-t border-gray-700">
				<div class="flex items-start gap-3">
					<input
						type="checkbox"
						id="privacyConsent"
						bind:checked={privacyConsent}
						required
						class="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
					/>
					<label for="privacyConsent" class="text-sm text-gray-300 flex-1">
						<span class="font-semibold">개인정보 처리방침</span>에 동의합니다 *
						<button
							type="button"
							onclick={() => showPrivacyPolicy = !showPrivacyPolicy}
							class="text-blue-400 hover:text-blue-300 underline ml-1"
						>
							(보기)
						</button>
					</label>
				</div>

				{#if showPrivacyPolicy}
					<div class="bg-gray-700/50 border border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto text-xs text-gray-300">
						<h3 class="font-semibold mb-2">개인정보 처리방침</h3>
						<p class="mb-2">
							본 서비스는 사용자의 개인정보를 안전하게 보호하기 위해 최선을 다하고 있습니다.
						</p>
						<p class="mb-2">
							수집하는 정보: 이름, 이메일, 전화번호
						</p>
						<p class="mb-2">
							이용 목적: 서비스 제공, 고객 지원, 서비스 개선
						</p>
						<p>
							보유 기간: 회원 탈퇴 시까지
						</p>
					</div>
				{/if}

				<div class="flex items-start gap-3">
					<input
						type="checkbox"
						id="serviceConsent"
						bind:checked={serviceConsent}
						required
						class="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
					/>
					<label for="serviceConsent" class="text-sm text-gray-300 flex-1">
						<span class="font-semibold">서비스 이용약관</span>에 동의합니다 *
						<button
							type="button"
							onclick={() => showServiceTerms = !showServiceTerms}
							class="text-blue-400 hover:text-blue-300 underline ml-1"
						>
							(보기)
						</button>
					</label>
				</div>

				{#if showServiceTerms}
					<div class="bg-gray-700/50 border border-gray-600 rounded-lg p-4 max-h-48 overflow-y-auto text-xs text-gray-300">
						<h3 class="font-semibold mb-2">서비스 이용약관</h3>
						<p class="mb-2">
							본 약관은 영어회화 연습 서비스의 이용에 관한 조건을 규정합니다.
						</p>
						<p class="mb-2">
							서비스 이용 시 다음 사항을 준수해주세요:
						</p>
						<ul class="list-disc list-inside mb-2 space-y-1">
							<li>서비스를 불법적인 목적으로 사용하지 않습니다</li>
							<li>타인의 정보를 도용하지 않습니다</li>
							<li>서비스의 안정성을 해치는 행위를 하지 않습니다</li>
						</ul>
						<p>
							위반 시 서비스 이용이 제한될 수 있습니다.
						</p>
					</div>
				{/if}
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
			>
				{loading ? '저장 중...' : '시작하기'}
			</button>
		</form>
	</div>
</div>
