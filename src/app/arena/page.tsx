'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Panel from '@/components/ui/Panel';
import VoteBar from '@/components/ui/VoteBar';
import { listRooms, subscribeRoom } from '@/api/minds';
import type { ArenaRoom, ChatMessage } from '@/types/mind';
import { MOCK_CHAT_POOL } from '@/mocks/minds';

function ArenaContent() {
  const router = useRouter();
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

  // Initialize room chat and setup live subscription
  useEffect(() => {
    if (selectedRoomIndex === null) return;

    // Seed 4 initial messages
    const initial: ChatMessage[] = [];
    for (let k = 0; k < 4; k++) {
      const randomItem = MOCK_CHAT_POOL[Math.floor(Math.random() * MOCK_CHAT_POOL.length)];
      initial.push({
        id: Math.random().toString(36).substring(2, 9),
        user: randomItem[0],
        text: randomItem[1],
        timestamp: Date.now() - (4 - k) * 3000,
      });
    }
    setMessages(initial);
    setPollVotes([Math.floor(45 + Math.random() * 40), Math.floor(20 + Math.random() * 35)]);
    setHasVotedPoll(false);

    const roomId = rooms[selectedRoomIndex]?.id || 'room';
    const unsubscribe = subscribeRoom(roomId, (newMsg) => {
      setMessages((prev) => {
        const next = [...prev, newMsg];
        return next.slice(-40);
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
    if (!inputMsg.trim()) return;

    const myMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      user: 'You',
      text: inputMsg.trim(),
      timestamp: Date.now(),
      mine: true,
    };

    setMessages((prev) => [...prev.slice(-39), myMsg]);
    setInputMsg('');
  };

  const handleEmojiClick = (key: 'fire' | 'laugh' | 'mindblown') => {
    setEmojis((prev) => ({
      ...prev,
      [key]: prev[key] + 1,
    }));
  };

  const handleVotePoll = (choice: 0 | 1) => {
    if (hasVotedPoll) return;
    setPollVotes((prev) => {
      const next: [number, number] = [...prev];
      next[choice] += 1;
      return next;
    });
    setHasVotedPoll(true);
  };

  const selectedRoom = selectedRoomIndex !== null ? rooms[selectedRoomIndex] : null;
  const totalPollVotes = pollVotes[0] + pollVotes[1];
  const percentYes = Math.round((pollVotes[0] / totalPollVotes) * 100);
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
            {/* Link to Mind Dossier if available */}
            {selectedRoom.mindId && (
              <div style={{ marginBottom: '10px' }}>
                <button
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
              </div>
            )}

            <div
              id="chat"
              ref={chatContainerRef}
              aria-live="polite"
              aria-atomic="false"
              role="log"
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
                placeholder="Say something"
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
