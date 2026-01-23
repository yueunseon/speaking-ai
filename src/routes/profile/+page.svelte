<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user, loading, session } from '$lib/stores/auth.js';
	import { get } from 'svelte/store';
	
	let profile = $state(null);
	let consents = $state(null);
	let loadingProfile = $state(true);
	let error = $state('');
	
	// 수정 모드
	let isEditing = $state(false);
	let editName = $state('');
	let editPhoneNumber = $state('');
	let saving = $state(false);
	
	// 약관 보기 상태
	let showPrivacyPolicy = $state(false);
	let showServiceTerms = $state(false);
	
	// 로그인하지 않은 경우 리다이렉트
	$effect(() => {
		if (!$loading && !$user) {
			goto('/login?redirect=/profile');
		}
	});
	
	onMount(async () => {
		if (!$user) return;
		await loadProfileData();
	});
	
	async function loadProfileData() {
		loadingProfile = true;
		error = '';
		
		try {
			const currentSession = get(session);
			if (!currentSession?.access_token) {
				error = '인증이 필요합니다. 다시 로그인해주세요.';
				loadingProfile = false;
				return;
			}
			
			// 프로필 정보 조회
			const profileResponse = await fetch('/api/user/profile', {
				headers: {
					'Authorization': `Bearer ${currentSession.access_token}`
				}
			});
			
			if (!profileResponse.ok) {
				throw new Error('프로필 정보를 불러올 수 없습니다.');
			}
			
			const profileData = await profileResponse.json();
			profile = profileData.profile;
			
			// 동의 정보 조회
			const consentsResponse = await fetch('/api/user/consents', {
				headers: {
					'Authorization': `Bearer ${currentSession.access_token}`
				}
			});
			
			if (!consentsResponse.ok) {
				throw new Error('동의 정보를 불러올 수 없습니다.');
			}
			
			const consentsData = await consentsResponse.json();
			consents = consentsData.consents;
			
			// 수정용 데이터 초기화
			if (profile) {
				editName = profile.name || '';
				editPhoneNumber = profile.phone_number || '';
			}
		} catch (err) {
			console.error('프로필 데이터 로드 에러:', err);
			error = err.message || '정보를 불러오는 중 오류가 발생했습니다.';
		} finally {
			loadingProfile = false;
		}
	}
	
	function startEdit() {
		if (!profile) return;
		editName = profile.name || '';
		editPhoneNumber = profile.phone_number || '';
		isEditing = true;
		error = '';
	}
	
	function cancelEdit() {
		isEditing = false;
		error = '';
		if (profile) {
			editName = profile.name || '';
			editPhoneNumber = profile.phone_number || '';
		}
	}
	
	async function saveProfile() {
		error = '';
		
		// 입력 검증
		if (!editName || !editPhoneNumber) {
			error = '이름과 전화번호를 모두 입력해주세요.';
			return;
		}
		
		// 전화번호 형식 검증
		const phoneRegex = /^[0-9\-+() ]+$/;
		if (!phoneRegex.test(editPhoneNumber)) {
			error = '올바른 전화번호 형식이 아닙니다.';
			return;
		}
		
		saving = true;
		
		try {
			const currentSession = get(session);
			if (!currentSession?.access_token) {
				error = '인증이 필요합니다. 다시 로그인해주세요.';
				saving = false;
				return;
			}
			
			const response = await fetch('/api/user/profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${currentSession.access_token}`
				},
				body: JSON.stringify({
					name: editName,
					phone_number: editPhoneNumber
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || '프로필 저장에 실패했습니다.');
			}
			
			const data = await response.json();
			profile = data.profile;
			isEditing = false;
			
			// 성공 메시지 표시 (선택사항)
			alert('프로필이 성공적으로 저장되었습니다.');
		} catch (err) {
			console.error('프로필 저장 에러:', err);
			error = err.message || '프로필 저장 중 오류가 발생했습니다.';
		} finally {
			saving = false;
		}
	}
	
	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<!-- 헤더 -->
		<div class="mb-6">
			<button
				onclick={() => goto('/')}
				class="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				뒤로 가기
			</button>
			<h1 class="text-3xl font-bold text-white">개인정보 관리</h1>
			<p class="text-gray-400 mt-2">내 정보를 확인하고 수정할 수 있습니다</p>
		</div>

		{#if $loading || loadingProfile}
			<!-- 로딩 중 -->
			<div class="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
				</div>
			</div>
		{:else if error && !profile}
			<!-- 에러 -->
			<div class="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
				<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
					{error}
				</div>
				<button
					onclick={loadProfileData}
					class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
				>
					다시 시도
				</button>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- 계정 정보 -->
				<div class="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
					<h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						계정 정보
					</h2>
					<div class="space-y-3">
						<div>
							<label class="block text-sm font-medium text-gray-400 mb-1">이메일</label>
							<div class="text-white">{$user?.email || '-'}</div>
							<p class="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
						</div>
					</div>
				</div>

				<!-- 프로필 정보 -->
				<div class="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-white flex items-center gap-2">
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							프로필 정보
						</h2>
						{#if !isEditing}
							<button
								onclick={startEdit}
								class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
								수정
							</button>
						{/if}
					</div>

					{#if error}
						<div class="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
							{error}
						</div>
					{/if}

					{#if isEditing}
						<!-- 수정 모드 -->
						<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="space-y-4">
							<div>
								<label for="editName" class="block text-sm font-medium text-gray-300 mb-2">
									이름 *
								</label>
								<input
									type="text"
									id="editName"
									bind:value={editName}
									required
									placeholder="홍길동"
									class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label for="editPhoneNumber" class="block text-sm font-medium text-gray-300 mb-2">
									전화번호 *
								</label>
								<input
									type="tel"
									id="editPhoneNumber"
									bind:value={editPhoneNumber}
									required
									placeholder="010-1234-5678"
									class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								<p class="mt-1 text-xs text-gray-400">숫자, 하이픈(-), 괄호(), 공백만 입력 가능합니다</p>
							</div>

							<div class="flex gap-3 pt-2">
								<button
									type="submit"
									disabled={saving}
									class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
								>
									{saving ? '저장 중...' : '저장'}
								</button>
								<button
									type="button"
									onclick={cancelEdit}
									disabled={saving}
									class="px-6 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200"
								>
									취소
								</button>
							</div>
						</form>
					{:else}
						<!-- 조회 모드 -->
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-400 mb-1">이름</label>
								<div class="text-white text-lg">{profile?.name || '-'}</div>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-400 mb-1">전화번호</label>
								<div class="text-white text-lg">{profile?.phone_number || '-'}</div>
							</div>
							{#if profile?.updated_at}
								<div class="pt-2 border-t border-gray-700">
									<p class="text-xs text-gray-500">최종 수정: {formatDate(profile.updated_at)}</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- 이용동의 정보 -->
				<div class="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
					<h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						이용동의 정보
					</h2>
					<div class="space-y-4">
						<div class="p-4 bg-gray-700/50 rounded-lg">
							<div class="flex items-start gap-3">
								<div class="flex-shrink-0 mt-0.5">
									{#if consents?.privacy_policy_consent}
										<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									{:else}
										<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									{/if}
								</div>
								<div class="flex-1">
									<div class="flex items-center justify-between mb-2">
										<div class="font-medium text-white">개인정보 처리방침</div>
										<button
											type="button"
											onclick={() => showPrivacyPolicy = !showPrivacyPolicy}
											class="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-1"
										>
											{#if showPrivacyPolicy}
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
												</svg>
												숨기기
											{:else}
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
												세부내용 보기
											{/if}
										</button>
									</div>
									<div class="text-sm text-gray-400 mb-1">
										상태: {consents?.privacy_policy_consent ? '동의함' : '동의하지 않음'}
									</div>
									{#if consents?.privacy_policy_consent_at}
										<div class="text-xs text-gray-500">
											동의 일시: {formatDate(consents.privacy_policy_consent_at)}
										</div>
									{/if}
									{#if consents?.privacy_policy_version}
										<div class="text-xs text-gray-500 mt-1">
											동의한 버전: v{consents.privacy_policy_version}
										</div>
									{/if}
								</div>
							</div>
							
							{#if showPrivacyPolicy}
								<div class="mt-4 pt-4 border-t border-gray-600">
									<div class="bg-gray-800/50 border border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto text-sm text-gray-300">
										<h3 class="font-semibold text-white mb-3 text-base">개인정보 처리방침</h3>
										<div class="space-y-3">
											<p>
												본 서비스는 사용자의 개인정보를 안전하게 보호하기 위해 최선을 다하고 있습니다.
											</p>
											<div>
												<p class="font-semibold text-white mb-1">1. 수집하는 정보</p>
												<ul class="list-disc list-inside ml-2 space-y-1">
													<li>이름</li>
													<li>이메일 주소</li>
													<li>전화번호</li>
												</ul>
											</div>
											<div>
												<p class="font-semibold text-white mb-1">2. 이용 목적</p>
												<ul class="list-disc list-inside ml-2 space-y-1">
													<li>서비스 제공 및 운영</li>
													<li>고객 지원 및 문의 응대</li>
													<li>서비스 개선 및 신규 서비스 개발</li>
													<li>이벤트 및 프로모션 안내</li>
												</ul>
											</div>
											<div>
												<p class="font-semibold text-white mb-1">3. 보유 기간</p>
												<p>회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 삭제됩니다.</p>
											</div>
											<div>
												<p class="font-semibold text-white mb-1">4. 개인정보 보호</p>
												<p>개인정보는 암호화되어 저장되며, 안전한 전송 프로토콜을 사용합니다.</p>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<div class="p-4 bg-gray-700/50 rounded-lg">
							<div class="flex items-start gap-3">
								<div class="flex-shrink-0 mt-0.5">
									{#if consents?.service_terms_consent}
										<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									{:else}
										<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									{/if}
								</div>
								<div class="flex-1">
									<div class="flex items-center justify-between mb-2">
										<div class="font-medium text-white">서비스 이용약관</div>
										<button
											type="button"
											onclick={() => showServiceTerms = !showServiceTerms}
											class="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-1"
										>
											{#if showServiceTerms}
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
												</svg>
												숨기기
											{:else}
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
												세부내용 보기
											{/if}
										</button>
									</div>
									<div class="text-sm text-gray-400 mb-1">
										상태: {consents?.service_terms_consent ? '동의함' : '동의하지 않음'}
									</div>
									{#if consents?.service_terms_consent_at}
										<div class="text-xs text-gray-500">
											동의 일시: {formatDate(consents.service_terms_consent_at)}
										</div>
									{/if}
									{#if consents?.service_terms_version}
										<div class="text-xs text-gray-500 mt-1">
											동의한 버전: v{consents.service_terms_version}
										</div>
									{/if}
								</div>
							</div>
							
							{#if showServiceTerms}
								<div class="mt-4 pt-4 border-t border-gray-600">
									<div class="bg-gray-800/50 border border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto text-sm text-gray-300">
										<h3 class="font-semibold text-white mb-3 text-base">서비스 이용약관</h3>
										<div class="space-y-3">
											<p>
												본 약관은 영어회화 연습 서비스의 이용에 관한 조건을 규정합니다.
											</p>
											<div>
												<p class="font-semibold text-white mb-1">1. 서비스 이용</p>
												<p>본 서비스는 영어회화 연습을 위한 AI 튜터 서비스입니다.</p>
											</div>
											<div>
												<p class="font-semibold text-white mb-1">2. 이용자의 의무</p>
												<p>서비스 이용 시 다음 사항을 준수해주세요:</p>
												<ul class="list-disc list-inside ml-2 space-y-1 mt-1">
													<li>서비스를 불법적인 목적으로 사용하지 않습니다</li>
													<li>타인의 정보를 도용하지 않습니다</li>
													<li>서비스의 안정성을 해치는 행위를 하지 않습니다</li>
													<li>타인에게 피해를 주는 콘텐츠를 생성하지 않습니다</li>
													<li>서비스의 기술적 보안 조치를 우회하거나 해킹을 시도하지 않습니다</li>
												</ul>
											</div>
											<div>
												<p class="font-semibold text-white mb-1">3. 서비스 제공 및 변경</p>
												<p>서비스는 지속적으로 개선되며, 사전 고지 없이 변경될 수 있습니다.</p>
											</div>
											<div>
												<p class="font-semibold text-white mb-1">4. 이용 제한</p>
												<p>약관 위반 시 서비스 이용이 제한되거나 계정이 정지될 수 있습니다.</p>
											</div>
											<div>
												<p class="font-semibold text-white mb-1">5. 면책 조항</p>
												<p>서비스 이용 중 발생한 손해에 대해 서비스 제공자는 책임을 지지 않습니다.</p>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>

						{#if consents?.updated_at}
							<div class="pt-2 border-t border-gray-700">
								<p class="text-xs text-gray-500">최종 업데이트: {formatDate(consents.updated_at)}</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
