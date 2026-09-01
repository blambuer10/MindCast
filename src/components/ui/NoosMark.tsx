'use client';

import React from 'react';

interface NoosMarkProps {
  size?: number;
  className?: string;
  isListening?: boolean;
  isSleeping?: boolean;
  glow?: boolean;
  fillColor?: string;
  strokeColor?: string;
}

/**
 * NOOS Mascot Mark
 * The living thought-bubble entity of MINDCAST:
 * - Cream / paper body
 * - Violet outline
 * - Single curious violet eye (open when listening, closed line when sleeping)
 * - Floating antenna orb dot (pulses with glow when listening)
 */
export default function NoosMark({
  size = 32,
  className = '',
  isListening = false,
  isSleeping = false,
  glow = false,
  fillColor = '#FBF7F0',
  strokeColor = '#7B5CFF',
}: NoosMarkProps) {
  // Determine if eye is sleeping
  const sleeping = isSleeping && !isListening;
  const activeGlow = glow || isListening;

  return (
    <div
      className={`noos-mascot-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${Math.round(size * 1.1)}px`,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <svg
        viewBox="0 0 100 110"
        width={size}
        height={Math.round(size * 1.1)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="noos-orb-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                0 0 0 0 0.482
                0 0 0 0 0.361
                0 0 0 0 1
                0 0 0 0.8 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Floating Antenna Orb */}
        <circle
          cx="50"
          cy="8.5"
          r="3.8"
          fill={strokeColor}
          filter={activeGlow ? 'url(#noos-orb-glow)' : undefined}
          style={{
            transformOrigin: '50px 8.5px',
            animation: activeGlow ? 'noos-antenna-glow 2s ease-in-out infinite' : undefined,
          }}
        />

        {/* 2. Soft Thought Bubble / Cloud Body Outline */}
        <path
          d="M 50 18
             C 68 18 80 32 80 48
             C 80 54 78 60 76 64
             C 85 68 91 76 91 85
             C 91 96 82 103 69 103
             C 62 103 57 100 52 96
             C 47 100 40 103 33 102
             C 20 100 12 90 12 79
             C 12 71 18 63 26 60
             C 22 55 20 49 20 44
             C 20 30 32 18 50 18 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3. The One Violet Eye */}
        {sleeping ? (
          /* Sleeping state: gentle curved closed eyelid slit */
          <path
            d="M 33 52 Q 42 59 51 52"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          /* Awake / Listening state: large solid violet circular eye */
          <circle
            cx="42.5"
            cy="51"
            r="12"
            fill={strokeColor}
            style={{
              transformOrigin: '42.5px 51px',
              animation: isListening ? 'noos-eye-pulse 3s ease-in-out infinite' : undefined,
            }}
          />
        )}
      </svg>
    </div>
  );
}
