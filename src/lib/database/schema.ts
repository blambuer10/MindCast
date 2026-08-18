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
  compute_budget REAL NOT NULL DEFAULT 1.0,
  compute_spent REAL NOT NULL DEFAULT 0.0,
  compute_remaining REAL NOT NULL DEFAULT 1.0,
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
  claim TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'NEUTRAL',
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'NEWS',
  published_at TEXT,
  discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
  reliability_score REAL NOT NULL DEFAULT 50.0,
  relevance_score REAL NOT NULL DEFAULT 50.0,
  strength_score REAL NOT NULL DEFAULT 50.0,
  confidence_impact REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_agent ON evidence(agent_id);
CREATE INDEX IF NOT EXISTS idx_evidence_stance ON evidence(direction);

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

-- ─── Predictions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  target_value TEXT,
  target_metric TEXT,
  target_date TEXT,
  resolution_method TEXT,
  resolution_source TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  confidence_at_creation REAL NOT NULL,
  confidence_at_resolution REAL,
  outcome TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_mind ON predictions(mind_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);

-- ─── Debate Outcomes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debate_outcomes (
  debate_id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL,
  argument_score REAL NOT NULL DEFAULT 50.0,
  evidence_score REAL NOT NULL DEFAULT 50.0,
  rebuttal_score REAL NOT NULL DEFAULT 50.0,
  intellectual_honesty_score REAL NOT NULL DEFAULT 50.0,
  confidence_before REAL NOT NULL,
  confidence_after REAL NOT NULL,
  position_changed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (debate_id) REFERENCES debates(id),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_debate_outcomes_mind ON debate_outcomes(mind_id);

-- ─── Mind Assets ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_assets (
  id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL UNIQUE,
  asset_type TEXT NOT NULL DEFAULT 'MIND_SHARE',
  total_supply REAL NOT NULL DEFAULT 1000000.0,
  creator_allocation REAL NOT NULL DEFAULT 15.0,
  community_allocation REAL NOT NULL DEFAULT 70.0,
  protocol_allocation REAL NOT NULL DEFAULT 10.0,
  liquidity_allocation REAL NOT NULL DEFAULT 5.0,
  market_status TEXT NOT NULL DEFAULT 'INACTIVE',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_assets_mind ON mind_assets(mind_id);

-- ─── Mind Founders ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_founders (
  creator_id TEXT NOT NULL,
  mind_id TEXT NOT NULL,
  allocation_percentage REAL NOT NULL DEFAULT 15.0,
  allocation_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (creator_id, mind_id),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

-- ─── Mind Reputation Events ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_reputation_events (
  id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  score_change REAL NOT NULL DEFAULT 0.0,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_rep_events_mind ON mind_reputation_events(mind_id);

-- ─── Mind Valuation Snapshots ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_valuation_snapshots (
  id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL,
  estimated_value REAL NOT NULL DEFAULT 1000.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_val_snapshots_mind ON mind_valuation_snapshots(mind_id);

-- ─── Protocol Assets ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS protocol_assets (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL DEFAULT 'PROTOCOL_TOKEN',
  symbol TEXT NOT NULL DEFAULT 'MIND',
  status TEXT NOT NULL DEFAULT 'PLANNED',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Mind Compute Usage ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_compute_usage (
  id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_compute_usage_mind ON mind_compute_usage(mind_id);

-- ─── Data Events (Raw Event Store - Layer 1) ────────────────────────────
CREATE TABLE IF NOT EXISTS data_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  anonymous_actor_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  session_id TEXT,
  request_id TEXT,
  metadata TEXT DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'SYSTEM',
  version TEXT NOT NULL DEFAULT '1.0',
  schema_version TEXT NOT NULL DEFAULT '1.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_data_events_type ON data_events(event_type);
CREATE INDEX IF NOT EXISTS idx_data_events_actor ON data_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_data_events_entity ON data_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_data_events_created ON data_events(created_at);

-- ─── Mind Thesis Versions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_thesis_versions (
  id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  thesis TEXT NOT NULL,
  reason TEXT,
  generated_by TEXT NOT NULL DEFAULT 'AI',
  confidence REAL NOT NULL DEFAULT 50.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_thesis_versions_mind ON mind_thesis_versions(mind_id);

-- ─── Mind Belief Snapshots (Time-series) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_belief_snapshots (
  id TEXT PRIMARY KEY,
  mind_id TEXT NOT NULL,
  confidence REAL NOT NULL,
  credibility REAL NOT NULL,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  counter_evidence_count INTEGER NOT NULL DEFAULT 0,
  prediction_accuracy REAL NOT NULL DEFAULT 0.0,
  followers INTEGER NOT NULL DEFAULT 0,
  debate_count INTEGER NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_belief_snapshots_mind ON mind_belief_snapshots(mind_id);
CREATE INDEX IF NOT EXISTS idx_mind_belief_snapshots_time ON mind_belief_snapshots(timestamp);

-- ─── Source Intelligence ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_intelligence (
  domain TEXT PRIMARY KEY,
  publisher TEXT,
  source_type TEXT NOT NULL DEFAULT 'NEWS',
  citation_count INTEGER NOT NULL DEFAULT 0,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  supporting_count INTEGER NOT NULL DEFAULT 0,
  opposing_count INTEGER NOT NULL DEFAULT 0,
  average_reliability REAL NOT NULL DEFAULT 50.0,
  average_relevance REAL NOT NULL DEFAULT 50.0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Topics & Topic Classification ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS mind_topics (
  mind_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  relevance_score REAL NOT NULL DEFAULT 1.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (mind_id, topic_id),
  FOREIGN KEY (mind_id) REFERENCES agents(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_topics_topic ON mind_topics(topic_id);

-- ─── Cross-Mind Relationships ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mind_relationships (
  id TEXT PRIMARY KEY,
  source_mind_id TEXT NOT NULL,
  target_mind_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  confidence_impact REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_mind_id) REFERENCES agents(id),
  FOREIGN KEY (target_mind_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_mind_relationships_src ON mind_relationships(source_mind_id);
CREATE INDEX IF NOT EXISTS idx_mind_relationships_tgt ON mind_relationships(target_mind_id);

-- ─── Session Events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_events (
  session_id TEXT PRIMARY KEY,
  anonymous_user_id TEXT NOT NULL,
  user_id TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  referrer TEXT,
  landing_page TEXT,
  device_category TEXT,
  browser_category TEXT,
  country_region TEXT,
  events_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON session_events(user_id);

-- ─── User Consent Records ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  granted INTEGER NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL DEFAULT 'WEB_FORM',
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_records(user_id);

-- ─── Dataset Lineage Definitions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dataset_definitions (
  dataset_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  description TEXT,
  source_tables TEXT NOT NULL,
  transformation_version TEXT NOT NULL DEFAULT '1.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS data_quality_runs (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  quality_score REAL NOT NULL DEFAULT 100.0,
  metrics TEXT NOT NULL DEFAULT '{}',
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (dataset_id) REFERENCES dataset_definitions(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_quality_dataset ON data_quality_runs(dataset_id);

-- ─── Early Signals ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS early_signals (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  strength REAL NOT NULL DEFAULT 0.0,
  evidence_velocity REAL NOT NULL DEFAULT 0.0,
  converging_minds_count INTEGER NOT NULL DEFAULT 0,
  details TEXT NOT NULL DEFAULT '{}',
  detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_early_signals_topic ON early_signals(topic);

-- ─── Data Access Audit Logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_access_audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  role TEXT NOT NULL DEFAULT 'ANALYST',
  dataset_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  result TEXT NOT NULL DEFAULT 'SUCCESS'
);

CREATE INDEX IF NOT EXISTS idx_audit_dataset ON data_access_audit_log(dataset_id);

-- ─── Schema Version ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_version (version) VALUES (1);
`;
