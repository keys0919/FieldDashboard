-- 일반 회의(ad_hoc) 지원
-- meeting_type: 'regular' | 'ad_hoc'
-- title: ad_hoc 회의 제목
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS meeting_type TEXT NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS title TEXT;

-- 정례회의만 주차 중복 방지 (기존 UNIQUE 제약 → partial index로 교체)
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_project_id_week_start_key;

CREATE UNIQUE INDEX IF NOT EXISTS meetings_regular_unique
  ON meetings (project_id, week_start)
  WHERE meeting_type = 'regular';
