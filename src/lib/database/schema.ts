// ============================================================================
// MINDCAST — Database Schema & Migrations
// ============================================================================
// Designed to be portable: SQLite (dev) → PostgreSQL (prod)
// All queries use standard SQL syntax compatible with both.

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
-- ─── Users ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- ─── Ideas ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  content TEXT NOT NULL,
  agent_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ideas_creator ON ideas(creator_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_published_at ON ideas(published_at);
CREATE INDEX IF NOT EXISTS idx_ideas_agent_id ON ideas(agent_id);

-- ─── Agents (Minds) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL UNIQUE,
  thesis TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 50.0,
  credibility REAL NOT NULL DEFAULT 50.0,
  system_prompt TEXT NOT NULL DEFAULT '',
  assumptions TEXT DEFAULT '[]',
  strengths TEXT DEFAULT '[]',
  weaknesses TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE INDEX IF NOT EXISTS idx_agents_idea ON agents(idea_id);

-- ─── Agent Events (Mind Lifecycle) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_events (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source TEXT,
  confidence_before REAL,
  confidence_after REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_agent_events_agent ON agent_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_created ON agent_events(created_at);

-- ─── Evidence ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  retrieved_at TEXT NOT NULL DEFAULT (datetime('now')),
  relevance REAL NOT NULL DEFAULT 0.5,
  stance TEXT NOT NULL DEFAULT 'NEUTRAL',
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_agent ON evidence(agent_id);
CREATE INDEX IF NOT EXISTS idx_evidence_stance ON evidence(stance);

-- ─── Arguments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS arguments (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  supporting_evidence_ids TEXT DEFAULT '[]',
  strength REAL NOT NULL DEFAULT 0.5,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_arguments_agent ON arguments(agent_id);

-- ─── Debates ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debates (
  id TEXT PRIMARY KEY,
  idea_a TEXT NOT NULL,
  idea_b TEXT NOT NULL,
  agent_a TEXT NOT NULL,
  agent_b TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  current_round INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  result_summary TEXT,
  FOREIGN KEY (idea_a) REFERENCES ideas(id),
  FOREIGN KEY (idea_b) REFERENCES ideas(id),
  FOREIGN KEY (agent_a) REFERENCES agents(id),
  FOREIGN KEY (agent_b) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_agents ON debates(agent_a, agent_b);

-- ─── Debate Messages ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debate_messages (
  id TEXT PRIMARY KEY,
  debate_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  content TEXT NOT NULL,
  sources TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (debate_id) REFERENCES debates(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_debate_messages_debate ON debate_messages(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_round ON debate_messages(debate_id, round);

-- ─── Payments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  amount TEXT NOT NULL,
  token TEXT NOT NULL DEFAULT 'USDC',
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

-- Prevent replay attacks / duplicate payments
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_tx_unique ON payments(chain, tx_hash);
CREATE INDEX IF NOT EXISTS idx_payments_idea ON payments(idea_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ─── Idea Follows ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_follows (
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, idea_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE INDEX IF NOT EXISTS idx_follows_idea ON idea_follows(idea_id);
CREATE INDEX IF NOT EXISTS idx_follows_user ON idea_follows(user_id);

-- ─── Analytics Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

-- ─── Schema Version ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_version (version) VALUES (1);
`;
