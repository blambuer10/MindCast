import React from 'react';

interface LoadingDotProps {
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export default function LoadingDot({
  size = 'md',
  pulse = true,
  className = '',
}: LoadingDotProps) {
  const sizeClass = size === 'sm' ? '' : size === 'lg' ? 'loading-dot-lg' : '';
  const pulseClass = pulse ? 'animate-breathe' : '';

  return (
    <span
      className={`loading-dot ${sizeClass} ${pulseClass} ${className}`}
    />
  );
}
