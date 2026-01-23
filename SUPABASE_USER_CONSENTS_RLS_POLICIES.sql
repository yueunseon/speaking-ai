-- ============================================
-- user_consents 테이블 RLS 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own consents" ON user_consents;
DROP POLICY IF EXISTS "Users can insert their own consents" ON user_consents;
DROP POLICY IF EXISTS "Users can update their own consents" ON user_consents;
DROP POLICY IF EXISTS "Users can delete their own consents" ON user_consents;

-- SELECT 정책: 사용자는 자신의 동의 정보만 조회 가능
CREATE POLICY "Users can view their own consents"
    ON user_consents
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT 정책: 사용자는 자신의 동의 정보만 생성 가능
CREATE POLICY "Users can insert their own consents"
    ON user_consents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책: 사용자는 자신의 동의 정보만 수정 가능
CREATE POLICY "Users can update their own consents"
    ON user_consents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE 정책: 사용자는 자신의 동의 정보만 삭제 가능
CREATE POLICY "Users can delete their own consents"
    ON user_consents
    FOR DELETE
    USING (auth.uid() = user_id);
