-- ============================================
-- 사용자 프롬프트 저장 테이블 생성
-- ============================================

-- user_prompts 테이블 생성
CREATE TABLE IF NOT EXISTS user_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prompt_settings JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 사용자별로 이름은 고유해야 함
    CONSTRAINT unique_user_prompt_name UNIQUE (user_id, name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_id ON user_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_id_default ON user_prompts(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_user_prompts_prompt_settings ON user_prompts USING GIN (prompt_settings);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_prompts_updated_at ON user_prompts;
CREATE TRIGGER trigger_update_user_prompts_updated_at
    BEFORE UPDATE ON user_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_prompts_updated_at();

-- 컬럼 설명 추가
COMMENT ON TABLE user_prompts IS '사용자가 저장한 프롬프트 설정';
COMMENT ON COLUMN user_prompts.id IS '프롬프트 ID';
COMMENT ON COLUMN user_prompts.user_id IS '사용자 ID';
COMMENT ON COLUMN user_prompts.name IS '프롬프트 이름';
COMMENT ON COLUMN user_prompts.prompt_settings IS '프롬프트 설정 (JSONB)';
COMMENT ON COLUMN user_prompts.is_default IS '기본 프롬프트 여부';
COMMENT ON COLUMN user_prompts.created_at IS '생성 시간';
COMMENT ON COLUMN user_prompts.updated_at IS '수정 시간';
