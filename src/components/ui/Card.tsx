import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  interactive?: boolean;
  children: React.ReactNode;
}

export default function Card({
  variant = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClass = variant === 'elevated' ? 'card-elevated' : '';
  const interactiveClass = interactive ? 'card-interactive' : '';

  return (
    <div
      className={`card ${variantClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
