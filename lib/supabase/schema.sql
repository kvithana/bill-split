-- Bill Split receipts table
-- Apply via Supabase dashboard SQL editor

CREATE TABLE IF NOT EXISTS receipts (
  id            TEXT PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  bill_name     TEXT,
  image_url     TEXT NOT NULL DEFAULT '',
  metadata      JSONB NOT NULL DEFAULT '{}',
  people        JSONB NOT NULL DEFAULT '[]',
  line_items    JSONB NOT NULL DEFAULT '[]',
  adjustments   JSONB NOT NULL DEFAULT '[]',
  owner_id      TEXT NOT NULL,
  device_id     TEXT NOT NULL,
  is_shared     BOOLEAN NOT NULL DEFAULT false,
  share_key     TEXT UNIQUE,
  hash          TEXT NOT NULL DEFAULT '',
  last_synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_receipts_owner_id ON receipts (owner_id);
CREATE INDEX IF NOT EXISTS idx_receipts_share_key ON receipts (share_key) WHERE share_key IS NOT NULL;

-- Disable RLS — auth is enforced in Next.js API routes via device ID / share key headers
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for this table (run once in Supabase dashboard)
-- ALTER PUBLICATION supabase_realtime ADD TABLE receipts;
