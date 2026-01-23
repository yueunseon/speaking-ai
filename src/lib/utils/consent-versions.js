/**
 * 약관 버전 관리
 * 약관이 변경될 때마다 버전을 업데이트해야 합니다.
 */

// 현재 약관 버전
export const CURRENT_PRIVACY_POLICY_VERSION = '1.0';
export const CURRENT_SERVICE_TERMS_VERSION = '1.0';

/**
 * 약관 버전 확인
 */
export function getCurrentVersions() {
	return {
		privacyPolicy: CURRENT_PRIVACY_POLICY_VERSION,
		serviceTerms: CURRENT_SERVICE_TERMS_VERSION
	};
}
