-- ============================================
-- 기존 세션 데이터에 prompt_settings 마이그레이션
-- ============================================

-- 방법 1: 각 세션의 첫 번째 record의 prompt_settings를 세션에 복사
-- (세션의 모든 record가 같은 설정을 사용한다고 가정)
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

-- 방법 2: prompt_settings가 없는 세션에 기본값 설정
UPDATE conversation_sessions
SET prompt_settings = '{
  "tone": "warm",
  "correctionStyle": "gently",
  "responseLength": "concise",
  "conversationStyle": "natural"
}'::jsonb
WHERE prompt_settings IS NULL;

-- 마이그레이션 결과 확인
SELECT 
    COUNT(*) as total_sessions,
    COUNT(prompt_settings) as sessions_with_settings,
    COUNT(*) - COUNT(prompt_settings) as sessions_without_settings
FROM conversation_sessions;

-- 샘플 데이터 확인
SELECT 
    id,
    started_at,
    prompt_settings
FROM conversation_sessions
WHERE prompt_settings IS NOT NULL
ORDER BY started_at DESC
LIMIT 10;
