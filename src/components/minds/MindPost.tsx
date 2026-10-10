'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Mind, MindDebateItem, MindPredictionItem } from '@/types/mind';
import { NOOSPHERES } from '@/lib/scoring';
import Avatar from '../ui/Avatar';
import StatusTag from '../ui/StatusTag';
import ReactionDots from '../ui/ReactionDots';
import ConfidenceMeter from '../ui/ConfidenceMeter';
import { ChatIcon, QuoteIcon } from '../ui/Icons';
import { generateDebates, generatePredictions } from '@/mocks/minds';

interface MindPostProps {
  mind: Mind;
}

export default function MindPost({ mind }: MindPostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'debate' | 'predictions'>('debate');
  const [likedDebates, setLikedDebates] = useState<Record<string, boolean>>({});

  const noosphereConfig = NOOSPHERES.find((n) => n.name === mind.noosphere);
  const color = noosphereConfig?.color || '#F06292';
  const initials = mind.name.split(' ')[1]?.slice(0, 3) || mind.name.slice(0, 3);

  // Fallback to generated items if not present
  const debates: MindDebateItem[] = mind.debatesList && mind.debatesList.length > 0
    ? mind.debatesList
    : generateDebates(mind.name, mind.claim, mind.stanceString, mind.confidence);

  const predictions: MindPredictionItem[] = mind.predictionsList && mind.predictionsList.length > 0
    ? mind.predictionsList
    : generatePredictions(mind.name, mind.claim, mind.confidence, mind.year);

  const debateCount = debates.length;
  const predictionCount = predictions.length;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleTabClick = (e: React.MouseEvent, tab: 'debate' | 'predictions') => {
    e.stopPropagation();
    setActiveTab(tab);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const toggleLike = (e: React.MouseEvent, debateId: string) => {
    e.stopPropagation();
    setLikedDebates(prev => ({ ...prev, [debateId]: !prev[debateId] }));
  };

  return (
    <article
      className={`post ${isOpen ? 'open' : ''}`}
      style={{ ['--c' as any]: color }}
      onClick={toggleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleOpen();
        }
      }}
      aria-expanded={isOpen}
      aria-label={`Mind: ${mind.name}`}
    >
      <Avatar color={color} initials={initials} />

      <div className="pb">
        <div className="who">
          <b>{mind.name}</b>
          <span>@{mind.handle} · {mind.dateFormatted}</span>
          <StatusTag status={mind.status} />
        </div>

        <p className="txt">
          <Link
            href={`/idea/${mind.id}`}
            className="claim-link"
            onClick={(e) => e.stopPropagation()}
          >
            {mind.claim}
          </Link>
        </p>

        <p className="sum">{mind.summary}</p>

        <div className="src">
          <small>Source · {mind.sourceTitle}</small>
          {mind.sourceExcerpt}
        </div>

        {/* X-Style Action Bar with Debate & Predictions triggers */}
        <div className="acts">
          <ReactionDots stanceString={mind.stanceString} panel={mind.panel} />

          <button
            type="button"
            className={`x-stat-btn ${isOpen && activeTab === 'debate' ? 'active' : ''}`}
            onClick={(e) => handleTabClick(e, 'debate')}
            title="Debate arguments and comments"
          >
            <ChatIcon className="i" />
            <span>Debate ({debateCount})</span>
          </button>

          <button
            type="button"
            className={`x-stat-btn ${isOpen && activeTab === 'predictions' ? 'active' : ''}`}
            onClick={(e) => handleTabClick(e, 'predictions')}
            title="Verifiable future predictions"
          >
            <span className="x-pred-bullet">🎯</span>
            <span>Predictions ({predictionCount})</span>
          </button>

          <span title={`${mind.citations} citations`}>
            <QuoteIcon className="i" />
            {mind.citations}
          </span>

          <ConfidenceMeter confidence={mind.confidence} status={mind.status} />
        </div>

        {/* Expanded X-Style Comments & Replies Area */}
        {isOpen && (
          <div className="x-thread-container" onClick={(e) => e.stopPropagation()}>
            {/* Tab switch header */}
            <div className="x-thread-tabs">
              <button
                type="button"
                className={`x-thread-tab ${activeTab === 'debate' ? 'selected' : ''}`}
                onClick={(e) => handleTabClick(e, 'debate')}
              >
                💬 Debate ({debateCount})
                <small className="x-tab-sub">Live AI & Peer Arguments</small>
              </button>
              <button
                type="button"
                className={`x-thread-tab ${activeTab === 'predictions' ? 'selected' : ''}`}
                onClick={(e) => handleTabClick(e, 'predictions')}
              >
                🎯 Predictions ({predictionCount})
                <small className="x-tab-sub">Verifiable Future Milestones</small>
              </button>
            </div>

            {/* TAB 1: DEBATE COMMENTS (X-STYLE REPLIES) */}
            {activeTab === 'debate' && (
              <div className="x-replies-list">
                <div className="x-replies-header">
                  <span>🧠 <b>Epistemic Debate Thread</b> — AI Models & Peer Arguments</span>
                  <Link href={`/idea/${mind.id}?tab=debate`} className="x-join-btn">
                    Join Debate +
                  </Link>
                </div>

                {debates.map((item) => {
                  const isLiked = Boolean(likedDebates[item.id]);
                  const stanceBadge =
                    item.stance === 'agree'
                      ? { label: 'SUPPORTS', cls: 'agree' }
                      : item.stance === 'disagree'
                      ? { label: 'CHALLENGES', cls: 'disagree' }
                      : { label: 'SPLIT / CONDITIONAL', cls: 'split' };

                  return (
                    <div key={item.id} className="x-reply-card">
                      <div
                        className="x-reply-avatar"
                        style={{ backgroundColor: item.avatarColor || '#3B82F6' }}
                      >
                        {item.author.charAt(0)}
                      </div>

                      <div className="x-reply-body">
                        <div className="x-reply-meta">
                          <span className="x-author-name">{item.author}</span>
                          <span className="x-author-handle">@{item.handle}</span>
                          <span className="x-reply-time">· {item.timestamp || '2h'}</span>
                          {item.badge && <span className="x-badge">{item.badge}</span>}
                          {item.role && <span className="x-role-tag">{item.role}</span>}
                        </div>

                        {/* Stance indicator */}
                        <div className={`x-stance-pill ${stanceBadge.cls}`}>
                          <span className="dot" />
                          {stanceBadge.label}
                        </div>

                        {/* Comment text */}
                        <p className="x-reply-text">{item.content}</p>

                        {/* Interaction buttons */}
                        <div className="x-reply-actions">
                          <button
                            type="button"
                            className={`x-like-btn ${isLiked ? 'liked' : ''}`}
                            onClick={(e) => toggleLike(e, item.id)}
                          >
                            <span>{isLiked ? '❤️' : '🤍'}</span>
                            <span>{(item.likes || 12) + (isLiked ? 1 : 0)}</span>
                          </button>
                          <Link
                            href={`/idea/${mind.id}?tab=debate`}
                            className="x-action-link"
                          >
                            <span>💬 Reply</span>
                          </Link>
                          <span className="x-audit-label">✓ Epistemic Audit Verified</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="x-thread-footer">
                  <Link href={`/idea/${mind.id}?tab=debate`} className="x-view-full-thread">
                    View all {debateCount} arguments & counter-theses →
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: PREDICTIONS (X-STYLE PREDICTION MARKETS & MILESTONES) */}
            {activeTab === 'predictions' && (
              <div className="x-predictions-list">
                <div className="x-replies-header">
                  <span>🎯 <b>Verifiable Predictions</b> — Milestones & Target Outcomes</span>
                  <Link href={`/idea/${mind.id}?tab=predictions`} className="x-join-btn">
                    Add Prediction +
                  </Link>
                </div>

                {predictions.map((pred, idx) => {
                  const statusColor =
                    pred.status === 'Proven'
                      ? 'status-proven'
                      : pred.status === 'Active'
                      ? 'status-active'
                      : 'status-pending';

                  return (
                    <div key={pred.id || idx} className="x-prediction-card">
                      <div className="x-pred-header">
                        <div className="x-pred-tag-group">
                          <span className="x-pred-number">PREDICTION #{idx + 1}</span>
                          <span className={`x-pred-status ${statusColor}`}>
                            ● {pred.status === 'Proven' ? 'Proven' : pred.status === 'Active' ? 'Active' : 'Pending'}
                          </span>
                        </div>
                        <span className="x-pred-date">📅 Target: <b>{pred.targetDate}</b></span>
                      </div>

                      <h4 className="x-pred-claim">{pred.claim}</h4>

                      <p className="x-pred-explanation">
                        <b>🔍 Thesis Significance:</b> {pred.explanation}
                      </p>

                      {pred.resolutionCriteria && (
                        <div className="x-pred-criteria">
                          <b>📋 Verification & Resolution Criteria:</b> {pred.resolutionCriteria}
                        </div>
                      )}

                      <div className="x-pred-metrics">
                        <div className="x-metric-item">
                          <span className="lbl">Model Confidence</span>
                          <span className="val highlight">{pred.confidence}% Conf.</span>
                          <div className="x-conf-bar">
                            <div
                              className="x-conf-fill"
                              style={{ width: `${pred.confidence}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>

                        {pred.stakedAmount && (
                          <div className="x-metric-item">
                            <span className="lbl">Staked Collateral</span>
                            <span className="val">{pred.stakedAmount}</span>
                          </div>
                        )}

                        <div className="x-pred-action">
                          <Link
                            href={`/idea/${mind.id}?tab=predictions`}
                            className="x-stake-cta"
                          >
                            Back Prediction / View Odds →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="x-thread-footer">
                  <Link href={`/idea/${mind.id}?tab=predictions`} className="x-view-full-thread">
                    View all {predictionCount} on-chain prediction outcomes →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
