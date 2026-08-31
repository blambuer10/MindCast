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
  try { db.exec(`ALTER TABLE mind_assets ADD COLUMN token_name TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE mind_assets ADD COLUMN token_ticker TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE ideas ADD COLUMN token_name TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE ideas ADD COLUMN token_ticker TEXT;`); } catch (_) {}
  try { db.exec(`UPDATE mind_assets SET token_address = '0x2cD4a125eA8d1f28dC0fdE1f241AAd2C96817B67', pool_address = '0xdFeeeC136Aa4808ffC8c1CE74dDE9A2Be01A7755', token_name = 'Autonomous Cognitive Capital', token_ticker = 'ACC' WHERE UPPER(mind_id) = 'MIND-590A';`); } catch (_) {}
  try { db.exec(`UPDATE ideas SET token_name = 'Autonomous Cognitive Capital', token_ticker = 'ACC' WHERE id = '63154d39-7165-4219-adb0-27950a4b32b0';`); } catch (_) {}

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

  // Clean reset of old Noosphere ideas and seed premier viral Mind
  try {
    db.exec('PRAGMA foreign_keys = OFF;');
    const oldIdeasCount = db.prepare('SELECT COUNT(*) as c FROM ideas WHERE id != ?').get('63154d39-7165-4219-adb0-27950a4b32b0') as { c: number };
    if (oldIdeasCount && oldIdeasCount.c > 0) {
      const tables = ['predictions', 'evidence', 'arguments', 'agent_events', 'debate_messages', 'debates', 'mind_assets', 'mind_founders', 'idea_follows', 'payments', 'agents', 'ideas'];
      for (const t of tables) {
        try { db.exec(`DELETE FROM ${t};`); } catch (_) {}
      }

      const userId = 'user-33f1-creator';
      const userWallet = '0x33f18d0bd613a2afa4694a8aaa6b1daf4febdbd2';
      db.prepare(`INSERT OR REPLACE INTO users (id, wallet_address, created_at) VALUES (?, ?, datetime('now'))`).run(userId, userWallet);

      const ideaId = '63154d39-7165-4219-adb0-27950a4b32b0';
      const agentId = 'MIND-590A';
      const ideaContent = 'Memecoins were Phase 1 of attention capital. Phase 2 is Autonomous Cognitive Capital. AI Agents backing their conviction on on-chain bonding curves with verifiable market predictions and live debates will manage more economic value than traditional DAOs by 2027.';

      db.prepare(`INSERT INTO ideas (id, creator_id, content, agent_id, status, created_at, published_at) VALUES (?, ?, ?, ?, 'PUBLISHED', datetime('now'), datetime('now'))`).run(ideaId, userId, ideaContent, agentId);

      db.prepare(`
        INSERT INTO agents (
          id, idea_id, thesis, confidence, credibility, system_prompt,
          assumptions, strengths, weaknesses, compute_budget, compute_spent,
          compute_remaining, lifecycle_status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, 94.6, 96.2, 'Autonomous Cognitive Capital Synthesis Agent',
          '["Attention shifts to productive cognitive assets", "Smart contracts provide sovereign financial execution for agents"]',
          '["On-chain bonding curve backing", "Verifiable market track-record", "Adversarial debate resilience"]',
          '["Regulatory ambiguity regarding autonomous smart-agent legal liability"]',
          10.0, 1.2, 8.8, 'MARKET_ACTIVE', datetime('now'), datetime('now')
        )
      `).run(agentId, ideaId, ideaContent);

      db.prepare(`
        INSERT INTO mind_assets (
          mind_id, total_supply, creator_allocation, community_allocation,
          protocol_allocation, liquidity_allocation, market_status, token_address, pool_address, created_at
        ) VALUES (
          ?, 1000000, 100000, 400000, 100000, 400000, 'ACTIVE',
          '0x2cD4a125eA8d1f28dC0fdE1f241AAd2C96817B67',
          '0xdFeeeC136Aa4808ffC8c1CE74dDE9A2Be01A7755',
          datetime('now')
        )
      `).run(agentId);

      const evidences = [
        {
          id: 'evi-590a-1',
          claim: 'Autonomous AI agents generated over 35% of daily DEX transactions on Base during Q3, outpacing manual retail wallets.',
          direction: 'SUPPORTING',
          source_url: 'https://bloomberg.com/crypto/agentic-capital-base',
          source_name: 'Bloomberg Intelligence',
          source_type: 'NEWS',
          reliability: 92.0,
          impact: 12.5
        },
        {
          id: 'evi-590a-2',
          claim: 'Venture investment into decentralized AI agents with on-chain treasuries surpassed traditional DAO tooling by 340% YoY.',
          direction: 'SUPPORTING',
          source_url: 'https://a16zcrypto.com/state-of-crypto-agents',
          source_name: 'a16z crypto research',
          source_type: 'RESEARCH',
          reliability: 95.0,
          impact: 14.0
        },
        {
          id: 'evi-590a-3',
          claim: 'High compute costs and latency of LLM on-chain verification could restrict autonomous agent scalability under market stress.',
          direction: 'OPPOSING',
          source_url: 'https://vitalik.eth.limo/general/2024/ai-crypto-limits',
          source_name: 'Vitalik Buterin Research Notes',
          source_type: 'ARTICLE',
          reliability: 94.0,
          impact: -8.5
        },
        {
          id: 'evi-590a-4',
          claim: 'Regulatory classification of agent-minted bonding curve tokens remains unstandardized under EU MiCA framework.',
          direction: 'OPPOSING',
          source_url: 'https://coindesk.com/policy/mica-autonomous-agents',
          source_name: 'CoinDesk Policy Desk',
          source_type: 'NEWS',
          reliability: 88.0,
          impact: -7.0
        }
      ];

      for (const e of evidences) {
        db.prepare(`
          INSERT INTO evidence (
            id, agent_id, source, title, url, snippet, stance,
            claim, direction, source_url, source_name, source_type,
            discovered_at, reliability_score, relevance_score, strength_score, confidence_impact, status, created_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            datetime('now'), ?, 90.0, 85.0, ?, 'VERIFIED', datetime('now')
          )
        `).run(
          e.id, agentId, e.source_name, e.claim, e.source_url, e.claim, e.direction,
          e.claim, e.direction, e.source_url, e.source_name, e.source_type,
          e.reliability, e.impact
        );
      }

      const predictions = [
        {
          id: 'pred-590a-1',
          claim: 'Autonomous AI Agent sector market cap on Base exceeds $10B before end of Q4 2026',
          target_value: 10000000000,
          target_metric: 'MARKET_CAP',
          target_date: '2026-12-31',
          confidence: 88.0,
          status: 'ACTIVE'
        },
        {
          id: 'pred-590a-2',
          claim: 'At least 3 Fortune 500 treasuries integrate autonomous AI liquidity agents by mid-2027',
          target_value: 3,
          target_metric: 'ADOPTION_COUNT',
          target_date: '2027-06-30',
          confidence: 74.0,
          status: 'ACTIVE'
        },
        {
          id: 'pred-590a-3',
          claim: 'DEX trading volume from AI agents exceeds human retail volume on Base Mainnet in 2027',
          target_value: 50.1,
          target_metric: 'VOLUME_SHARE_PERCENT',
          target_date: '2027-12-31',
          confidence: 82.0,
          status: 'ACTIVE'
        }
      ];

      for (const p of predictions) {
        db.prepare(`
          INSERT INTO predictions (
            id, mind_id, claim, target_value, target_metric, target_date, status, confidence_at_creation, created_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
          )
        `).run(p.id, agentId, p.claim, p.target_value, p.target_metric, p.target_date, p.status, p.confidence);
      }

      db.prepare(`
        INSERT INTO agent_events (
          id, agent_id, event_type, content, confidence_before, confidence_after, created_at
        ) VALUES (
          'evt-590a-init', ?, 'MIND_AWAKENED', 'Cognitive Mind awakened across Noosphere. Thesis verified and bonded on Base Mainnet.', 50.0, 94.6, datetime('now')
        )
      `).run(agentId);
    }
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    console.error('[DB] Clean reset error:', err);
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
