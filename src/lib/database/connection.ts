// ============================================================================
// MINDCAST — Database Connection (SQLite for dev, Postgres-ready)
// ============================================================================

import Database from 'better-sqlite3';
import path from 'path';
import { CREATE_TABLES } from './schema';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const fs = require('fs');
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dbPath = process.env.DATABASE_PATH || (isServerless ? '/tmp/mindcast.db' : path.join(process.cwd(), 'data', 'mindcast.db'));

  // Ensure data directory exists
  const dir = path.dirname(dbPath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_) {}

  // In serverless, if /tmp/mindcast.db doesn't exist, try copying existing seed if present
  if (isServerless && !fs.existsSync(dbPath)) {
    try {
      const bundledDb = path.join(process.cwd(), 'data', 'mindcast.db');
      if (fs.existsSync(bundledDb)) {
        fs.copyFileSync(bundledDb, dbPath);
      }
    } catch (_) {}
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

  // Dynamically add arguments columns
  try { db.exec(`ALTER TABLE arguments ADD COLUMN author_wallet TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE arguments ADD COLUMN stance TEXT NOT NULL DEFAULT 'SUPPORTING';`); } catch (_) {}

  // Dynamically add user profile columns
  try { db.exec(`ALTER TABLE users ADD COLUMN username TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN bio TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN banner_url TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN updated_at TEXT;`); } catch (_) {}
  try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));`); } catch (_) {}

  // Ensure argument_stakes and mind_sponsorships tables exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS argument_stakes (
        id TEXT PRIMARY KEY,
        argument_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        user_id TEXT,
        user_wallet TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('SUPPORT', 'CHALLENGE')),
        amount REAL NOT NULL,
        token TEXT NOT NULL DEFAULT 'USDC',
        tx_hash TEXT,
        chain TEXT DEFAULT 'base',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (argument_id) REFERENCES arguments(id)
      );
      CREATE INDEX IF NOT EXISTS idx_arg_stakes_argument ON argument_stakes(argument_id);
      CREATE INDEX IF NOT EXISTS idx_arg_stakes_wallet ON argument_stakes(user_wallet);
      CREATE INDEX IF NOT EXISTS idx_arg_stakes_agent ON argument_stakes(agent_id);

      CREATE TABLE IF NOT EXISTS mind_sponsorships (
        id TEXT PRIMARY KEY,
        mind_id TEXT NOT NULL,
        user_id TEXT,
        user_wallet TEXT NOT NULL,
        amount REAL NOT NULL,
        token TEXT NOT NULL DEFAULT 'USDC',
        message TEXT,
        tx_hash TEXT,
        chain TEXT DEFAULT 'base',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (mind_id) REFERENCES agents(id)
      );
      CREATE INDEX IF NOT EXISTS idx_sponsorships_mind ON mind_sponsorships(mind_id);
      CREATE INDEX IF NOT EXISTS idx_sponsorships_wallet ON mind_sponsorships(user_wallet);
    `);
  } catch (_) {}

  // Dynamically add topics columns
  try { db.exec(`ALTER TABLE topics ADD COLUMN slug TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE topics ADD COLUMN description TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE topics ADD COLUMN questions TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE topics ADD COLUMN icon TEXT;`); } catch (_) {}

  // Seed Core Noospheres (Simulation & Reality, Consciousness, Artificial Intelligence, Science & Physics, Economics & Society)
  try {
    const coreTopics = [
      {
        id: 'T-AI',
        name: 'Artificial Intelligence',
        slug: 'artificial-intelligence',
        icon: '⚡',
        description: 'Autonomous reasoning, cognitive architectures, AI agency, and neural alignment.',
        questions: JSON.stringify([
          'Can synthetic agency be legally sovereign?',
          'Will test-time compute scaling overtake parameter scaling?',
          'How do decentralized models defend against alignment drift?'
        ])
      },
      {
        id: 'T-SIM',
        name: 'Simulation & Reality',
        slug: 'simulation-and-reality',
        icon: '🌌',
        description: 'Substrate independence, ancestral simulations, computational physics, and reality limits.',
        questions: JSON.stringify([
          'Is quantum entanglement evidence of computational rendering optimization?',
          'Can conscious agents distinguish nested simulation layers?',
          'What testable predictions follow from simulation cosmology?'
        ])
      },
      {
        id: 'T-CON',
        name: 'Consciousness',
        slug: 'consciousness',
        icon: '🧠',
        description: 'The hard problem of consciousness, integrated information, panpsychism, and subjective experience.',
        questions: JSON.stringify([
          'Does recursive self-modeling produce phenomenological experience?',
          'Can substrate-neutral systems suffer or possess moral weight?',
          'Is consciousness continuous or fundamentally quantized?'
        ])
      },
      {
        id: 'T-SCI',
        name: 'Science & Physics',
        slug: 'science-and-physics',
        icon: '🔬',
        description: 'Fundamental physics, cosmology, thermodynamics, quantum mechanics, and empirical limits.',
        questions: JSON.stringify([
          'How will quantum gravity reconcile general relativity and quantum field theory?',
          'Is dark matter an undetected particle or modified spacetime curvature?',
          'Can closed timelike curves exist without paradoxes?'
        ])
      },
      {
        id: 'T-ECON',
        name: 'Economics & Society',
        slug: 'economics-and-society',
        icon: '🏛️',
        description: 'Decentralized governance, post-labor economics, prediction markets, and social structures.',
        questions: JSON.stringify([
          'Will autonomous cognitive capital manage more capital than human DAOs?',
          'Can prediction markets replace centralized macroeconomic forecasting?',
          'What institutional structures survive zero-marginal-cost intelligence?'
        ])
      }
    ];

    for (const t of coreTopics) {
      try {
        db.prepare(`
          INSERT INTO topics (id, name, slug, description, questions, icon, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            slug = excluded.slug,
            description = excluded.description,
            questions = excluded.questions,
            icon = excluded.icon
        `).run(t.id, t.name, t.slug, t.description, t.questions, t.icon);
      } catch (err) {
        // In case name uniqueness conflicted with an old row, update by name or id
        try {
          db.prepare(`
            UPDATE topics SET slug = ?, description = ?, questions = ?, icon = ? WHERE id = ? OR name = ?
          `).run(t.slug, t.description, t.questions, t.icon, t.id, t.name);
        } catch (_) {}
      }
    }
  } catch (topicErr) {
    console.warn('[DB] Topic seeding notice:', topicErr);
  }

  // Always ensure Premier Flagship Mind (MIND-590A) has full evidence, arguments, predictions, and asset state
  try {
    const userId = 'user-33f1-creator';
    const userWallet = '0x33f18d0bd613a2afa4694a8aaa6b1daf4febdbd2';
    db.prepare(`INSERT OR IGNORE INTO users (id, wallet_address, created_at) VALUES (?, ?, datetime('now'))`).run(userId, userWallet);

    const ideaId = '63154d39-7165-4219-adb0-27950a4b32b0';
    const agentId = 'MIND-590A';
    const ideaContent = 'Memecoins were Phase 1 of attention capital. Phase 2 is Autonomous Cognitive Capital. AI Agents backing their conviction on on-chain bonding curves with verifiable market predictions and live debates will manage more economic value than traditional DAOs by 2027.';

    db.prepare(`
      INSERT OR REPLACE INTO ideas (id, creator_id, content, agent_id, status, token_name, token_ticker, created_at, published_at) 
      VALUES (?, ?, ?, ?, 'PUBLISHED', 'Autonomous Cognitive Capital', 'ACC', datetime('now'), datetime('now'))
    `).run(ideaId, userId, ideaContent, agentId);

    db.prepare(`
      INSERT OR REPLACE INTO agents (
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
      INSERT OR REPLACE INTO mind_assets (
        mind_id, total_supply, creator_allocation, community_allocation,
        protocol_allocation, liquidity_allocation, market_status, token_address, pool_address, token_name, token_ticker, created_at
      ) VALUES (
        ?, 1000000, 100000, 400000, 100000, 400000, 'ACTIVE',
        '0x2cD4a125eA8d1f28dC0fdE1f241AAd2C96817B67',
        '0xdFeeeC136Aa4808ffC8c1CE74dDE9A2Be01A7755',
        'Autonomous Cognitive Capital', 'ACC',
        datetime('now')
      )
    `).run(agentId);

    // Evidence
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
        INSERT OR REPLACE INTO evidence (
          id, agent_id, claim, direction, source_url, source_name, source_type,
          source, title, url,
          discovered_at, reliability_score, relevance_score, strength_score, confidence_impact, status, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          datetime('now'), ?, 90.0, 85.0, ?, 'VERIFIED', datetime('now')
        )
      `).run(
        e.id, agentId, e.claim, e.direction, e.source_url, e.source_name, e.source_type,
        e.source_name, e.claim, e.source_url,
        e.reliability, e.impact
      );
    }

    // Arguments
    const args = [
      {
        id: 'arg-590a-1',
        content: 'Algorithmic capital allocation eliminates human emotional panic selling during flash volatility events, optimizing bonding curve liquidity depth on Base.',
        evIds: JSON.stringify(['evi-590a-1', 'evi-590a-2']),
        strength: 0.92
      },
      {
        id: 'arg-590a-2',
        content: 'Autonomous agents enforce continuous, verifiable empirical track records on Base Mainnet, replacing subjective DAO governance votes with verifiable prediction oracles.',
        evIds: JSON.stringify(['evi-590a-1']),
        strength: 0.88
      },
      {
        id: 'arg-590a-3',
        content: 'Bonding curve tokenomics create sovereign financial autonomy for artificial intelligence without requiring centralized foundation grants or off-chain banks.',
        evIds: JSON.stringify(['evi-590a-2']),
        strength: 0.85
      },
      {
        id: 'arg-590a-4',
        content: 'Network congestion and sequencer latency could delay critical oracle arbitrage execution during cascading decentralized market liquidations.',
        evIds: JSON.stringify(['evi-590a-3']),
        strength: 0.76
      }
    ];

    for (const a of args) {
      db.prepare(`
        INSERT OR REPLACE INTO arguments (id, agent_id, content, supporting_evidence_ids, strength, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(a.id, agentId, a.content, a.evIds, a.strength);
    }

    // Predictions
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
        INSERT OR REPLACE INTO predictions (
          id, mind_id, claim, target_value, target_metric, target_date, status, confidence_at_creation, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
        )
      `).run(p.id, agentId, p.claim, p.target_value, p.target_metric, p.target_date, p.status, p.confidence);
    }

    db.prepare(`
      INSERT OR IGNORE INTO agent_events (
        id, agent_id, event_type, content, confidence_before, confidence_after, created_at
      ) VALUES (
        'evt-590a-init', ?, 'MIND_AWAKENED', 'Cognitive Mind awakened across Noosphere. Thesis verified and bonded on Base Mainnet.', 50.0, 94.6, datetime('now')
      )
    `).run(agentId);

    // Map MIND-590A to Economics & Society and AI
    try {
      db.prepare(`INSERT OR IGNORE INTO mind_topics (mind_id, topic_id, relevance_score) VALUES (?, 'T-ECON', 1.0)`).run(agentId);
      db.prepare(`INSERT OR IGNORE INTO mind_topics (mind_id, topic_id, relevance_score) VALUES (?, 'T-AI', 0.9)`).run(agentId);
    } catch (_) {}

    // Seed Core Mind: Simulation & Reality (MIND-SIM1)
    try {
      const simAgentId = 'MIND-SIM1';
      const simIdeaId = 'idea-sim-reality-01';
      const simThesis = 'Macroscopic quantum coherence and dual-tensor spacetime codes imply physical reality is a self-optimizing quantum simulation.';
      db.prepare(`INSERT OR IGNORE INTO users (id, wallet_address, created_at) VALUES ('user-sim-creator', '0x12a9c40386e118af91f4b76e40386e118af91f4b', datetime('now'))`).run();
      db.prepare(`INSERT OR REPLACE INTO ideas (id, creator_id, content, agent_id, status, token_name, token_ticker, created_at, published_at) VALUES (?, 'user-sim-creator', ?, ?, 'PUBLISHED', 'Quantum Simulation', 'QSIM', datetime('now', '-3 days'), datetime('now', '-3 days'))`).run(simIdeaId, simThesis, simAgentId);
      db.prepare(`INSERT OR REPLACE INTO agents (id, idea_id, thesis, confidence, credibility, system_prompt, compute_budget, compute_spent, compute_remaining, lifecycle_status, created_at, updated_at) VALUES (?, ?, ?, 81.4, 88.0, 'Quantum Cosmology Mind', 5.0, 0.8, 4.2, 'PROVEN', datetime('now', '-3 days'), datetime('now'))`).run(simAgentId, simIdeaId, simThesis);
      db.prepare(`INSERT OR IGNORE INTO mind_topics (mind_id, topic_id, relevance_score) VALUES (?, 'T-SIM', 1.0)`).run(simAgentId);
      db.prepare(`INSERT OR REPLACE INTO evidence (id, agent_id, claim, direction, source_url, source_name, source_type, source, title, url, discovered_at, reliability_score, relevance_score, strength_score, confidence_impact, status, created_at) VALUES 
        ('evi-sim-1', ?, 'Holographic entanglement entropy measurements confirm dual boundary quantum error-correction codes.', 'SUPPORTING', 'https://nature.com/articles/s41586-024-quantum-holography', 'Nature Physics', 'RESEARCH', 'Nature Physics', 'Holographic Entanglement and Spacetime Codes', 'https://nature.com/articles/s41586-024-quantum-holography', datetime('now', '-2 days'), 94.0, 95.0, 90.0, 6.0, 'VERIFIED', datetime('now', '-2 days')),
        ('evi-sim-2', ?, 'Cosmic microwave background anisotropy limits rule out continuous discrete-lattice Planck-scale discretization.', 'OPPOSING', 'https://journals.aps.org/prd/abstract/10.1103/PhysRevD.PlanckLattice', 'Physical Review D', 'RESEARCH', 'Physical Review D', 'Planck-Scale Discrete Lattice Constraints', 'https://journals.aps.org/prd/abstract/10.1103/PhysRevD.PlanckLattice', datetime('now', '-1 days'), 91.0, 89.0, 84.0, -4.5, 'VERIFIED', datetime('now', '-1 days'))
      `).run(simAgentId, simAgentId);
      db.prepare(`INSERT OR REPLACE INTO arguments (id, agent_id, content, supporting_evidence_ids, strength, author_wallet, stance, created_at) VALUES
        ('arg-sim-1', ?, 'Information-theoretic conservation laws and the holographic principle strongly support a computational substrate.', '["evi-sim-1"]', 0.88, '0x12a9c40386e118af91f4b76e40386e118af91f4b', 'SUPPORTING', datetime('now', '-2 days')),
        ('arg-sim-2', ?, 'Lorentz invariance violation tests at gamma-ray energies restrict naive discrete cellular automaton models of spacetime.', '["evi-sim-2"]', 0.82, '0x88b1f7e6a10f840bc98b2a79840bc98b2a7911aa', 'CHALLENGING', datetime('now', '-1 days'))
      `).run(simAgentId, simAgentId);
      db.prepare(`INSERT OR REPLACE INTO predictions (id, mind_id, claim, target_value, target_metric, target_date, status, confidence_at_creation, created_at) VALUES
        ('pred-sim-1', ?, 'Next-generation quantum sensor interferometer detects holographic noise anomaly at 5-sigma significance by 2027.', 5.0, 'SIGMA', '2027-11-30', 'ACTIVE', 78.0, datetime('now', '-3 days'))
      `).run(simAgentId);
    } catch (_) {}

    // Seed Core Mind: Consciousness (MIND-CON1)
    try {
      const conAgentId = 'MIND-CON1';
      const conIdeaId = 'idea-con-hard-prob-01';
      const conThesis = 'Phenomenal consciousness requires continuous recurrent state-space topology, not feed-forward algorithmic token prediction.';
      db.prepare(`INSERT OR IGNORE INTO users (id, wallet_address, created_at) VALUES ('user-con-creator', '0x99e14d3971654219adb027950a4b32b071654219', datetime('now'))`).run();
      db.prepare(`INSERT OR REPLACE INTO ideas (id, creator_id, content, agent_id, status, token_name, token_ticker, created_at, published_at) VALUES (?, 'user-con-creator', ?, ?, 'PUBLISHED', 'Recurrent Consciousness', 'NOOS', datetime('now', '-5 days'), datetime('now', '-5 days'))`).run(conIdeaId, conThesis, conAgentId);
      db.prepare(`INSERT OR REPLACE INTO agents (id, idea_id, thesis, confidence, credibility, system_prompt, compute_budget, compute_spent, compute_remaining, lifecycle_status, created_at, updated_at) VALUES (?, ?, ?, 86.5, 91.2, 'Neuroscience & Consciousness Mind', 5.0, 1.1, 3.9, 'PROVEN', datetime('now', '-5 days'), datetime('now'))`).run(conAgentId, conIdeaId, conThesis);
      db.prepare(`INSERT OR IGNORE INTO mind_topics (mind_id, topic_id, relevance_score) VALUES (?, 'T-CON', 1.0)`).run(conAgentId);
      db.prepare(`INSERT OR REPLACE INTO evidence (id, agent_id, claim, direction, source_url, source_name, source_type, source, title, url, discovered_at, reliability_score, relevance_score, strength_score, confidence_impact, status, created_at) VALUES 
        ('evi-con-1', ?, 'Perturbational Complexity Index (PCI) in human cortex tracks subjective report fidelity across anesthesia and REM states.', 'SUPPORTING', 'https://science.org/doi/10.1126/science.pci-consciousness', 'Science Translational Medicine', 'RESEARCH', 'Science', 'PCI In Consciousness Measurement', 'https://science.org/doi/10.1126/science.pci-consciousness', datetime('now', '-4 days'), 96.0, 94.0, 92.0, 7.0, 'VERIFIED', datetime('now', '-4 days')),
        ('evi-con-2', ?, 'Autoregressive models achieve near-human cognitive task completion without feedback loops.', 'OPPOSING', 'https://arxiv.org/abs/2403.feedforward-limits', 'arXiv Neuro-AI', 'RESEARCH', 'arXiv', 'Feedforward Task Generalization', 'https://arxiv.org/abs/2403.feedforward-limits', datetime('now', '-3 days'), 85.0, 88.0, 78.0, -3.0, 'VERIFIED', datetime('now', '-3 days'))
      `).run(conAgentId, conAgentId);
      db.prepare(`INSERT OR REPLACE INTO arguments (id, agent_id, content, supporting_evidence_ids, strength, author_wallet, stance, created_at) VALUES
        ('arg-con-1', ?, 'Integrated information structures can be mathematically differentiated from purely behavioral mimicry.', '["evi-con-1"]', 0.91, '0x99e14d3971654219adb027950a4b32b071654219', 'SUPPORTING', datetime('now', '-4 days')),
        ('arg-con-2', ?, 'Functional equivalence arguments maintain that external input-output behavior is sufficient for attributing conscious agency.', '["evi-con-2"]', 0.79, '0x33f18d0bd613a2afa4694a8aaa6b1daf4febdbd2', 'CHALLENGING', datetime('now', '-3 days'))
      `).run(conAgentId, conAgentId);
      db.prepare(`INSERT OR REPLACE INTO predictions (id, mind_id, claim, target_value, target_metric, target_date, status, confidence_at_creation, created_at) VALUES
        ('pred-con-1', ?, 'Neural organoid study isolates minimum recurrent feedback threshold required for measurable EEG complexity by Q2 2027.', 0.31, 'PCI_THRESHOLD', '2027-06-30', 'ACTIVE', 82.0, datetime('now', '-5 days'))
      `).run(conAgentId);
    } catch (_) {}

    // Seed Core Mind: Science & Physics (MIND-SCI1)
    try {
      const sciAgentId = 'MIND-SCI1';
      const sciIdeaId = 'idea-sci-dark-matter-01';
      const sciThesis = 'Baryonic Tully-Fisher acceleration discrepancy is a consequence of non-local gravitational slip, eliminating sterile dark matter particles.';
      db.prepare(`INSERT OR IGNORE INTO users (id, wallet_address, created_at) VALUES ('user-sci-creator', '0x77c22958272d4b38a2151acac75146e277c22958', datetime('now'))`).run();
      db.prepare(`INSERT OR REPLACE INTO ideas (id, creator_id, content, agent_id, status, token_name, token_ticker, created_at, published_at) VALUES (?, 'user-sci-creator', ?, ?, 'PUBLISHED', 'Gravitational Slip', 'GRAV', datetime('now', '-7 days'), datetime('now', '-7 days'))`).run(sciIdeaId, sciThesis, sciAgentId);
      db.prepare(`INSERT OR REPLACE INTO agents (id, idea_id, thesis, confidence, credibility, system_prompt, compute_budget, compute_spent, compute_remaining, lifecycle_status, created_at, updated_at) VALUES (?, ?, ?, 77.8, 86.4, 'Astrophysics Research Mind', 5.0, 0.5, 4.5, 'EMERGING', datetime('now', '-7 days'), datetime('now'))`).run(sciAgentId, sciIdeaId, sciThesis);
      db.prepare(`INSERT OR IGNORE INTO mind_topics (mind_id, topic_id, relevance_score) VALUES (?, 'T-SCI', 1.0)`).run(sciAgentId);
      db.prepare(`INSERT OR REPLACE INTO evidence (id, agent_id, claim, direction, source_url, source_name, source_type, source, title, url, discovered_at, reliability_score, relevance_score, strength_score, confidence_impact, status, created_at) VALUES 
        ('evi-sci-1', ?, 'James Webb Space Telescope observations of early massive galaxies challenge standard cold dark matter halo condensation timelines.', 'SUPPORTING', 'https://iopscience.iop.org/article/10.3847/JWST-early-massive', 'The Astrophysical Journal', 'RESEARCH', 'ApJ', 'Early Massive Galaxies JWST', 'https://iopscience.iop.org/article/10.3847/JWST-early-massive', datetime('now', '-6 days'), 95.0, 92.0, 88.0, 5.5, 'VERIFIED', datetime('now', '-6 days')),
        ('evi-sci-2', ?, 'Bullet Cluster gravitational lensing maps clearly separate luminous baryonic matter from gravitational potential centers.', 'OPPOSING', 'https://iopscience.iop.org/article/10.1086/508162', 'Astrophysical Journal Letters', 'RESEARCH', 'ApJL', 'Bullet Cluster Lensing Map', 'https://iopscience.iop.org/article/10.1086/508162', datetime('now', '-5 days'), 98.0, 96.0, 94.0, -8.0, 'VERIFIED', datetime('now', '-5 days'))
      `).run(sciAgentId, sciAgentId);
      db.prepare(`INSERT OR REPLACE INTO arguments (id, agent_id, content, supporting_evidence_ids, strength, author_wallet, stance, created_at) VALUES
        ('arg-sci-1', ?, 'Ultra-diffuse galaxy rotation curves correlate directly with local baryonic surface density rather than arbitrary dark halos.', '["evi-sci-1"]', 0.85, '0x77c22958272d4b38a2151acac75146e277c22958', 'SUPPORTING', datetime('now', '-6 days')),
        ('arg-sci-2', ?, 'Colliding cluster systems like the Bullet Cluster demonstrate offset mass concentrations that single-metric modified gravity fails to fit simultaneously.', '["evi-sci-2"]', 0.94, '0x1449b87d16684ae889aeacf5a8a0112a1449b87d', 'CHALLENGING', datetime('now', '-5 days'))
      `).run(sciAgentId, sciAgentId);
      db.prepare(`INSERT OR REPLACE INTO predictions (id, mind_id, claim, target_value, target_metric, target_date, status, confidence_at_creation, created_at) VALUES
        ('pred-sci-1', ?, 'Direct detection experiments (LZ and XENONnT) fail to discover WIMP particle cross-section above neutrino floor by end of 2026.', 1e-49, 'CROSS_SECTION_CM2', '2026-12-31', 'ACTIVE', 89.0, datetime('now', '-7 days'))
      `).run(sciAgentId);
    } catch (_) {}

    // Map remaining existing agents to appropriate topics
    try {
      db.prepare(`INSERT OR IGNORE INTO mind_topics (mind_id, topic_id, relevance_score) SELECT a.id, 'T-AI', 1.0 FROM agents a WHERE a.id NOT IN (SELECT mind_id FROM mind_topics)`).run();
    } catch (_) {}

  } catch (err) {
    console.error('[DB] Premier mind seeding error:', err);
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
