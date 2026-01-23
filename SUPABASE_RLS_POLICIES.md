# Supabase RLS (Row Level Security) 정책 설정 가이드

## 필요한 테이블

### 1. `conversation_sessions` 테이블

**필수 컬럼:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `title` (TEXT)
- `created_at` (TIMESTAMP, default: now())
- `updated_at` (TIMESTAMP, default: now())

**필요한 RLS 정책:**

#### 1.1 SELECT 정책 (조회)
```sql
-- 사용자는 자신의 세션만 조회 가능
CREATE POLICY "Users can view their own sessions"
ON conversation_sessions
FOR SELECT
USING (auth.uid() = user_id);
```

#### 1.2 INSERT 정책 (생성)
```sql
-- 사용자는 자신의 세션만 생성 가능
CREATE POLICY "Users can insert their own sessions"
ON conversation_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 1.3 UPDATE 정책 (수정)
```sql
-- 사용자는 자신의 세션만 수정 가능
CREATE POLICY "Users can update their own sessions"
ON conversation_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 1.4 DELETE 정책 (삭제)
```sql
-- 사용자는 자신의 세션만 삭제 가능
CREATE POLICY "Users can delete their own sessions"
ON conversation_sessions
FOR DELETE
USING (auth.uid() = user_id);
```

---

### 2. `conversation_records` 테이블

**필수 컬럼:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `session_id` (UUID, Foreign Key to conversation_sessions.id)
- `user_audio_url` (TEXT, nullable)
- `user_text` (TEXT, nullable)
- `ai_text` (TEXT, nullable)
- `ai_audio_url` (TEXT, nullable)
- `created_at` (TIMESTAMP, default: now())

**필요한 RLS 정책:**

#### 2.1 SELECT 정책 (조회)
```sql
-- 사용자는 자신의 기록만 조회 가능
CREATE POLICY "Users can view their own records"
ON conversation_records
FOR SELECT
USING (auth.uid() = user_id);
```

#### 2.2 INSERT 정책 (생성)
```sql
-- 사용자는 자신의 기록만 생성 가능
-- session_id가 사용자의 세션인지도 확인
CREATE POLICY "Users can insert their own records"
ON conversation_records
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM conversation_sessions
    WHERE id = session_id AND user_id = auth.uid()
  )
);
```

#### 2.3 UPDATE 정책 (수정)
```sql
-- 사용자는 자신의 기록만 수정 가능
CREATE POLICY "Users can update their own records"
ON conversation_records
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 2.4 DELETE 정책 (삭제)
```sql
-- 사용자는 자신의 기록만 삭제 가능
CREATE POLICY "Users can delete their own records"
ON conversation_records
FOR DELETE
USING (auth.uid() = user_id);
```

---

## 전체 SQL 스크립트

Supabase SQL Editor에서 다음 스크립트를 실행하세요:

```sql
-- ============================================
-- conversation_sessions 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view their own sessions" ON conversation_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON conversation_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON conversation_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON conversation_sessions;

-- SELECT 정책
CREATE POLICY "Users can view their own sessions"
ON conversation_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT 정책
CREATE POLICY "Users can insert their own sessions"
ON conversation_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책
CREATE POLICY "Users can update their own sessions"
ON conversation_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE 정책
CREATE POLICY "Users can delete their own sessions"
ON conversation_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- conversation_records 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE conversation_records ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view their own records" ON conversation_records;
DROP POLICY IF EXISTS "Users can insert their own records" ON conversation_records;
DROP POLICY IF EXISTS "Users can update their own records" ON conversation_records;
DROP POLICY IF EXISTS "Users can delete their own records" ON conversation_records;

-- SELECT 정책
CREATE POLICY "Users can view their own records"
ON conversation_records
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT 정책 (세션 소유권 확인 포함)
CREATE POLICY "Users can insert their own records"
ON conversation_records
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM conversation_sessions
    WHERE id = session_id AND user_id = auth.uid()
  )
);

-- UPDATE 정책
CREATE POLICY "Users can update their own records"
ON conversation_records
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE 정책
CREATE POLICY "Users can delete their own records"
ON conversation_records
FOR DELETE
USING (auth.uid() = user_id);
```

---

## 테이블 생성 SQL (아직 테이블이 없다면)

```sql
-- conversation_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id 
ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_created_at 
ON conversation_sessions(created_at DESC);

-- conversation_records 테이블 생성
CREATE TABLE IF NOT EXISTS conversation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  user_audio_url TEXT,
  user_text TEXT,
  ai_text TEXT,
  ai_audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_conversation_records_user_id 
ON conversation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_records_session_id 
ON conversation_records(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_records_created_at 
ON conversation_records(created_at DESC);
```

---

## 확인 방법

### 1. RLS 활성화 확인
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversation_sessions', 'conversation_records');
```

### 2. 정책 확인
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('conversation_sessions', 'conversation_records');
```

### 3. 테스트
로그인한 사용자로 다음을 테스트:
- 세션 생성
- 세션 조회
- 기록 생성
- 기록 조회

---

## 문제 해결

### RLS 정책이 작동하지 않는 경우:

1. **RLS가 활성화되어 있는지 확인**
   ```sql
   ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE conversation_records ENABLE ROW LEVEL SECURITY;
   ```

2. **auth.uid()가 null인지 확인**
   - 클라이언트에서 세션이 제대로 설정되어 있는지 확인
   - Supabase 클라이언트가 올바르게 초기화되었는지 확인

3. **정책이 올바르게 생성되었는지 확인**
   - 위의 "정책 확인" 쿼리 실행
   - 정책이 없거나 잘못된 경우 다시 생성

4. **테이블 구조 확인**
   - `user_id` 컬럼이 올바른 타입(UUID)인지 확인
   - Foreign Key 제약조건이 올바른지 확인
