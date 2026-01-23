-- ============================================
-- Supabase RLS 정책 수정/생성 SQL
-- ============================================

-- ============================================
-- conversation_sessions 테이블 정책
-- ============================================

-- RLS 활성화 (이미 활성화되어 있어도 안전)
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view their own sessions" ON conversation_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON conversation_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON conversation_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON conversation_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON conversation_sessions;

-- SELECT 정책 (조회)
CREATE POLICY "Users can view their own sessions"
ON conversation_sessions
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- INSERT 정책 (생성)
CREATE POLICY "Users can insert their own sessions"
ON conversation_sessions
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책 (수정)
CREATE POLICY "Users can update their own sessions"
ON conversation_sessions
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE 정책 (삭제)
CREATE POLICY "Users can delete their own sessions"
ON conversation_sessions
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- ============================================
-- conversation_records 테이블 정책
-- ============================================

-- RLS 활성화 (이미 활성화되어 있어도 안전)
ALTER TABLE conversation_records ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view their own records" ON conversation_records;
DROP POLICY IF EXISTS "Users can insert their own records" ON conversation_records;
DROP POLICY IF EXISTS "Users can update their own records" ON conversation_records;
DROP POLICY IF EXISTS "Users can delete their own records" ON conversation_records;

-- SELECT 정책 (조회)
CREATE POLICY "Users can view their own records"
ON conversation_records
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- INSERT 정책 (생성) - 세션 소유권 확인 포함
CREATE POLICY "Users can insert their own records"
ON conversation_records
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM conversation_sessions
    WHERE id = session_id AND user_id = auth.uid()
  )
);

-- UPDATE 정책 (수정)
CREATE POLICY "Users can update their own records"
ON conversation_records
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE 정책 (삭제)
CREATE POLICY "Users can delete their own records"
ON conversation_records
FOR DELETE
TO public
USING (auth.uid() = user_id);
