-- ============================================
-- DoD Article Progress Tracking Table
-- ============================================
-- Tracks scraping progress at the article level
-- Enables auto-resume and prevents duplicate processing

CREATE TABLE IF NOT EXISTS dod_article_progress (
  id BIGSERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL,
  article_url TEXT NOT NULL,
  published_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  contracts_found INTEGER DEFAULT 0,
  contracts_inserted INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_article UNIQUE (article_id, article_url)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_dod_article_progress_date 
  ON dod_article_progress(published_date DESC);

CREATE INDEX IF NOT EXISTS idx_dod_article_progress_status 
  ON dod_article_progress(status);

CREATE INDEX IF NOT EXISTS idx_dod_article_progress_date_status 
  ON dod_article_progress(published_date DESC, status);

-- Comments
COMMENT ON TABLE dod_article_progress IS 'Tracks DoD contract news article scraping progress for auto-resume and deduplication';
COMMENT ON COLUMN dod_article_progress.article_id IS 'DoD article ID from URL';
COMMENT ON COLUMN dod_article_progress.status IS 'pending = not started, processing = in progress, completed = done, failed = error after retries';
COMMENT ON COLUMN dod_article_progress.retry_count IS 'Number of retry attempts for failed articles';

