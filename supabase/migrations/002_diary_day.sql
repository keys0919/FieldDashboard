-- activities 테이블에 diary_day 컬럼 추가
-- 유저 다이어리 activity의 N일차를 추적 (NULL = 다이어리 외 activity)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS diary_day INTEGER;
