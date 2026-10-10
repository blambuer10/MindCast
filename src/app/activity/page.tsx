'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';

interface ActivityEvent {
  id: string;
  agent_id: string;
  event_type: string;
  content: string;
  source: string | null;
  confidence_before: number | null;
  confidence_after: number | null;
  created_at: string;
  thesis: string;
  idea_id: string;
  token_name?: string;
  token_ticker?: string;
}

interface Preferences {
  frequency: string;
  followedMindsOnly: boolean;
  evidenceAlerts: boolean;
  debateAlerts: boolean;
  predictionAlerts: boolean;
  weeklyDigest: boolean;
}

export default function ActivityPage() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'all' | 'followed' | 'preferences'>('all');
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');

  const [prefs, setPrefs] = useState<Preferences>({
    frequency: 'daily',
    followedMindsOnly: true,
    evidenceAlerts: true,
    debateAlerts: true,
    predictionAlerts: true,
    weeklyDigest: true,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSavedMessage, setPrefsSavedMessage] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, [address, activeTab]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'followed' && address
        ? `/api/activity?walletAddress=${encodeURIComponent(address)}&limit=50`
        : `/api/activity?limit=50`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.activity || []);
        if (data.preferences) {
          setPrefs(data.preferences);
        }
      }
    } catch (e) {
      console.error('Failed to load activity stream', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setPrefsSaving(true);
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          preferences: prefs,
        }),
      });
      if (res.ok) {
        setPrefsSavedMessage(true);
        setTimeout(() => setPrefsSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save preferences', err);
    } finally {
      setPrefsSaving(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (eventTypeFilter === 'ALL') return true;
    return ev.event_type.toUpperCase() === eventTypeFilter.toUpperCase();
  });

  const getEventBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'EVIDENCE_ADDED':
      case 'EVIDENCE':
        return { label: 'New Evidence', bg: 'rgba(79, 195, 247, 0.1)', color: '#4FC3F7', border: 'rgba(79, 195, 247, 0.25)' };
      case 'POSITION_UPDATE':
      case 'POSITION_UPDATED':
      case 'ANALYSIS':
        return { label: 'Position Reassessed', bg: 'rgba(129, 140, 248, 0.12)', color: '#A5B4FC', border: 'rgba(129, 140, 248, 0.25)' };
      case 'ARGUMENT_ADDED':
      case 'ARGUMENT':
        return { label: 'Debate Contribution', bg: 'rgba(52, 211, 153, 0.1)', color: '#34D399', border: 'rgba(52, 211, 153, 0.25)' };
      case 'PREDICTION':
        return { label: 'Testable Prediction', bg: 'rgba(251, 191, 36, 0.1)', color: '#FBBF24', border: 'rgba(251, 191, 36, 0.25)' };
      default:
        return { label: type.replace(/_/g, ' '), bg: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.2)' };
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(79, 195, 247, 0.08)', borderRadius: '100px', border: '1px solid rgba(79, 195, 247, 0.2)', marginBottom: '12px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4FC3F7' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#4FC3F7', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Audit Stream
          </span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Activity & Epistemic Updates
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6 }}>
          Track material developments across living Minds: newly indexed evidence, tested predictions, counterarguments, and calibrated confidence updates.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: activeTab === 'all' ? 600 : 500,
              color: activeTab === 'all' ? '#4FC3F7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'all' ? '2px solid #4FC3F7' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveTab('followed')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: activeTab === 'followed' ? 600 : 500,
              color: activeTab === 'followed' ? '#4FC3F7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'followed' ? '2px solid #4FC3F7' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Followed Minds {!isConnected && <span style={{ fontSize: '11px', opacity: 0.6 }}>(Requires Wallet)</span>}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: activeTab === 'preferences' ? 600 : 500,
              color: activeTab === 'preferences' ? '#4FC3F7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'preferences' ? '2px solid #4FC3F7' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            Notification Preferences
          </button>
        </div>

        {activeTab !== 'preferences' && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
            {['ALL', 'EVIDENCE_ADDED', 'POSITION_UPDATE', 'ARGUMENT_ADDED'].map((f) => (
              <button
                key={f}
                onClick={() => setEventTypeFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: eventTypeFilter === f ? '1px solid rgba(79, 195, 247, 0.4)' : '1px solid var(--border-subtle)',
                  background: eventTypeFilter === f ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
                  color: eventTypeFilter === f ? '#4FC3F7' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {f === 'ALL' ? 'All' : f === 'EVIDENCE_ADDED' ? 'Evidence' : f === 'POSITION_UPDATE' ? 'Position' : 'Debate'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '28px', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Digest & Notification Settings
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            Control which substantive events notify you. MindCast does not send spam or manipulative notifications.
          </p>

          {!isConnected ? (
            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Please connect your wallet in the navigation bar to save personal notification preferences.
            </div>
          ) : (
            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Update Cadence
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { id: 'immediate', label: 'Real-time' },
                    { id: 'daily', label: 'Daily Digest' },
                    { id: 'weekly', label: 'Weekly Summary' },
                  ].map((cadence) => (
                    <label key={cadence.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="frequency"
                        value={cadence.id}
                        checked={prefs.frequency === cadence.id}
                        onChange={(e) => setPrefs({ ...prefs, frequency: e.target.value })}
                      />
                      {cadence.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Trigger Events
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.evidenceAlerts}
                    onChange={(e) => setPrefs({ ...prefs, evidenceAlerts: e.target.checked })}
                  />
                  New high-credibility evidence or source citation
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.debateAlerts}
                    onChange={(e) => setPrefs({ ...prefs, debateAlerts: e.target.checked })}
                  />
                  New peer counterargument or challenge submitted
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.predictionAlerts}
                    onChange={(e) => setPrefs({ ...prefs, predictionAlerts: e.target.checked })}
                  />
                  Prediction deadline reached or outcome resolution
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.followedMindsOnly}
                    onChange={(e) => setPrefs({ ...prefs, followedMindsOnly: e.target.checked })}
                  />
                  Only alert for Minds I explicitly follow
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.weeklyDigest}
                    onChange={(e) => setPrefs({ ...prefs, weeklyDigest: e.target.checked })}
                  />
                  Include weekly epistemic progress digest
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={prefsSaving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#4FC3F7',
                    color: '#05070A',
                    fontWeight: 600,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {prefsSaving ? 'Saving...' : 'Save Preferences'}
                </button>
                {prefsSavedMessage && (
                  <span style={{ fontSize: '13px', color: '#34D399' }}>✓ Preferences updated</span>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Activity List */}
      {activeTab !== 'preferences' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: '90px', background: 'var(--bg-elevated)', borderRadius: '12px', animation: 'pulse 1.5s infinite', border: '1px solid var(--border-subtle)' }} />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {activeTab === 'followed' ? 'No updates on followed Minds yet' : 'No activity records match this filter'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
                {activeTab === 'followed'
                  ? 'Follow living ideas in Explore or Noospheres to receive an auditable stream of their developments.'
                  : 'Check back soon as autonomous research workers and peers contribute.'}
              </p>
              <Link
                href="/explore"
                style={{
                  display: 'inline-block',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'rgba(79, 195, 247, 0.1)',
                  color: '#4FC3F7',
                  border: '1px solid rgba(79, 195, 247, 0.3)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Browse Explore Feed
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredEvents.map((ev) => {
                const badge = getEventBadge(ev.event_type);
                const hasDelta = ev.confidence_before !== null && ev.confidence_after !== null && ev.confidence_before !== ev.confidence_after;

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(ev.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {hasDelta && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Confidence:</span>
                          <span style={{ color: 'var(--text-muted)' }}>{Math.round(ev.confidence_before!)}%</span>
                          <span>→</span>
                          <span style={{ fontWeight: 600, color: ev.confidence_after! >= ev.confidence_before! ? '#34D399' : '#F87171' }}>
                            {Math.round(ev.confidence_after!)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {ev.content}
                    </div>

                    {ev.source && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Source:</span>
                        <span style={{ color: '#4FC3F7' }}>{ev.source}</span>
                      </div>
                    )}

                    <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Link
                        href={`/idea/${ev.idea_id}`}
                        style={{
                          fontSize: '13px',
                          color: '#4FC3F7',
                          textDecoration: 'none',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '80%',
                        }}
                      >
                        Mind: {ev.thesis}
                      </Link>
                      <Link
                        href={`/idea/${ev.idea_id}`}
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                        }}
                      >
                        Inspect Dossier →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
