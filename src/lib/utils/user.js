import { get } from 'svelte/store';
import { session } from '$lib/stores/auth.js';

/**
 * 사용자 프로필 조회
 */
export async function getUserProfile() {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			return null;
		}

		const response = await fetch('/api/user/profile', {
			headers: {
				'Authorization': `Bearer ${currentSession.access_token}`
			}
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return data.profile;
	} catch (error) {
		console.error('프로필 조회 에러:', error);
		return null;
	}
}

/**
 * 사용자 동의 정보 조회
 */
export async function getUserConsents() {
	try {
		const currentSession = get(session);
		if (!currentSession?.access_token) {
			return null;
		}

		const response = await fetch('/api/user/consents', {
			headers: {
				'Authorization': `Bearer ${currentSession.access_token}`
			}
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return data.consents;
	} catch (error) {
		console.error('동의 정보 조회 에러:', error);
		return null;
	}
}

/**
 * 사용자가 온보딩을 완료했는지 확인
 */
export async function checkUserOnboarding() {
	try {
		const profile = await getUserProfile();
		const consents = await getUserConsents();

		// 프로필과 동의 정보가 모두 있어야 온보딩 완료
		return !!(profile && consents && 
			consents.privacy_policy_consent && 
			consents.service_terms_consent);
	} catch (error) {
		console.error('온보딩 확인 에러:', error);
		return false;
	}
}
