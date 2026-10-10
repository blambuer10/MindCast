'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import Panel from '@/components/ui/Panel';
import VoteBar from '@/components/ui/VoteBar';
import { listMinds, submitBattleVote } from '@/api/minds';
import { NOOSPHERES, calculateBattleVerdict } from '@/lib/scoring';
import type { Mind } from '@/types/mind';

function BattlesContent() {
  const searchParams = useSearchParams();

  const [minds, setMinds] = useState<Mind[]>([]);
  const [loading, setLoading] = useState(true);

  const [indexA, setIndexA] = useState(2); // default CON1
  const [indexB, setIndexB] = useState(1); // default SIM1
  const [round, setRound] = useState(0);
  const [votesA, setVotesA] = useState(65);
  const [votesB, setVotesB] = useState(45);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await listMinds();
      setMinds(data);

      const mindAParam = searchParams.get('mindA');
      const mindBParam = searchParams.get('mindB');
      const fightParam = searchParams.get('fight');

      let idxA = 2;
      let idxB = 1;

      if (mindAParam) {
        const foundA = data.findIndex(m => m.id === mindAParam || m.name.toLowerCase().includes(mindAParam.toLowerCase()));
        if (foundA !== -1) idxA = foundA;
      }
      if (mindBParam) {
        const foundB = data.findIndex(m => m.id === mindBParam || m.name.toLowerCase().includes(mindBParam.toLowerCase()));
        if (foundB !== -1) idxB = foundB;
      }

      setIndexA(idxA);
      setIndexB(idxB);

      if (fightParam === 'true') {
        setRound(1);
        setVotesA(Math.floor(40 + Math.random() * 80));
        setVotesB(Math.floor(40 + Math.random() * 80));
        setHasVoted(false);
      }

      setLoading(false);
    }
    load();
  }, [searchParams]);

  if (loading || minds.length === 0) {
    return <div className="empty">Loading battles...</div>;
  }

  const mindA = minds[indexA] || minds[0];
  const mindB = minds[indexB] || minds[1];

  const colorA = NOOSPHERES.find(n => n.name === mindA.noosphere)?.color || '#F06292';
  const colorB = NOOSPHERES.find(n => n.name === mindB.noosphere)?.color || '#4FA3E8';

  const isSameMind = indexA === indexB;

  const handleStartFight = () => {
    if (isSameMind) return;
    setRound(1);
    setVotesA(Math.floor(40 + Math.random() * 80));
    setVotesB(Math.floor(40 + Math.random() * 80));
    setHasVoted(false);
  };

  const handleNextRound = () => {
    setRound((prev) => Math.min(prev + 1, 3));
  };

  const handleVote = async (side: 'A' | 'B') => {
    if (hasVoted) return;
    if (side === 'A') {
      setVotesA(v => v + 1);
    } else {
      setVotesB(v => v + 1);
    }
    setHasVoted(true);
    await submitBattleVote(`${mindA.id}-vs-${mindB.id}`, side);
  };

  const verdict = calculateBattleVerdict(mindA, mindB);
  const totalVotes = votesA + votesB;
  const percentA = Math.round((votesA / totalVotes) * 100);
  const percentB = 100 - percentA;

  const roundsData = [
    {
      title: "Round 1 · Opening claim",
      claimA: mindA.claim,
      claimB: mindB.claim,
    },
    {
      title: "Round 2 · Evidence",
      claimA: `${mindA.sourceTitle}: ${mindA.sourceExcerpt}`,
      claimB: `${mindB.sourceTitle}: ${mindB.sourceExcerpt}`,
    },
    {
      title: "Round 3 · Closing",
      claimA: `${mindA.confidence ? `${mindA.confidence}% confident. ` : ''}${mindA.summary}`,
      claimB: `${mindB.confidence ? `${mindB.confidence}% confident. ` : ''}${mindB.summary}`,
    },
  ];

  return (
    <div className="pad">
      <div className="pick">
        <select
          value={indexA}
          onChange={(e) => {
            setIndexA(parseInt(e.target.value, 10));
            setRound(0);
          }}
          aria-label="Mind A"
        >
          {minds.map((m, idx) => (
            <option key={m.id} value={idx}>
              {m.name}
            </option>
          ))}
        </select>

        <span className="vs">VS</span>

        <select
          value={indexB}
          onChange={(e) => {
            setIndexB(parseInt(e.target.value, 10));
            setRound(0);
          }}
          aria-label="Mind B"
        >
          {minds.map((m, idx) => (
            <option key={m.id} value={idx}>
              {m.name}
            </option>
          ))}
        </select>

        <button
          className="pri"
          onClick={handleStartFight}
          disabled={isSameMind}
        >
          {round > 0 ? 'Rematch' : 'Start battle'}
        </button>
      </div>

      {isSameMind ? (
        <div className="empty">Pick two different Minds.</div>
      ) : round === 0 ? (
        <div className="empty">
          Pick two Minds and start a three-round battle. The AI panel and the crowd both vote.
        </div>
      ) : (
        <>
          {roundsData.slice(0, round).map((r, idx) => (
            <div key={idx} className="rd">
              <h4>{r.title}</h4>
              <div style={{ ['--c' as any]: colorA }}>
                <b>{mindA.name}</b>
                <br />
                {r.claimA}
              </div>
              <div style={{ ['--c' as any]: colorB }}>
                <b>{mindB.name}</b>
                <br />
                {r.claimB}
              </div>
            </div>
          ))}

          {round < 3 ? (
            <button
              className="pri"
              onClick={handleNextRound}
              style={{ marginTop: '12px', marginBottom: '16px' }}
            >
              Next round
            </button>
          ) : (
            <>
              <Panel title="AI panel verdict">
                <p style={{ margin: 0, fontSize: '15px' }}>
                  <b>{mindA.name}</b> {verdict.winsA} · {verdict.winsB} <b>{mindB.name}</b> ({verdict.ties} tied)
                </p>
              </Panel>

              <Panel title={`Crowd vote · ${totalVotes} votes`}>
                <VoteBar
                  percentageA={percentA}
                  labelA={`${percentA}%`}
                  colorA={colorA}
                  percentageB={percentB}
                  labelB={`${percentB}%`}
                  colorB={colorB}
                />

                {hasVoted ? (
                  <p className="fine" style={{ marginTop: '12px' }}>
                    Thanks, your vote is counted.
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      className="ghost"
                      onClick={() => handleVote('A')}
                    >
                      Vote {mindA.name}
                    </button>
                    <button
                      className="ghost"
                      onClick={() => handleVote('B')}
                    >
                      Vote {mindB.name}
                    </button>
                  </div>
                )}
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function BattlesPage() {
  return (
    <AppShell title="VS battles">
      <Suspense fallback={<div className="empty">Loading...</div>}>
        <BattlesContent />
      </Suspense>
    </AppShell>
  );
}
