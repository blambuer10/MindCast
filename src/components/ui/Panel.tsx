import React from 'react';

interface PanelProps {
  title?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function Panel({ title, color, className = '', style, children }: PanelProps) {
  const mergedStyle: React.CSSProperties = {
    ...(color ? { ['--c' as any]: color } : {}),
    ...style,
  };

  return (
    <div className={`panel ${className}`} style={mergedStyle}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}
