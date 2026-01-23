-- ============================================
-- 과거 대화 기록의 null인 prompt_settings를 기본값으로 업데이트
-- ============================================

-- 기본 프롬프트 설정 (JSONB 형식)
UPDATE conversation_records
SET prompt_settings = '{
  "tone": "warm",
  "correctionStyle": "gently",
  "responseLength": "concise",
  "conversationStyle": "natural"
}'::jsonb
WHERE prompt_settings IS NULL;

-- 업데이트된 레코드 수 확인
SELECT COUNT(*) as updated_count
FROM conversation_records
WHERE prompt_settings IS NOT NULL;

-- 업데이트 결과 확인 (샘플 데이터)
SELECT 
  id,
  created_at,
  prompt_settings
FROM conversation_records
WHERE prompt_settings IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
