-- 회의록을 구조화된 JSONB로 관리
-- 기존 text 3개 컬럼 → minutes JSONB 단일 컬럼
ALTER TABLE meetings
  DROP COLUMN IF EXISTS minutes_date,
  DROP COLUMN IF EXISTS minutes_attendees,
  DROP COLUMN IF EXISTS minutes_content,
  ADD COLUMN IF NOT EXISTS minutes JSONB;
