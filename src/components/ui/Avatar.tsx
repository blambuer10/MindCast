import React from 'react';

interface AvatarProps {
  color: string;
  initials: string;
  size?: number;
  className?: string;
}

export default function Avatar({ color, initials, size = 40, className = '' }: AvatarProps) {
  return (
    <div
      className={`av ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ['--c' as any]: color,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
