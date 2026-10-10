'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Mind } from '@/types/mind';
import { NOOSPHERES } from '@/lib/scoring';
import Avatar from '../ui/Avatar';
import StatusTag from '../ui/StatusTag';
import ReactionDots from '../ui/ReactionDots';
import ConfidenceMeter from '../ui/ConfidenceMeter';
import { ChatIcon, QuoteIcon } from '../ui/Icons';

interface MindPostProps {
  mind: Mind;
}

export default function MindPost({ mind }: MindPostProps) {
  const [isOpen, setIsOpen] = useState(false);

  const noosphereConfig = NOOSPHERES.find((n) => n.name === mind.noosphere);
  const color = noosphereConfig?.color || '#F06292';
  const initials = mind.name.split(' ')[1]?.slice(0, 3) || mind.name.slice(0, 3);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
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

        <div className="acts">
          <ReactionDots stanceString={mind.stanceString} panel={mind.panel} />

          <span title={`${mind.arguments} arguments`}>
            <ChatIcon className="i" />
            {mind.arguments}
          </span>

          <span title={`${mind.citations} citations`}>
            <QuoteIcon className="i" />
            {mind.citations}
          </span>

          <ConfidenceMeter confidence={mind.confidence} status={mind.status} />
        </div>
      </div>
    </article>
  );
}
