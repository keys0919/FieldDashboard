ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS minutes_date       DATE,
  ADD COLUMN IF NOT EXISTS minutes_attendees  TEXT,
  ADD COLUMN IF NOT EXISTS minutes_content    TEXT;
