-- IF Consultancy — D1 Database Schema
-- Run: wrangler d1 execute ifconsultancy-db --file=./db/schema.sql

CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  org TEXT DEFAULT '',
  email TEXT NOT NULL,
  topic TEXT DEFAULT '',
  message TEXT NOT NULL,
  ip_hash TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON contact_submissions(email);
