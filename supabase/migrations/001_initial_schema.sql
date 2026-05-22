-- ============================================================
-- Project X — Initial Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────
CREATE TABLE tasks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  description    TEXT,
  priority       TEXT        NOT NULL DEFAULT 'P3'
                               CHECK (priority IN ('P1','P2','P3','P4')),
  status         TEXT        NOT NULL DEFAULT 'New'
                               CHECK (status IN (
                                 'New','In Progress','Waiting Response',
                                 'Escalation','Blocked','Resolved','Archived'
                               )),
  category       TEXT,
  deadline       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  ai_summary     TEXT,
  source_type    TEXT        CHECK (source_type IN ('voice','text','image')),
  comments       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  attachment_url TEXT
);

-- ─────────────────────────────────────────
-- EVENT LOGS (append-only audit trail)
-- ─────────────────────────────────────────
CREATE TABLE event_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID        REFERENCES tasks(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_tasks_status    ON tasks(status);
CREATE INDEX idx_tasks_priority  ON tasks(priority);
CREATE INDEX idx_tasks_deadline  ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_event_logs_task ON event_logs(task_id);
CREATE INDEX idx_event_logs_time ON event_logs(created_at DESC);

-- ─────────────────────────────────────────
-- TRIGGER: auto-set resolved_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Resolved' AND (OLD.status IS DISTINCT FROM 'Resolved') THEN
    NEW.resolved_at = NOW();
  END IF;
  IF NEW.status != 'Resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resolved_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_resolved_at();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Single-user app: disable RLS or use anon key policy.
-- Recommended: enable RLS + anon key has full access (no auth on Supabase side).
-- ─────────────────────────────────────────
ALTER TABLE tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for the anon role (your app uses anon key)
CREATE POLICY "anon full access tasks"
  ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon full access event_logs"
  ON event_logs FOR ALL TO anon USING (true) WITH CHECK (true);
