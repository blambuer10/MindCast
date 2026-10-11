'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Panel from '@/components/ui/Panel';
import VoteBar from '@/components/ui/VoteBar';
import { listRooms, subscribeRoom } from '@/api/minds';
import type { ArenaRoom, ChatMessage } from '@/types/mind';
import { MOCK_CHAT_POOL } from '@/mocks/minds';
import { useWallet } from '@/hooks/useWallet';

// Helper to seed realistic initial conversation for a room once
function createInitialRoomMessages(roomName: string): ChatMessage[] {
  return [
    {
      id: `init-1-${Date.now() - 36000}`,
      user: 'nova.eth',
      text: `Looking closely at ${roomName}'s conviction metrics. The spread is tightening.`,
      timestamp: Date.now() - 36000,
    },
    {
      id: `init-2-${Date.now() - 25000}`,
      user: 'quant_kid',
      text: `Citations from recent peer publications directly validate the primary thesis.`,
      timestamp: Date.now() - 25000,
    },
    {
      id: `init-3-${Date.now() - 14000}`,
      user: roomName,
      text: `Empirical feedback integrated. Multi-agent confidence verified at current parameters.`,
      timestamp: Date.now() - 14000,
    },
    {
      id: `init-4-${Date.now() - 4000}`,
      user: 'oracle_jo',
      text: `Tracking resolution date. Stakers are backing the optimistic curve.`,
      timestamp: Date.now() - 4000,
    },
  ];
}

