'use client';

import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { BrowserProvider, formatUnits, Contract, parseUnits } from 'ethers';

// USDC ABI helper (only transfer and approve methods)
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: (walletType?: 'metamask' | 'coinbase' | 'rabby' | 'okx' | 'generic') => Promise<void>;
  disconnect: () => void;
  sendUsdc: (recipient: string, amount: string) => Promise<string>;
  switchChain: (targetChainId: number) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  const announcedProvidersRef = useRef<EIP6963ProviderDetail[]>([]);
  const activeProviderRef = useRef<any>(null);
  const userDisconnectedRef = useRef(false);

  // EIP-6963 Multi-wallet discovery listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAnnouncement = (event: Event) => {
      const customEvent = event as CustomEvent<EIP6963ProviderDetail>;
      if (customEvent.detail && customEvent.detail.provider) {
        const detail = customEvent.detail;
        if (!announcedProvidersRef.current.some(p => p.info.uuid === detail.info.uuid)) {
          announcedProvidersRef.current.push(detail);
          setProviders([...announcedProvidersRef.current]);
        }
      }
    };

    window.addEventListener('eip6963:announceProvider', handleAnnouncement);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Retry request after 500ms to catch late injecting wallets
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    }, 500);

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnouncement);
      clearTimeout(timer);
    };
  }, []);

  // Safe provider getter resolving multi-extension collisions
  const getEthereumProvider = useCallback((walletType?: 'metamask' | 'coinbase' | 'rabby' | 'okx' | 'generic'): any => {
    if (typeof window === 'undefined') return null;
    const w = window as any;

    // Strict check to ensure a provider is actually MetaMask and not a conflicting clone
    const isPureMetaMask = (p: any) => {
      if (!p) return false;
      return p.isMetaMask && !p.isPhantom && !p.isRabby && !p.isOKXWallet && !p.isCoinbaseWallet && !p.isTrust && !p.isTrustWallet;
    };

    // 1. Direct targeted wallet resolution
    if (walletType === 'metamask') {
      const announced = announcedProvidersRef.current.find(p => 
        p.info.name.toLowerCase().includes('metamask') || 
        p.info.rdns.includes('metamask')
      );
      if (announced) return announced.provider;

      try {
        if (w.ethereum?.providers && w.ethereum.providers.length > 0) {
          const mm = w.ethereum.providers.find((p: any) => isPureMetaMask(p));
          if (mm) return mm;
        }
        if (isPureMetaMask(w.ethereum)) {
          return w.ethereum;
        }
      } catch {}
      return null;
    }

    if (walletType === 'coinbase') {
      const announced = announcedProvidersRef.current.find(p => 
        p.info.name.toLowerCase().includes('coinbase') || 
        p.info.rdns.includes('coinbase')
      );
      if (announced) return announced.provider;
      if (w.coinbaseWalletExtension) return w.coinbaseWalletExtension;
      if (w.ethereum?.isCoinbaseWallet) return w.ethereum;
      return null;
    }

    if (walletType === 'rabby') {
      const announced = announcedProvidersRef.current.find(p => 
        p.info.name.toLowerCase().includes('rabby') || 
        p.info.rdns.includes('rabby')
      );
      if (announced) return announced.provider;
      if (w.rabby) return w.rabby;
      return null;
    }

    if (walletType === 'okx') {
      const announced = announcedProvidersRef.current.find(p => 
        p.info.name.toLowerCase().includes('okx') || 
        p.info.rdns.includes('okx')
      );
      if (announced) return announced.provider;
      if (w.okxwallet) return w.okxwallet;
      return null;
    }

    // 2. Fallback auto resolution
    if (announcedProvidersRef.current.length > 0) {
      const mm = announcedProvidersRef.current.find(p => 
        p.info.name.toLowerCase().includes('metamask') || 
        p.info.rdns.includes('metamask')
      );
      if (mm) return mm.provider;
      return announcedProvidersRef.current[0].provider;
    }

    try {
      if (w.ethereum) {
        if (Array.isArray(w.ethereum.providers) && w.ethereum.providers.length > 0) {
          const metamask = w.ethereum.providers.find((p: any) => isPureMetaMask(p));
          if (metamask) return metamask;
          return w.ethereum.providers[0];
        }
        return w.ethereum;
      }
    } catch {}

    if (w.coinbaseWalletExtension) return w.coinbaseWalletExtension;
    if (w.okxwallet) return w.okxwallet;
    if (w.phantom?.ethereum) return w.phantom.ethereum;

    return null;
  }, []);

  const getUSDCBalance = useCallback(async (userAddress: string, provider: BrowserProvider) => {
    try {
      const usdcAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const contract = new Contract(usdcAddress, ['function balanceOf(address account) view returns (uint256)'], provider);
      const bal = await contract.balanceOf(userAddress);
      setBalance(formatUnits(bal, 6));
    } catch {
      setBalance('0.0');
    }
  }, []);

  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      setAddress(null);
      setBalance(null);
    } else {
      setAddress(accounts[0]);
      const eth = activeProviderRef.current || getEthereumProvider();
      if (eth) {
        try {
          const provider = new BrowserProvider(eth, 'any');
          await getUSDCBalance(accounts[0], provider);
        } catch {
          // ignore
        }
      }
    }
  }, [getUSDCBalance, getEthereumProvider]);

  const handleChainChanged = useCallback((hexChainId: string) => {
    try {
      setChainId(parseInt(hexChainId, 16).toString());
      const eth = activeProviderRef.current || getEthereumProvider();
      if (address && eth) {
        const provider = new BrowserProvider(eth, 'any');
        getUSDCBalance(address, provider);
      }
    } catch {
      // ignore
    }
  }, [address, getUSDCBalance, getEthereumProvider]);

  const disconnect = useCallback(() => {
    // Remove event listeners from active provider before clearing
    const eth = activeProviderRef.current;
    if (eth && typeof eth.removeListener === 'function') {
      try {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('chainChanged', handleChainChanged);
        eth.removeListener('disconnect', disconnect);
      } catch {}
    }

    setAddress(null);
    setChainId(null);
    setBalance(null);
    setError(null);
    activeProviderRef.current = null;

    // Persist disconnect intent so autoconnect doesn't re-trigger
    userDisconnectedRef.current = true;
    try { localStorage.setItem('mindcast_wallet_disconnected', '1'); } catch {}
  }, [handleAccountsChanged, handleChainChanged]);

  const connect = useCallback(async (walletType?: 'metamask' | 'coinbase' | 'rabby' | 'okx' | 'generic') => {
    if (!walletType) {
      setShowSelector(true);
      return;
    }

    const eth = getEthereumProvider(walletType);
    if (!eth) {
      setError(`No active ${walletType} extension detected. Please ensure it is unlocked and enabled.`);
      return;
    }

    activeProviderRef.current = eth;
    setIsConnecting(true);
    setError(null);

    try {
      let accounts: string[] = [];

      if (typeof eth.request === 'function') {
        const res = await eth.request({ method: 'eth_requestAccounts' });
        accounts = Array.isArray(res) ? res : (res?.result || []);
      } else if (typeof eth.send === 'function') {
        const res = await eth.send('eth_requestAccounts', []);
        accounts = Array.isArray(res) ? res : (res?.result || []);
      } else if (typeof eth.enable === 'function') {
        accounts = await eth.enable();
      }

      if (!accounts || accounts.length === 0) {
        return;
      }

      setAddress(accounts[0]);
      setShowSelector(false); // Close selector on success

      // Clear disconnect flag since user explicitly reconnected
      userDisconnectedRef.current = false;
      try { localStorage.removeItem('mindcast_wallet_disconnected'); } catch {}

      try {
        const provider = new BrowserProvider(eth, 'any');
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
        await getUSDCBalance(accounts[0], provider);
      } catch (netErr) {
        console.warn('Network query deferred:', netErr);
      }

      if (typeof eth.on === 'function') {
        try {
          eth.on('accountsChanged', handleAccountsChanged);
          eth.on('chainChanged', handleChainChanged);
          eth.on('disconnect', disconnect);
        } catch {}
      }

    } catch (err: any) {
      if (err.code === 4001 || err.message?.includes('User rejected')) {
        setError(null);
      } else if (err.code === -32002) {
        setError('MetaMask popup is already open. Please approve the connection in MetaMask.');
      } else {
        console.error('Wallet connection error:', err);
        setError(err.message || 'Failed to connect wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountsChanged, handleChainChanged, disconnect, getUSDCBalance, getEthereumProvider]);

  const switchChain = useCallback(async (targetChainId: number): Promise<boolean> => {
    const eth = activeProviderRef.current || getEthereumProvider();
    if (!eth) return false;
    const hexChainId = '0x' + targetChainId.toString(16);
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          const chainParams: Record<number, any> = {
            8453: {
              chainId: '0x2105',
              chainName: 'Base Mainnet',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            },
            84532: {
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
            137: {
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com'],
            }
          };

          const params = chainParams[targetChainId];
          if (params) {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [params],
            });
            return true;
          }
        } catch (addError) {
          console.error('Error adding chain:', addError);
        }
      }
      console.error('Failed to switch network:', switchError);
      return false;
    }
  }, [getEthereumProvider]);

  const sendUsdc = useCallback(async (recipient: string, amount: string): Promise<string> => {
    const eth = activeProviderRef.current || getEthereumProvider();
    if (!eth || !address) throw new Error('Wallet not connected');

    const provider = new BrowserProvider(eth, 'any');
    const signer = await provider.getSigner();

    const usdcAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const contract = new Contract(usdcAddress, USDC_ABI, signer);

    const parsedAmount = parseUnits(amount, 6);
    const tx = await contract.transfer(recipient, parsedAmount);
    
    return tx.hash;
  }, [address, getEthereumProvider]);

  // Autoconnect logic
  useEffect(() => {
    // Respect user's explicit disconnect — don't auto-reconnect
    try {
      if (localStorage.getItem('mindcast_wallet_disconnected') === '1') {
        userDisconnectedRef.current = true;
        return;
      }
    } catch {}
    if (userDisconnectedRef.current) return;

    const eth = getEthereumProvider();
    if (eth && typeof eth.request === 'function') {
      eth.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            activeProviderRef.current = eth;
            try {
              const provider = new BrowserProvider(eth, 'any');
              provider.getNetwork().then((network) => {
                setChainId(network.chainId.toString());
                getUSDCBalance(accounts[0], provider);
              }).catch(() => {});
            } catch {}

            if (typeof eth.on === 'function') {
              eth.on('accountsChanged', handleAccountsChanged);
              eth.on('chainChanged', handleChainChanged);
              eth.on('disconnect', disconnect);
            }
          }
        })
        .catch(() => {});
    }
  }, [getUSDCBalance, handleAccountsChanged, handleChainChanged, disconnect, getEthereumProvider]);

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!address,
        address,
        chainId,
        balance,
        isConnecting,
        error,
        connect,
        disconnect,
        sendUsdc,
        switchChain,
      }}
    >
      {children}

      {/* Global Wallet Selector Modal resolving multiple extension conflicts */}
      {showSelector && (
        <div className="modal-overlay" onClick={() => setShowSelector(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setShowSelector(false)}>×</button>
            <h3 className="modal-title">Connect Wallet</h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              Select your wallet to connect to MINDCAST:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '12px 16px', height: 'auto', gap: '12px', fontSize: '15px', width: '100%' }}
                onClick={() => connect('metamask')}
              >
                <span style={{ fontSize: '20px' }}>🦊</span>
                <strong>MetaMask</strong>
              </button>
              
              <button 
                className="btn btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '12px 16px', height: 'auto', gap: '12px', fontSize: '15px', width: '100%' }}
                onClick={() => connect('coinbase')}
              >
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <strong>Coinbase Wallet</strong>
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '12px 16px', height: 'auto', gap: '12px', fontSize: '15px', width: '100%' }}
                onClick={() => connect('rabby')}
              >
                <span style={{ fontSize: '20px' }}>💼</span>
                <strong>Rabby Wallet</strong>
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '12px 16px', height: 'auto', gap: '12px', fontSize: '15px', width: '100%' }}
                onClick={() => connect('generic')}
              >
                <span style={{ fontSize: '20px' }}>🌐</span>
                <strong>Injected Wallet</strong>
              </button>
            </div>
            {error && (
              <div className="error-state" style={{ marginTop: '16px' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
