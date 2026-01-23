-- ============================================
-- user_profiles 테이블 RLS 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- SELECT 정책: 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT 정책: 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "Users can insert their own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책: 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update their own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE 정책: 사용자는 자신의 프로필만 삭제 가능
CREATE POLICY "Users can delete their own profile"
    ON user_profiles
    FOR DELETE
    USING (auth.uid() = user_id);
