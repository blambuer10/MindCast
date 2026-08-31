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
  try { db.exec(`ALTER TABLE evidence ADD COLUMN status TEXT NOT NULL DEFAULT 'NEW';`); } catch (_) {}
  try { db.exec(`ALTER TABLE evidence ADD COLUMN created_at TEXT NOT NULL DEFAULT '';`); } catch (_) {}

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
