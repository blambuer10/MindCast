import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: 'var(--space-8)',
      textAlign: 'center',
      position: 'relative',
      zIndex: 1,
    }}>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
        MINDCAST<span style={{ color: 'var(--signal)' }}>·</span> — Ideas, alive.
      </p>
    </footer>
  );
}
