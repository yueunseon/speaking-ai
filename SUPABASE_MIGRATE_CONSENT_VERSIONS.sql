-- ============================================
-- user_consents 테이블에 약관 버전 컬럼 추가 및 기존 데이터 마이그레이션
-- ============================================

-- 1단계: 약관 버전 컬럼 추가
ALTER TABLE user_consents 
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT,
ADD COLUMN IF NOT EXISTS service_terms_version TEXT;

-- 2단계: 컬럼 설명 추가
COMMENT ON COLUMN user_consents.privacy_policy_version IS '동의한 개인정보 처리방침 버전';
COMMENT ON COLUMN user_consents.service_terms_version IS '동의한 서비스 이용약관 버전';

-- 3단계: 기존 데이터 마이그레이션
-- 개인정보 처리방침에 동의한 경우 버전 1.0 설정
UPDATE user_consents
SET privacy_policy_version = '1.0'
WHERE privacy_policy_consent = true 
  AND privacy_policy_version IS NULL;

-- 서비스 이용약관에 동의한 경우 버전 1.0 설정
UPDATE user_consents
SET service_terms_version = '1.0'
WHERE service_terms_consent = true 
  AND service_terms_version IS NULL;

-- 4단계: 마이그레이션 결과 확인
SELECT 
    '마이그레이션 결과' as check_type,
    COUNT(*) as total_consents,
    COUNT(privacy_policy_version) as privacy_versions_set,
    COUNT(service_terms_version) as service_versions_set,
    COUNT(CASE WHEN privacy_policy_consent = true AND privacy_policy_version IS NULL THEN 1 END) as privacy_missing_versions,
    COUNT(CASE WHEN service_terms_consent = true AND service_terms_version IS NULL THEN 1 END) as service_missing_versions
FROM user_consents;

-- 5단계: 샘플 데이터 확인 (최대 10개)
SELECT 
    user_id,
    privacy_policy_consent,
    privacy_policy_version,
    service_terms_consent,
    service_terms_version,
    privacy_policy_consent_at,
    service_terms_consent_at
FROM user_consents
ORDER BY created_at DESC
LIMIT 10;
