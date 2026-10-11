'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Panel from '@/components/ui/Panel';
import VoteBar from '@/components/ui/VoteBar';
import { listRooms, subscribeRoom } from '@/api/minds';
import type { ArenaRoom, ChatMessage } from '@/types/mind';
import { useWallet } from '@/hooks/useWallet';

function ArenaContent() {
  const router = useRouter();
  const { isConnected, address } = useWallet();

  const [rooms, setRooms] = useState<ArenaRoom[]>([]);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number | null>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [emojis, setEmojis] = useState({ fire: 0, laugh: 0, mindblown: 0 });
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [pollVotes, setPollVotes] = useState<[number, number]>([63, 37]);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load rooms
  useEffect(() => {
    async function load() {
      const data = await listRooms();
      setRooms(data);
    }
    load();
  }, []);

  // Load room data: messages from DB, reactions, poll state
  useEffect(() => {
    if (selectedRoomIndex === null || rooms.length === 0) return;

    const currentRoom = rooms[selectedRoomIndex];
    const roomId = currentRoom?.id || `room-${selectedRoomIndex}`;

    // 1. Load existing messages from the API (stored in DB)
    setLoadingChat(true);
    fetch(`/api/arena/chat?roomId=${roomId}&limit=40`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingChat(false));

    // 2. Load reaction counts and user's existing reactions
    const walletQuery = address ? `&wallet=${address}` : '';
    fetch(`/api/arena/reactions?roomId=${roomId}${walletQuery}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.counts) {
          setEmojis(data.counts);
        }
        if (data.userReactions) {
          setUserReactions(data.userReactions);
        }
      })
      .catch(() => {
        setEmojis({ fire: 0, laugh: 0, mindblown: 0 });
        setUserReactions([]);
      });

    // 3. Load Poll State from localStorage (poll is per-session for now)
    const pollKey = `mindcast_arena_poll_${roomId}`;
    try {
      const storedPoll = localStorage.getItem(pollKey);
      if (storedPoll) {
        const parsed = JSON.parse(storedPoll);
        setPollVotes(parsed.votes || [63, 37]);
        setHasVotedPoll(Boolean(parsed.hasVoted));
      } else {
        const defaultVotes: [number, number] = [
          Math.floor(45 + (selectedRoomIndex * 7) % 35),
          Math.floor(25 + (selectedRoomIndex * 5) % 25),
        ];
        setPollVotes(defaultVotes);
        setHasVotedPoll(false);
      }
    } catch (_) {}

    // 4. Live subscription — real AI agent messages via 0G API
    const roomTopic = currentRoom?.blurb || currentRoom?.name || '';
    const unsubscribe = subscribeRoom(roomId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg].slice(-60);
      });
    }, roomTopic);

    return () => {
      unsubscribe();
    };
  }, [selectedRoomIndex, rooms, address]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send user message — triggers real AI response
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || selectedRoomIndex === null || sendingMessage) return;

    const currentRoom = rooms[selectedRoomIndex];
    const roomId = currentRoom?.id || `room-${selectedRoomIndex}`;

    const userDisplayName = isConnected && address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'You';

    // Optimistically add user message
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const myMsg: ChatMessage = {
      id: tempId,
      user: userDisplayName,
      text: inputMsg.trim(),
      timestamp: Date.now(),
      mine: true,
    };

    setMessages((prev) => [...prev.slice(-59), myMsg]);
    const messageText = inputMsg.trim();
    setInputMsg('');
    setSendingMessage(true);

    // Send to backend — which also triggers an AI response
    try {
      const res = await fetch('/api/arena/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          roomTopic: currentRoom?.blurb || currentRoom?.name || '',
          userMessage: messageText,
          userWallet: address || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message].slice(-60);
          });
        }
      }
    } catch (err) {
      console.warn('[Arena] Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  }, [inputMsg, selectedRoomIndex, rooms, isConnected, address, sendingMessage]);

  // Emoji click — one per user per emoji per room (enforced server-side)
  const handleEmojiClick = useCallback(async (key: 'fire' | 'laugh' | 'mindblown') => {
    if (selectedRoomIndex === null) return;

    // Must be connected to react
    if (!isConnected || !address) {
      alert('Connect your wallet to react');
      return;
    }

    // Already reacted client-side check
    if (userReactions.includes(key)) {
      return;
    }

    const roomId = rooms[selectedRoomIndex]?.id || `room-${selectedRoomIndex}`;

    // Optimistic update
    setEmojis((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setUserReactions((prev) => [...prev, key]);

    try {
      const res = await fetch('/api/arena/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          emojiType: key,
          userWallet: address,
        }),
      });

      const data = await res.json();

      if (res.ok && data.counts) {
        setEmojis(data.counts);
        setUserReactions(data.userReactions || []);
      } else if (data.alreadyReacted) {
        // Revert optimistic update
        setEmojis((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
        setUserReactions((prev) => prev.filter((r) => r !== key));
      }
    } catch (err) {
      // Revert on error
      setEmojis((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
      setUserReactions((prev) => prev.filter((r) => r !== key));
    }
  }, [selectedRoomIndex, rooms, isConnected, address, userReactions]);

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

  const selectedRoom = selectedRoomIndex !== null ? rooms[selectedRoomIndex] : null;
  const totalPollVotes = pollVotes[0] + pollVotes[1];
  const percentYes = totalPollVotes > 0 ? Math.round((pollVotes[0] / totalPollVotes) * 100) : 50;
  const percentNo = 100 - percentYes;

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
            {/* Header toolbar */}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--proven)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--proven)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  Powered by 0G AI
                </span>
              </div>
            </div>

            <div
              id="chat"
              ref={chatContainerRef}
              aria-live="polite"
              aria-atomic="false"
              role="log"
              style={{ maxHeight: '380px', overflowY: 'auto' }}
            >
              {loadingChat && messages.length === 0 && (
                <p style={{ color: 'var(--mute)', fontStyle: 'italic', textAlign: 'center' }}>
                  Loading conversation...
                </p>
              )}
              {!loadingChat && messages.length === 0 && (
                <p style={{ color: 'var(--mute)', fontStyle: 'italic', textAlign: 'center' }}>
                  Room is quiet. Say something to start the discussion!
                </p>
              )}
              {messages.map((m) => (
                <p key={m.id} style={m.mine ? { fontWeight: 600 } : undefined}>
                  <b style={{ color: m.mine ? 'var(--accent)' : selectedRoom.color }}>
                    {m.user}
                  </b>{' '}
                  {m.text}
                </p>
              ))}
              {sendingMessage && (
                <p style={{ color: 'var(--mute)', fontStyle: 'italic' }}>
                  🤖 Agent is thinking...
                </p>
              )}
            </div>

            <form className="send" onSubmit={handleSendMessage}>
              <input
                id="msg"
                placeholder={isConnected ? "Say something as verified staker..." : "Say something..."}
                aria-label="Message"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={sendingMessage}
              />
              <button type="submit" className="pri" disabled={sendingMessage}>
                {sendingMessage ? '...' : 'Send'}
              </button>
            </form>

            <div className="emo">
              <button
                type="button"
                onClick={() => handleEmojiClick('fire')}
                aria-label="React with fire"
                disabled={userReactions.includes('fire')}
                style={userReactions.includes('fire') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                title={userReactions.includes('fire') ? 'Already reacted' : 'React with 🔥'}
              >
                🔥 <i>{emojis.fire}</i>
              </button>
              <button
                type="button"
                onClick={() => handleEmojiClick('laugh')}
                aria-label="React with laugh"
                disabled={userReactions.includes('laugh')}
                style={userReactions.includes('laugh') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                title={userReactions.includes('laugh') ? 'Already reacted' : 'React with 😂'}
              >
                😂 <i>{emojis.laugh}</i>
              </button>
              <button
                type="button"
                onClick={() => handleEmojiClick('mindblown')}
                aria-label="React with mind blown"
                disabled={userReactions.includes('mindblown')}
                style={userReactions.includes('mindblown') ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                title={userReactions.includes('mindblown') ? 'Already reacted' : 'React with 🤯'}
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
