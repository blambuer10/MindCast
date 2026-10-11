// ============================================================================
// MINDCAST — Arena Reactions API (One-Click-Per-User Enforcement)
// ============================================================================
// POST: Add a reaction (emoji click) — enforced one-per-user-per-room-per-emoji
// GET:  Get reaction counts and user's existing reactions for a room

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/connection';
import crypto from 'crypto';

function ensureReactionTables() {
  const db = getDb();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS arena_reactions (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        user_wallet TEXT NOT NULL,
        emoji_type TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(room_id, user_wallet, emoji_type)
      );
      CREATE INDEX IF NOT EXISTS idx_arena_react_room ON arena_reactions(room_id);
      CREATE INDEX IF NOT EXISTS idx_arena_react_wallet ON arena_reactions(user_wallet);
    `);
  } catch (_) {}
}

// GET — get reaction counts and user's existing reactions
export async function GET(request: NextRequest) {
  ensureReactionTables();
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const userWallet = searchParams.get('wallet');

  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  }

  try {
    const db = getDb();

    // Get counts per emoji
    const counts = db.prepare(`
      SELECT emoji_type, COUNT(*) as count
      FROM arena_reactions
      WHERE room_id = ?
      GROUP BY emoji_type
    `).all(roomId) as any[];

    const countsMap: Record<string, number> = {};
    for (const row of counts) {
      countsMap[row.emoji_type] = row.count;
    }

    // Get user's existing reactions
    let userReactions: string[] = [];
    if (userWallet) {
      const rows = db.prepare(`
        SELECT emoji_type FROM arena_reactions
        WHERE room_id = ? AND user_wallet = ?
      `).all(roomId, userWallet.toLowerCase()) as any[];
      userReactions = rows.map((r: any) => r.emoji_type);
    }

    return NextResponse.json({
      counts: {
        fire: countsMap['fire'] || 0,
        laugh: countsMap['laugh'] || 0,
        mindblown: countsMap['mindblown'] || 0,
      },
      userReactions,
    });
  } catch (err: any) {
    console.error('[Arena Reactions GET]', err);
    return NextResponse.json({
      counts: { fire: 0, laugh: 0, mindblown: 0 },
      userReactions: [],
    });
  }
}

// POST — add a reaction (one per user per emoji per room)
export async function POST(request: NextRequest) {
  ensureReactionTables();

  try {
    const body = await request.json();
    const { roomId, emojiType, userWallet } = body;

    if (!roomId || !emojiType || !userWallet) {
      return NextResponse.json(
        { error: 'roomId, emojiType, and userWallet are required' },
        { status: 400 }
      );
    }

    const validEmojis = ['fire', 'laugh', 'mindblown'];
    if (!validEmojis.includes(emojiType)) {
      return NextResponse.json({ error: 'Invalid emoji type' }, { status: 400 });
    }

    const db = getDb();
    const wallet = userWallet.toLowerCase();

    // Check if user already reacted with this emoji in this room
    const existing = db.prepare(`
      SELECT id FROM arena_reactions
      WHERE room_id = ? AND user_wallet = ? AND emoji_type = ?
    `).get(roomId, wallet, emojiType) as any;

    if (existing) {
      return NextResponse.json(
        { error: 'Already reacted', alreadyReacted: true },
        { status: 409 }
      );
    }

    // Insert the reaction
    const reactionId = `react-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO arena_reactions (id, room_id, user_wallet, emoji_type)
      VALUES (?, ?, ?, ?)
    `).run(reactionId, roomId, wallet, emojiType);

    // Get updated counts
    const counts = db.prepare(`
      SELECT emoji_type, COUNT(*) as count
      FROM arena_reactions
      WHERE room_id = ?
      GROUP BY emoji_type
    `).all(roomId) as any[];

    const countsMap: Record<string, number> = {};
    for (const row of counts) {
      countsMap[row.emoji_type] = row.count;
    }

    // Get user's updated reactions
    const userRows = db.prepare(`
      SELECT emoji_type FROM arena_reactions
      WHERE room_id = ? AND user_wallet = ?
    `).all(roomId, wallet) as any[];

    return NextResponse.json({
      success: true,
      counts: {
        fire: countsMap['fire'] || 0,
        laugh: countsMap['laugh'] || 0,
        mindblown: countsMap['mindblown'] || 0,
      },
      userReactions: userRows.map((r: any) => r.emoji_type),
    });
  } catch (err: any) {
    console.error('[Arena Reactions POST]', err);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}
