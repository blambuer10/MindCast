// ============================================================================
// MINDCAST — Database Connection (SQLite for dev, Postgres-ready)
// ============================================================================

import Database from 'better-sqlite3';
import path from 'path';
import { CREATE_TABLES } from './schema';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'mindcast.db');

  // Ensure data directory exists
  const dir = path.dirname(dbPath);
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode and normal synchronization for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  // Initialize schema
  db.exec(CREATE_TABLES);

  // Dynamically add compute budget columns to existing databases
  try { db.exec(`ALTER TABLE agents ADD COLUMN compute_budget REAL NOT NULL DEFAULT 1.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE agents ADD COLUMN compute_spent REAL NOT NULL DEFAULT 0.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE agents ADD COLUMN compute_remaining REAL NOT NULL DEFAULT 1.0;`); } catch (_) {}

  // Dynamically add reputation and economic columns to existing databases
  try { db.exec(`ALTER TABLE agents ADD COLUMN lifecycle_status TEXT NOT NULL DEFAULT 'INCUBATING';`); } catch (_) {}
  try { db.exec(`ALTER TABLE agents ADD COLUMN prediction_accuracy REAL NOT NULL DEFAULT 0.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE agents ADD COLUMN calibration_score REAL NOT NULL DEFAULT 100.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE agents ADD COLUMN estimated_value REAL NOT NULL DEFAULT 1000.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE agents ADD COLUMN market_status TEXT NOT NULL DEFAULT 'ACTIVE';`); } catch (_) {}
  try { db.exec(`UPDATE mind_assets SET market_status = 'ACTIVE';`); } catch (_) {}
  try { db.exec(`ALTER TABLE mind_assets ADD COLUMN token_address TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE mind_assets ADD COLUMN pool_address TEXT;`); } catch (_) {}
  try { db.exec(`UPDATE mind_assets SET token_address = '0x9B3ded34d5357FC0187F322fb74960f667BBE490' WHERE UPPER(mind_id) = 'MIND-590A';`); } catch (_) {}

  // Dynamically add upgraded evidence columns to existing databases
  try { db.exec(`ALTER TABLE evidence ADD COLUMN claim TEXT NOT NULL DEFAULT '';`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN direction TEXT NOT NULL DEFAULT 'NEUTRAL';`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN source_url TEXT NOT NULL DEFAULT '';`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN source_name TEXT NOT NULL DEFAULT '';`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN source_type TEXT NOT NULL DEFAULT 'NEWS';`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN discovered_at TEXT NOT NULL DEFAULT '';`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN reliability_score REAL NOT NULL DEFAULT 50.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN relevance_score REAL NOT NULL DEFAULT 50.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN strength_score REAL NOT NULL DEFAULT 50.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN confidence_impact REAL NOT NULL DEFAULT 0.0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN created_at TEXT NOT NULL DEFAULT '';`); } catch (_) {}

  // Permanently purge all ideas, agents and noosphere data created by compromised wallet 0xB284...
  try {
    const compromisedWallet = '0xb284ed722ccc17b0be3737a1a5ca8b991fa81f3a';
    db.exec('PRAGMA foreign_keys = OFF;');
    const compUsers = db.prepare('SELECT id FROM users WHERE LOWER(wallet_address) = ?').all(compromisedWallet) as { id: string }[];
    for (const u of compUsers) {
      const compIdeas = db.prepare('SELECT id FROM ideas WHERE creator_id = ?').all(u.id) as { id: string }[];
      for (const idea of compIdeas) {
        const compAgents = db.prepare('SELECT id FROM agents WHERE idea_id = ?').all(idea.id) as { id: string }[];
        for (const agent of compAgents) {
          db.prepare('DELETE FROM predictions WHERE mind_id = ?').run(agent.id);
          db.prepare('DELETE FROM evidence WHERE agent_id = ?').run(agent.id);
          db.prepare('DELETE FROM arguments WHERE agent_id = ?').run(agent.id);
          db.prepare('DELETE FROM agent_events WHERE agent_id = ?').run(agent.id);
          db.prepare('DELETE FROM debate_outcomes WHERE mind_id = ?').run(agent.id);
          db.prepare('DELETE FROM debate_messages WHERE agent_id = ?').run(agent.id);
          db.prepare('DELETE FROM debates WHERE agent_a = ? OR agent_b = ? OR idea_a = ? OR idea_b = ?').run(agent.id, agent.id, idea.id, idea.id);
          db.prepare('DELETE FROM mind_assets WHERE mind_id = ?').run(agent.id);
          db.prepare('DELETE FROM mind_founders WHERE mind_id = ?').run(agent.id);
          db.prepare('DELETE FROM agents WHERE id = ?').run(agent.id);
        }
        db.prepare('DELETE FROM debates WHERE idea_a = ? OR idea_b = ?').run(idea.id, idea.id);
        db.prepare('DELETE FROM idea_follows WHERE idea_id = ?').run(idea.id);
        db.prepare('DELETE FROM payments WHERE idea_id = ?').run(idea.id);
        db.prepare('DELETE FROM ideas WHERE id = ?').run(idea.id);
      }
      db.prepare('DELETE FROM payments WHERE user_id = ?').run(u.id);
      db.prepare('DELETE FROM mind_founders WHERE creator_id = ?').run(u.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
    }
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    console.error('[DB] Compromised wallet purge error:', err);
  }

  return db;
}

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper for JSON serialization in SQLite
export function toJson(data: unknown): string {
  return JSON.stringify(data);
}

export function fromJson<T>(json: string | null): T {
  if (!json) return [] as unknown as T;
  try {
    return JSON.parse(json) as T;
  } catch {
    return [] as unknown as T;
  }
}
