-- ============================================
-- 사용자 이용동의 테이블 생성
-- ============================================

-- user_consents 테이블 생성
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    privacy_policy_consent BOOLEAN NOT NULL DEFAULT false,
    service_terms_consent BOOLEAN NOT NULL DEFAULT false,
    privacy_policy_consent_at TIMESTAMPTZ,
    service_terms_consent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 사용자별로 하나의 동의 레코드만 허용
    CONSTRAINT unique_user_consent UNIQUE (user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_consents_updated_at ON user_consents;
CREATE TRIGGER trigger_update_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_consents_updated_at();

-- 동의 시각 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_consents_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- 개인정보 동의가 false에서 true로 변경되면 현재 시각 기록
    IF OLD.privacy_policy_consent = false AND NEW.privacy_policy_consent = true THEN
        NEW.privacy_policy_consent_at = NOW();
    END IF;
    
    -- 서비스 이용약관 동의가 false에서 true로 변경되면 현재 시각 기록
    IF OLD.service_terms_consent = false AND NEW.service_terms_consent = true THEN
        NEW.service_terms_consent_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_consents_timestamps ON user_consents;
CREATE TRIGGER trigger_update_user_consents_timestamps
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_consents_timestamps();

-- 컬럼 설명 추가
COMMENT ON TABLE user_consents IS '사용자 이용동의 정보 (개인정보 처리방침, 서비스 이용약관)';
COMMENT ON COLUMN user_consents.id IS '동의 ID';
COMMENT ON COLUMN user_consents.user_id IS '사용자 ID (auth.users 참조)';
COMMENT ON COLUMN user_consents.privacy_policy_consent IS '개인정보 처리방침 동의 여부';
COMMENT ON COLUMN user_consents.service_terms_consent IS '서비스 이용약관 동의 여부';
COMMENT ON COLUMN user_consents.privacy_policy_consent_at IS '개인정보 처리방침 동의 시각';
COMMENT ON COLUMN user_consents.service_terms_consent_at IS '서비스 이용약관 동의 시각';
COMMENT ON COLUMN user_consents.created_at IS '생성 시간';
COMMENT ON COLUMN user_consents.updated_at IS '수정 시간';
