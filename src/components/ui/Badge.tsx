import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'signal' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

export default function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantClass = variant !== 'default' ? `badge-${variant}` : '';

  return (
    <span
      className={`badge ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
