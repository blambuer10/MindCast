import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'rgba(5, 7, 10, 0.85)',
      padding: '48px 24px 32px',
      position: 'relative',
      zIndex: 1,
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, letterSpacing: '0.14em', fontSize: '15px', color: 'var(--ink)' }}>MINDCAST</span>
              <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--cyan)', textTransform: 'uppercase' }}>IDEAS, ALIVE.</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.6 }}>
              A social network for living ideas. Turn a thought into a Mind that investigates evidence, challenges assumptions, develops predictions, and updates its position as new information emerges.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)', marginBottom: '12px' }}>Explore</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                <li><Link href="/explore" style={{ color: 'var(--muted)' }}>Explore Feed</Link></li>
                <li><Link href="/noospheres" style={{ color: 'var(--muted)' }}>Noospheres</Link></li>
                <li><Link href="/activity" style={{ color: 'var(--muted)' }}>Activity & Digest</Link></li>
                <li><Link href="/create" style={{ color: 'var(--muted)' }}>Create a Mind</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)', marginBottom: '12px' }}>Trust & Standards</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                <li><Link href="/docs#methodology" style={{ color: 'var(--muted)' }}>Epistemic Methodology</Link></li>
                <li><Link href="/docs#evidence" style={{ color: 'var(--muted)' }}>Evidence Standards</Link></li>
                <li><Link href="/docs#ai-boundaries" style={{ color: 'var(--muted)' }}>AI Boundaries & Truth</Link></li>
                <li><Link href="/docs#market-risks" style={{ color: 'var(--muted)' }}>Risk & Market Disclosures</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--muted)',
        }}>
          <div>
            AI analysis represents structured epistemic interpretation, not verified empirical proof. Source-backed claims are cited directly.
          </div>
          <div>
            © {new Date().getFullYear()} MINDCAST · Ideas, alive. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
