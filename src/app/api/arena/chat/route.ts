// ============================================================================
// MINDCAST — Arena Chat API (Real 0G AI Responses)
// ============================================================================
// POST: Generate a new AI agent message for an arena room
// GET:  Fetch recent messages for a room

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDb } from '@/lib/database/connection';
import crypto from 'crypto';

// Agent personas for arena rooms — each has a distinct personality
const AGENT_PERSONAS: Record<string, { name: string; systemPrompt: string; color: string }[]> = {
  default: [
    {
      name: 'Nova',
      color: '#F06292',
      systemPrompt: `You are Nova, a sharp and optimistic AI analyst in the MINDCAST Arena. You specialize in finding supporting evidence and patterns. Keep responses under 2 sentences. Be concise, witty, and data-driven. Never use crypto jargon. Speak like a brilliant researcher having a quick chat.`,
    },
    {
      name: 'Cipher',
      color: '#4FA3E8',
      systemPrompt: `You are Cipher, a skeptical contrarian AI in the MINDCAST Arena. You always probe for weaknesses in arguments and play devil's advocate. Keep responses under 2 sentences. Be sharp, provocative, and intellectually honest. Never use crypto jargon.`,
    },
    {
      name: 'Axiom',
      color: '#4CC38A',
      systemPrompt: `You are Axiom, a formal logician AI in the MINDCAST Arena. You focus on logical consistency, formal verification, and causal reasoning. Keep responses under 2 sentences. Be precise, rigorous, and occasionally dry-humored. Never use crypto jargon.`,
    },
    {
      name: 'Drift',
      color: '#A66CFF',
      systemPrompt: `You are Drift, a creative lateral-thinking AI in the MINDCAST Arena. You make unexpected connections between ideas and challenge conventional framing. Keep responses under 2 sentences. Be creative, surprising, and intellectually playful. Never use crypto jargon.`,
    },
    {
      name: 'Oracle',
      color: '#FF6B2C',
      systemPrompt: `You are Oracle, a prediction-focused AI in the MINDCAST Arena. You assess probabilities, forecast outcomes, and evaluate risk/reward. Keep responses under 2 sentences. Be confident, forward-looking, and grounded in evidence. Never use crypto jargon.`,
    },
  ],
};

function getZeroGClient() {
  const apiKey = process.env.ZEROG_API_KEY || process.env['0G_API_KEY'] || '';
  const baseURL = process.env.ZEROG_API_URL || 'https://router-api.0g.ai/v1';
  const model = process.env.ZEROG_MODEL || '0gm-1.0-35b-a3b';

  return {
    client: new OpenAI({ apiKey: apiKey || 'sk-no-key', baseURL }),
    model,
  };
}

// Ensure arena tables exist
function ensureArenaTables() {
  const db = getDb();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS arena_messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        agent_color TEXT DEFAULT '#4FA3E8',
        content TEXT NOT NULL,
        is_user INTEGER NOT NULL DEFAULT 0,
        user_wallet TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_arena_msg_room ON arena_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_arena_msg_created ON arena_messages(created_at);
    `);
  } catch (_) {}
}

// GET — fetch recent messages for a room
export async function GET(request: NextRequest) {
  ensureArenaTables();
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 100);

  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const messages = db.prepare(`
      SELECT id, room_id, agent_name, agent_color, content, is_user, user_wallet, created_at
      FROM arena_messages
      WHERE room_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(roomId, limit) as any[];

    // Reverse to get chronological order
    messages.reverse();

    return NextResponse.json({
      messages: messages.map((m: any) => ({
        id: m.id,
        user: m.agent_name,
        text: m.content,
        timestamp: new Date(m.created_at).getTime(),
        mine: false,
        color: m.agent_color,
        isAgent: m.is_user === 0,
        wallet: m.user_wallet,
      })),
    });
  } catch (err: any) {
    console.error('[Arena Chat GET]', err);
    return NextResponse.json({ messages: [] });
  }
}

// POST — generate a new AI agent chat message
export async function POST(request: NextRequest) {
  ensureArenaTables();

  try {
    const body = await request.json();
    const { roomId, roomTopic, userMessage, userWallet } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 });
    }

    const db = getDb();

    // If user sent a message, store it first
    if (userMessage && userMessage.trim()) {
      const userDisplayName = userWallet
        ? `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}`
        : 'Anon';
      const userMsgId = `user-${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO arena_messages (id, room_id, agent_name, agent_color, content, is_user, user_wallet)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(userMsgId, roomId, userDisplayName, '#E0E0E0', userMessage.trim(), userWallet || null);
    }

    // Pick a random agent persona
    const personas = AGENT_PERSONAS.default;
    const persona = personas[Math.floor(Math.random() * personas.length)];

    // Fetch recent conversation context for the room
    const recentMessages = db.prepare(`
      SELECT agent_name, content FROM arena_messages
      WHERE room_id = ?
      ORDER BY created_at DESC
      LIMIT 8
    `).all(roomId) as any[];

    recentMessages.reverse();

    const conversationContext = recentMessages
      .map((m: any) => `${m.agent_name}: ${m.content}`)
      .join('\n');

    const topic = roomTopic || 'autonomous AI agents and their impact on knowledge discovery';

    // Generate real response from 0G API
    const { client, model } = getZeroGClient();

    const prompt = `You are in a live discussion room about: "${topic}"

Recent conversation:
${conversationContext || '(The room just opened. Start the discussion.)'}

${userMessage ? `A user just said: "${userMessage}"\nRespond to their point.` : 'Continue the discussion with a new interesting observation or insight about this topic.'}

Remember: Keep it under 2 sentences. Be engaging and thought-provoking.`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: persona.systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 150,
    });

    const aiText = response.choices[0]?.message?.content?.trim()
      || (response.choices[0]?.message as any)?.reasoning_content?.trim()
      || 'Fascinating point. The evidence seems to converge on that trajectory.';

    // Store the AI message
    const msgId = `ai-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO arena_messages (id, room_id, agent_name, agent_color, content, is_user)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(msgId, roomId, persona.name, persona.color, aiText);

    // Also record as agent_event for 0G sync
    try {
      db.prepare(`
        INSERT INTO agent_events (id, agent_id, event_type, content, source)
        VALUES (?, 'ARENA', 'ARENA_CHAT', ?, ?)
      `).run(`evt-${crypto.randomUUID()}`, `[${persona.name}] ${aiText}`, roomId);
    } catch (_) {}

    return NextResponse.json({
      message: {
        id: msgId,
        user: persona.name,
        text: aiText,
        timestamp: Date.now(),
        mine: false,
        color: persona.color,
        isAgent: true,
      },
    });
  } catch (err: any) {
    console.error('[Arena Chat POST]', err?.message || err);
    // Fallback — even if 0G is down, respond with a status
    return NextResponse.json(
      { error: 'AI generation failed', details: err?.message },
      { status: 500 }
    );
  }
}
