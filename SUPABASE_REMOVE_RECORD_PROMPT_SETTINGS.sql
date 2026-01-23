-- ============================================
-- conversation_records 테이블에서 prompt_settings 컬럼 제거
-- 세션 레벨에서 프롬프트 설정을 관리하므로 record 레벨에서는 불필요
-- ============================================

-- 1단계: 기존 record의 prompt_settings를 세션으로 마이그레이션 (아직 세션에 없는 경우)
-- 각 세션의 첫 번째 record의 prompt_settings를 세션에 복사
UPDATE conversation_sessions cs
SET prompt_settings = (
    SELECT prompt_settings
    FROM conversation_records cr
    WHERE cr.session_id = cs.id
      AND cr.prompt_settings IS NOT NULL
    ORDER BY cr.created_at ASC
    LIMIT 1
)
WHERE cs.prompt_settings IS NULL
  AND EXISTS (
      SELECT 1
      FROM conversation_records cr
      WHERE cr.session_id = cs.id
        AND cr.prompt_settings IS NOT NULL
  );

-- 2단계: 마이그레이션 확인
SELECT 
    '세션 마이그레이션 확인' as check_type,
    COUNT(*) as total_sessions,
    COUNT(prompt_settings) as sessions_with_settings
FROM conversation_sessions;

-- 3단계: 인덱스 삭제 (있는 경우)
DROP INDEX IF EXISTS idx_conversation_records_prompt_settings;

-- 4단계: 컬럼 삭제
ALTER TABLE conversation_records 
DROP COLUMN IF EXISTS prompt_settings;

-- 5단계: 삭제 확인
SELECT 
    '컬럼 삭제 확인' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'conversation_records'
  AND table_schema = 'public'
ORDER BY ordinal_position;
