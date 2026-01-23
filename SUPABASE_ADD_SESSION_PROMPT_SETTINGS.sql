-- ============================================
-- conversation_sessions 테이블에 prompt_settings 컬럼 추가
-- ============================================

-- prompt_settings 컬럼 추가 (JSONB 타입으로 프롬프트 설정 저장)
ALTER TABLE conversation_sessions 
ADD COLUMN IF NOT EXISTS prompt_settings JSONB;

-- 컬럼 설명 추가
COMMENT ON COLUMN conversation_sessions.prompt_settings IS '세션별 AI 튜터 설정 (톤, 교정 방식, 응답 길이, 대화 스타일)';

-- 인덱스 생성 (선택사항, JSONB 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_prompt_settings 
ON conversation_sessions USING GIN (prompt_settings);
