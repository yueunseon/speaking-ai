-- ============================================
-- OpenAI API 사용량 추적 테이블 생성
-- ============================================

-- api_usage_logs 테이블 생성
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    record_id UUID REFERENCES conversation_records(id) ON DELETE SET NULL,
    
    -- API 타입: whisper, chat, tts
    api_type TEXT NOT NULL CHECK (api_type IN ('whisper', 'chat', 'tts')),
    
    -- 사용량 정보
    usage_amount NUMERIC(15, 6) NOT NULL, -- 사용량 (분, 토큰, 문자 등)
    usage_unit TEXT NOT NULL, -- 단위: minutes, tokens, characters
    
    -- 요금 정보
    cost_usd NUMERIC(15, 8) NOT NULL DEFAULT 0, -- USD 기준 요금
    
    -- 시간 정보
    duration_seconds NUMERIC(10, 3), -- API 호출 소요 시간 (초)
    
    -- 추가 메타데이터
    model TEXT, -- 사용된 모델 (whisper-1, gpt-4o-mini, tts-1 등)
    metadata JSONB, -- 추가 정보 (입력 토큰, 출력 토큰 등)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_session_id ON api_usage_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_record_id ON api_usage_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_type ON api_usage_logs(api_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created ON api_usage_logs(user_id, created_at);

-- 컬럼 설명 추가
COMMENT ON TABLE api_usage_logs IS 'OpenAI API 사용량 및 요금 추적 로그';
COMMENT ON COLUMN api_usage_logs.id IS '로그 ID';
COMMENT ON COLUMN api_usage_logs.user_id IS '사용자 ID';
COMMENT ON COLUMN api_usage_logs.session_id IS '대화 세션 ID (선택사항)';
COMMENT ON COLUMN api_usage_logs.record_id IS '대화 기록 ID (선택사항)';
COMMENT ON COLUMN api_usage_logs.api_type IS 'API 타입 (whisper, chat, tts)';
COMMENT ON COLUMN api_usage_logs.usage_amount IS '사용량 (분, 토큰, 문자 등)';
COMMENT ON COLUMN api_usage_logs.usage_unit IS '사용량 단위 (minutes, tokens, characters)';
COMMENT ON COLUMN api_usage_logs.cost_usd IS 'USD 기준 요금';
COMMENT ON COLUMN api_usage_logs.duration_seconds IS 'API 호출 소요 시간 (초)';
COMMENT ON COLUMN api_usage_logs.model IS '사용된 모델';
COMMENT ON COLUMN api_usage_logs.metadata IS '추가 메타데이터 (JSON)';