function ArenaContent() {
  const router = useRouter();
  const { isConnected, address } = useWallet();

  const [rooms, setRooms] = useState<ArenaRoom[]>([]);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [emojis, setEmojis] = useState({ fire: 12, laugh: 7, mindblown: 9 });
  const [pollVotes, setPollVotes] = useState<[number, number]>([63, 37]);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const data = await listRooms();
      setRooms(data);
    }
    load();
  }, []);

  // Initialize room chat from persistent storage or seed
  useEffect(() => {
    if (selectedRoomIndex === null || rooms.length === 0) return;

    const currentRoom = rooms[selectedRoomIndex];
    const roomId = currentRoom?.id || `room-${selectedRoomIndex}`;
    const storageKey = `mindcast_arena_chat_${roomId}`;
    const pollKey = `mindcast_arena_poll_${roomId}`;
    const emojiKey = `mindcast_arena_emojis_${roomId}`;

    // 1. Load Messages from localStorage
    let savedMessages: ChatMessage[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        savedMessages = JSON.parse(stored);
      }
    } catch (_) {}

    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      const initial = createInitialRoomMessages(currentRoom?.name || 'Mind 590A');
      setMessages(initial);
      try {
        localStorage.setItem(storageKey, JSON.stringify(initial));
      } catch (_) {}
    }

    // 2. Load Poll State
    try {
      const storedPoll = localStorage.getItem(pollKey);
      if (storedPoll) {
        const parsed = JSON.parse(storedPoll);
        setPollVotes(parsed.votes || [63, 37]);
        setHasVotedPoll(Boolean(parsed.hasVoted));
      } else {
        const defaultVotes: [number, number] = [
          Math.floor(45 + (selectedRoomIndex * 7) % 35),
          Math.floor(25 + (selectedRoomIndex * 5) % 25)
        ];
        setPollVotes(defaultVotes);
        setHasVotedPoll(false);
      }
    } catch (_) {}

    // 3. Load Emojis
    try {
      const storedEmojis = localStorage.getItem(emojiKey);
      if (storedEmojis) {
        setEmojis(JSON.parse(storedEmojis));
      } else {
        setEmojis({ fire: 12 + selectedRoomIndex, laugh: 7, mindblown: 9 + selectedRoomIndex });
      }
    } catch (_) {}

    // 4. Live Subscription — append incoming messages without resetting
    const unsubscribe = subscribeRoom(roomId, (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicate IDs
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const next = [...prev, newMsg].slice(-60); // keep last 60 messages
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [selectedRoomIndex, rooms]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || selectedRoomIndex === null) return;

    const roomId = rooms[selectedRoomIndex]?.id || `room-${selectedRoomIndex}`;
    const storageKey = `mindcast_arena_chat_${roomId}`;

    const userDisplayName = isConnected && address 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'You';

    const myMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user: userDisplayName,
      text: inputMsg.trim(),
      timestamp: Date.now(),
      mine: true,
    };

    setMessages((prev) => {
      const next = [...prev.slice(-59), myMsg];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    setInputMsg('');
  };

  const handleEmojiClick = (key: 'fire' | 'laugh' | 'mindblown') => {
    if (selectedRoomIndex === null) return;
    const roomId = rooms[selectedRoomIndex]?.id || `room-${selectedRoomIndex}`;
    const emojiKey = `mindcast_arena_emojis_${roomId}`;

    setEmojis((prev) => {
      const updated = {
        ...prev,
        [key]: prev[key] + 1,
      };
      try {
        localStorage.setItem(emojiKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const handleVotePoll = (choice: 0 | 1) => {
    if (hasVotedPoll || selectedRoomIndex === null) return;
    const roomId = rooms[selectedRoomIndex]?.id || `room-${selectedRoomIndex}`;
    const pollKey = `mindcast_arena_poll_${roomId}`;

    setPollVotes((prev) => {
      const next: [number, number] = [...prev];
      next[choice] += 1;
      try {
        localStorage.setItem(pollKey, JSON.stringify({ votes: next, hasVoted: true }));
      } catch (_) {}
      return next;
    });
    setHasVotedPoll(true);
  };

  const handleResetChatHistory = () => {
    if (selectedRoomIndex === null) return;
    const currentRoom = rooms[selectedRoomIndex];
    const roomId = currentRoom?.id || `room-${selectedRoomIndex}`;
    const storageKey = `mindcast_arena_chat_${roomId}`;
    const initial = createInitialRoomMessages(currentRoom?.name || 'Mind');
    setMessages(initial);
    try {
      localStorage.setItem(storageKey, JSON.stringify(initial));
    } catch (_) {}
  };

  const selectedRoom = selectedRoomIndex !== null ? rooms[selectedRoomIndex] : null;
  const totalPollVotes = pollVotes[0] + pollVotes[1];
  const percentYes = totalPollVotes > 0 ? Math.round((pollVotes[0] / totalPollVotes) * 100) : 50;
  const percentNo = 100 - percentYes;

  // Dynamic poll question based on selected room's mind
  const pollQuestion = selectedRoom
    ? `Will "${selectedRoom.name}" maintain high confidence through Q1 2027?`
    : 'Will this Mind maintain high confidence through Q1 2027?';

  return (
    <div className="pad">
      <div className="rooms" role="tablist" aria-label="Arena rooms">
        {rooms.map((room, idx) => {
          const isSelected = selectedRoomIndex === idx;
          return (
            <button
              key={room.id}
              className="room"
              style={{ ['--c' as any]: room.color }}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedRoomIndex(idx)}
            >
              <b>{room.name}</b>
              <span>{room.blurb}</span>
              <em>{room.online} here now</em>
            </button>
          );
        })}
      </div>

      {selectedRoom ? (
        <>
          <Panel
            title={`${selectedRoom.name} · live chat`}
            color={selectedRoom.color}
          >
            {/* Header toolbar for room */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              {selectedRoom.mindId ? (
                <button
                  type="button"
                  onClick={() => router.push(`/idea/${selectedRoom.mindId}`)}
                  style={{
                    background: 'rgba(79, 195, 247, 0.08)',
                    border: '1px solid rgba(79, 195, 247, 0.25)',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    color: 'var(--cyan)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  📄 Open Mind Dossier →
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleResetChatHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--mute)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
                title="Reset conversation history for this room"
              >
                ↻ Reset History
              </button>
            </div>

            <div
              id="chat"
              ref={chatContainerRef}
              aria-live="polite"
              aria-atomic="false"
              role="log"
              style={{ maxHeight: '380px', overflowY: 'auto' }}
            >
              {messages.map((m) => (
                <p key={m.id} style={m.mine ? { fontWeight: 600 } : undefined}>
                  <b style={{ color: m.mine ? 'var(--accent)' : selectedRoom.color }}>
                    {m.user}
                  </b>{' '}
                  {m.text}
                </p>
              ))}
            </div>

            <form className="send" onSubmit={handleSendMessage}>
              <input
                id="msg"
                placeholder={isConnected ? "Say something as verified staker..." : "Say something..."}
                aria-label="Message"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
              />
              <button type="submit" className="pri">
                Send
              </button>
            </form>

            <div className="emo">
              <button
                type="button"
                onClick={() => handleEmojiClick('fire')}
                aria-label="React with fire"
              >
                🔥 <i>{emojis.fire}</i>
              </button>
              <button
                type="button"
                onClick={() => handleEmojiClick('laugh')}
                aria-label="React with laugh"
              >
                😂 <i>{emojis.laugh}</i>
              </button>
              <button
                type="button"
                onClick={() => handleEmojiClick('mindblown')}
                aria-label="React with mind blown"
              >
                🤯 <i>{emojis.mindblown}</i>
              </button>
            </div>
          </Panel>

          <Panel title={pollQuestion}>
            <VoteBar
              percentageA={percentYes}
              labelA={`Yes ${percentYes}%`}
              colorA="var(--proven)"
              percentageB={percentNo}
              labelB={`No ${percentNo}%`}
              colorB="var(--bad)"
            />

            {hasVotedPoll ? (
              <p className="fine" style={{ marginTop: '12px' }}>
                Prediction locked in. {totalPollVotes} votes total.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => handleVotePoll(0)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => handleVotePoll(1)}
                >
                  No
                </button>
              </div>
            )}
          </Panel>
        </>
      ) : (
        <div className="empty">Choose a room to jump in.</div>
      )}
    </div>
  );
}

export default function ArenaPage() {
  return (
    <AppShell title="Arena">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <ArenaContent />
      </Suspense>
    </AppShell>
  );
}
