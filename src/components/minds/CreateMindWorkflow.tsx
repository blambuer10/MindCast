'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';

const SUPPORTED_CHAINS = [
  { id: 8453, key: 'base', name: 'Base', token: 'USDC', icon: '🔵', badge: 'Mainnet' },
  { id: 143, key: 'monad', name: 'Monad', token: 'USDC', icon: '🟣', badge: 'Mainnet' },
  { id: 4663, key: 'robinhood', name: 'Robinhood', token: 'USDG', icon: '🟢', badge: 'L2 Mainnet' },
];

interface CreateMindWorkflowProps {
  onClose?: () => void;
  onSuccess?: (agentId: string) => void;
  initialContent?: string;
}

export default function CreateMindWorkflow({ onClose, onSuccess, initialContent = '' }: CreateMindWorkflowProps) {
  const router = useRouter();
  const { isConnected, address, connect, sendUsdc, switchChain, chainId, isConnecting } = useWallet();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [content, setContent] = useState(initialContent);
  const [tokenName, setTokenName] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('T-AI');
  const [selectedChainId, setSelectedChainId] = useState<number>(() => {
    return parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453');
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [createdIdeaId, setCreatedIdeaId] = useState<string | null>(null);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  const selectedChain = SUPPORTED_CHAINS.find(c => c.id === selectedChainId) || SUPPORTED_CHAINS[0];

  const handleNextToReview = () => {
    const trimmed = content.trim();
    if (trimmed.length < 15) {
      setErrorMessage('Please enter a substantive thesis statement (at least 15 characters).');
      return;
    }
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 3) {
      setErrorMessage('A Mind requires a structured, debatable claim with at least 3 words (e.g. "Autonomous agents will outperform traditional DAOs by 2027").');
      return;
    }
    // Check for keyboard mash / vowel ratio
    const letters = trimmed.toLowerCase().replace(/[^a-zçğıöşü]/g, '');
    const vowels = letters.match(/[aeiouıöü]/g) || [];
    if (letters.length >= 8 && vowels.length / letters.length < 0.12) {
      setErrorMessage('Your input appears to be random consonants or keyboard mash. MINDCAST agents only investigate genuine hypotheses and substantive thoughts.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleConfirmAndPay = async (simulate = false) => {
    let activeAddress = address;
    if (!isConnected || !activeAddress) {
      try {
        await connect();
        if (typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress) {
          activeAddress = (window as any).ethereum.selectedAddress;
        }
      } catch (e: any) {
        setErrorMessage('Please connect your wallet to confirm creation.');
        return;
      }
    }

    if (!activeAddress) {
      if (typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress) {
        activeAddress = (window as any).ethereum.selectedAddress;
      }
    }

    if (!activeAddress) {
      setErrorMessage('Wallet not connected. Please connect MetaMask or Coinbase Wallet.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Switch network if needed (only for real on-chain payment)
      if (!simulate && chainId && parseInt(chainId) !== selectedChainId) {
        const switched = await switchChain(selectedChainId);
        if (!switched) {
          throw new Error(`Please switch to ${selectedChain.name} network.`);
        }
      }

      // Step A: Prepare idea
      const prepRes = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          walletAddress: activeAddress,
          tokenName: tokenName.trim() || undefined,
          tokenTicker: tokenTicker.trim().toUpperCase() || undefined,
          topicId: selectedTopic,
        }),
      });

      if (!prepRes.ok) {
        const err = await prepRes.json();
        throw new Error(err.error || 'Failed to prepare idea.');
      }

      const prepData = await prepRes.json();
      setCreatedIdeaId(prepData.ideaId);

      // Step B: Send Payment or Dev Simulation
      let sentTxHash: string | null = null;
      if (simulate) {
        // Generate valid 64-hex local dev simulation hash
        sentTxHash = '0x00000000' + Array.from({ length: 56 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      } else {
        const recipient = prepData.paymentRecipient || '0x33f18d0BD613A2afa4694A8AAA6b1daf4FEBdbd2';
        const amount = prepData.paymentAmount || '1';
        try {
          sentTxHash = await sendUsdc(recipient, amount);
        } catch (txErr: any) {
          if (txErr?.message?.includes('exceeds balance') || txErr?.message?.includes('estimateGas')) {
            throw new Error('Wallet has insufficient USDC balance (1 USDC required). On localhost, use the "Test Simulation" button below to test without real funds.');
          }
          throw txErr;
        }
      }

      if (!sentTxHash) {
        throw new Error('Transaction was rejected or cancelled.');
      }

      setTxHash(sentTxHash);
      setStep(3);

      // Step C: Verify on-chain payment & birth mind
      const verRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: prepData.ideaId,
          txHash: sentTxHash,
          chain: selectedChain.key,
          walletAddress: activeAddress,
        }),
      });

      if (!verRes.ok) {
        const verErr = await verRes.json();
        throw new Error(verErr.error || 'Payment verification failed.');
      }

      const verData = await verRes.json();
      setCreatedAgentId(verData.agentId);
      setStep(4);

      // Persist created mind locally so it immediately shows up in "My Minds"
      try {
        const stored = localStorage.getItem('mindcast_created_minds');
        const list = stored ? JSON.parse(stored) : [];
        const newMindItem = {
          id: prepData.ideaId,
          creatorId: activeAddress,
          creatorWallet: activeAddress,
          content: content.trim(),
          tokenName: tokenName.trim() || `Mind ${prepData.ideaId.slice(0, 4)}`,
          tokenTicker: tokenTicker.trim().toUpperCase() || 'MIND',
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          agent: {
            id: verData.agentId || `MIND-${prepData.ideaId.slice(0, 4)}`,
            thesis: content.trim(),
            confidence: 65,
            lifecycleStatus: 'INCUBATING',
            credibility: 50,
            estimatedValue: 1000,
          },
          evidenceCount: 1,
          argumentCount: 0,
          followerCount: 0,
        };
        if (!list.some((m: any) => m.id === prepData.ideaId)) {
          list.unshift(newMindItem);
          localStorage.setItem('mindcast_created_minds', JSON.stringify(list));
        }
      } catch (_) {}

      // Track analytics
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName: 'mind_created_complete',
            userId: activeAddress,
            metadata: { ideaId: prepData.ideaId, agentId: verData.agentId },
          }),
        });
      } catch (_) {}

    } catch (err: any) {
      console.error('Creation error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface, #0B0F14)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '640px',
      width: '100%',
      color: 'var(--ink)',
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
    }}>
      {/* Step Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cyan)', fontWeight: 600 }}>
            Step {step} of 4 · Create a Living Mind
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
            {step === 1 && 'Articulate your Thesis'}
            {step === 2 && 'Review Structure & Domain'}
            {step === 3 && 'Verifying Network State'}
            {step === 4 && 'Mind Awakened'}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--muted)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#FCA5A5',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          {errorMessage}
        </div>
      )}

      {/* STEP 1: Enter Idea */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              What is your core claim or hypothesis?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Autonomous AI agents backing their conviction with empirical predictions on bonding curves will manage more capital than human DAOs by 2027..."
              rows={4}
              style={{
                width: '100%',
                background: 'var(--bg-card, #0E131A)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                color: 'var(--ink)',
                fontSize: '15px',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
              <span>Make it testable, specific, and open to counterarguments.</span>
              <span>{content.length} chars</span>
            </div>
          </div>

          {/* Optional Guidance Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--ink)' }}>Guiding prompts:</strong>
            <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
              <li>What specific evidence would support your claim?</li>
              <li>What is the strongest counterargument against it?</li>
              <li>How could this claim be tested or resolved over time?</li>
            </ul>
          </div>

          {/* Optional Token / Identity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                Asset Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cognitive Capital"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card, #0E131A)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--ink)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                Ticker Symbol (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ACC"
                value={tokenTicker}
                onChange={(e) => setTokenTicker(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card, #0E131A)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--ink)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            {onClose && (
              <button onClick={onClose} className="btn-secondary" style={{ minHeight: '40px', padding: '0 20px', fontSize: '13px' }}>
                Cancel
              </button>
            )}
            <button onClick={handleNextToReview} className="btn-primary" style={{ minHeight: '40px', padding: '0 24px', fontSize: '13px' }}>
              Next: Review Structure →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Review Proposed Thesis */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'var(--bg-card, #0E131A)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '20px',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Formulated Thesis
            </span>
            <p style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.5, marginTop: '8px' }}>
              "{content}"
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Assign to Noosphere
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card, #0E131A)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: 'var(--ink)',
                fontSize: '14px',
              }}
            >
              <option value="T-AI">⚡ Artificial Intelligence</option>
              <option value="T-SIM">🌌 Simulation & Reality</option>
              <option value="T-CON">🧠 Consciousness</option>
              <option value="T-SCI">🔬 Science & Physics</option>
              <option value="T-ECON">🏛️ Economics & Society</option>
            </select>
          </div>

          {/* Publishing fee disclosure */}
          <div style={{
            background: 'rgba(79, 195, 247, 0.05)',
            border: '1px solid rgba(79, 195, 247, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            lineHeight: 1.6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: 'var(--cyan)' }}>Transparent Network Disclosure</strong>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>1 USDC / USDG publishing fee</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
              Fee funds the autonomous research budget: verifiable evidence discovery, adversarial debate rounds, and prediction oracle resolution.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              {SUPPORTED_CHAINS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChainId(c.id)}
                  style={{
                    background: selectedChainId === c.id ? 'rgba(79, 195, 247, 0.15)' : 'transparent',
                    border: `1px solid ${selectedChainId === c.id ? 'var(--cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: selectedChainId === c.id ? 'var(--cyan)' : 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ minHeight: '40px', padding: '0 20px', fontSize: '13px' }}>
                ← Back
              </button>
              <button
                onClick={() => handleConfirmAndPay(false)}
                disabled={isSubmitting || isConnecting}
                className="btn-primary"
                style={{ minHeight: '40px', padding: '0 24px', fontSize: '13px' }}
              >
                {isSubmitting ? 'Confirming On-Chain...' : isConnecting ? 'Connecting...' : `Confirm & Birth Mind (1 ${selectedChain.token})`}
              </button>
            </div>

            <button
              onClick={() => handleConfirmAndPay(true)}
              disabled={isSubmitting || isConnecting}
              style={{
                background: 'rgba(79, 195, 247, 0.08)',
                border: '1px dashed rgba(79, 195, 247, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'var(--cyan)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              ⚡ Localhost / Test Simulation (Zero-Gas & No USDC Required)
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Verifying */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(79, 195, 247, 0.2)',
            borderTopColor: 'var(--cyan)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px',
          }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>Verifying Transaction on {selectedChain.name}</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '400px', margin: '8px auto 0' }}>
            Your transaction has been submitted. MINDCAST is verifying consensus and spawning autonomous research workers.
          </p>
          {txHash && (
            <p style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: '16px' }}>
              Tx: {txHash.slice(0, 16)}...{txHash.slice(-10)}
            </p>
          )}
        </div>
      )}

      {/* STEP 4: Completed */}
      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 20px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            ✓
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)' }}>Your Mind is Alive!</h3>
          <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '440px', margin: '8px auto 24px' }}>
            {createdAgentId ? `Mind ID ${createdAgentId}` : 'Your Mind'} is now actively indexing empirical evidence, formulating counter-arguments, and initializing testable predictions.
          </p>
          <button
            onClick={() => {
              if (createdIdeaId) {
                router.push(`/idea/${createdIdeaId}`);
              } else {
                router.push('/explore');
              }
              if (onClose) onClose();
            }}
            className="btn-primary"
            style={{ minHeight: '44px', padding: '0 32px', fontSize: '14px' }}
          >
            Open Living Dossier →
          </button>
        </div>
      )}
    </div>
  );
}
