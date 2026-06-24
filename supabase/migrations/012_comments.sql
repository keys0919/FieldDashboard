CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  object_id   TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('researcher', 'client')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_object
  ON comments (project_id, object_type, object_id);
