-- ============================================
-- 사용자 프로필 테이블 생성
-- ============================================

-- user_profiles 테이블 생성
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 전화번호 형식 검증 (선택사항)
    CONSTRAINT valid_phone_number CHECK (
        phone_number IS NULL OR 
        phone_number ~ '^[0-9\-+() ]+$'
    )
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- 컬럼 설명 추가
COMMENT ON TABLE user_profiles IS '사용자 프로필 정보 (이름, 전화번호)';
COMMENT ON COLUMN user_profiles.id IS '프로필 ID';
COMMENT ON COLUMN user_profiles.user_id IS '사용자 ID (auth.users 참조)';
COMMENT ON COLUMN user_profiles.name IS '사용자 이름';
COMMENT ON COLUMN user_profiles.phone_number IS '전화번호';
COMMENT ON COLUMN user_profiles.created_at IS '생성 시간';
COMMENT ON COLUMN user_profiles.updated_at IS '수정 시간';
