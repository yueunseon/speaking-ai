-- ============================================
-- API 사용량 로그 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own usage logs" ON api_usage_logs;
DROP POLICY IF EXISTS "Users can insert their own usage logs" ON api_usage_logs;

-- 사용자는 자신의 사용량 로그만 조회 가능
CREATE POLICY "Users can view their own usage logs"
ON api_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 사용량 로그만 삽입 가능
CREATE POLICY "Users can insert their own usage logs"
ON api_usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);
