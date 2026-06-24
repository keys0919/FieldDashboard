-- meeting_items: 이슈/열린질문/의사결정을 독립 엔티티로 관리
-- 발생 회의(meeting_id), 해소 회의(closed_meeting_id), 사유(close_reason) 추적
CREATE TABLE meeting_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  meeting_id        UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('issue', 'open_question', 'decision')),
  text              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'resolved', 'pending', 'confirmed')),
  closed_meeting_id UUID REFERENCES meetings(id),
  close_reason      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_meeting_items_updated_at
  BEFORE UPDATE ON meeting_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 기존 JSONB 컬럼 제거 (기존 데이터 있으면 먼저 삭제 후 실행)
ALTER TABLE meetings
  DROP COLUMN IF EXISTS issues,
  DROP COLUMN IF EXISTS open_questions,
  DROP COLUMN IF EXISTS decisions;
