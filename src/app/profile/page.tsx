'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useWallet } from '@/hooks/useWallet';
import { UserIcon, CompassIcon } from '@/components/ui/Icons';

export default function ProfileRedirectPage() {
  const { isConnected, address, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) {
      router.replace(`/profile/${address}`);
    }
  }, [isConnected, address, router]);

  return (
    <AppShell title="Profile">
      <div className="pad" style={{ padding: '48px 16px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(10, 14, 22, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(79, 195, 247, 0.2)',
          borderRadius: '24px',
          padding: '48px 24px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
            border: '2px solid rgba(79, 195, 247, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand)',
            boxShadow: '0 0 25px rgba(79, 195, 247, 0.3)',
            fontSize: '32px'
          }}>
            <UserIcon className="i" />
          </div>

          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
              Cognitive Identity
            </h2>
            <p style={{ color: 'var(--mute)', fontSize: '15px', lineHeight: 1.6, margin: 0, maxWidth: '440px' }}>
              Connect your Web3 wallet to access your on-chain profile, track your incubated Minds, manage prediction shares, and showcase your calibration record.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => connect()}
              className="pri"
              style={{
                padding: '12px 28px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UserIcon className="i" />
              <span>Connect Wallet</span>
            </button>

            <Link
              href="/explore"
              className="ghost"
              style={{
                padding: '12px 24px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CompassIcon className="i" />
              <span>Explore Minds</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
