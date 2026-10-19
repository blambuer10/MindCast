/**
 * MINDCAST — Solana Network & Colosseum Hackathon Configuration
 * Defines RPC endpoints, Anchor Program IDs, Pyth Network Oracle feeds, and Wormhole contracts.
 */

export interface SolanaConfig {
  network: 'mainnet-beta' | 'devnet' | 'localnet';
  rpcUrl: string;
  wsUrl?: string;
  programId: string;
  pythFeeds: {
    solUsd: string;
    btcUsd: string;
    ethUsd: string;
  };
  wormhole: {
    coreBridge: string;
    tokenBridge: string;
  };
  usdcMint: string;
}

export const SOLANA_DEVNET_CONFIG: SolanaConfig = {
  network: 'devnet',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  wsUrl: process.env.NEXT_PUBLIC_SOLANA_WS_URL || 'wss://api.devnet.solana.com',
  programId: 'M1ndCastVau1t11111111111111111111111111111',
  pythFeeds: {
    // Pyth Devnet Feed IDs (Hermes / On-Chain)
    solUsd: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    btcUsd: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    ethUsd: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  },
  wormhole: {
    coreBridge: '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5',
    tokenBridge: 'DZnkkTmCiFWfYTfTvfoeyAcHGbeysz6t5PhozdRHSj2W',
  },
  usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
};

export const SOLANA_MAINNET_CONFIG: SolanaConfig = {
  network: 'mainnet-beta',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com',
  programId: 'M1ndCastVau1t11111111111111111111111111111',
  pythFeeds: {
    solUsd: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    btcUsd: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    ethUsd: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  },
  wormhole: {
    coreBridge: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
    tokenBridge: 'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb',
  },
  usdcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
};

export function getSolanaConfig(): SolanaConfig {
  const isMainnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta';
  return isMainnet ? SOLANA_MAINNET_CONFIG : SOLANA_DEVNET_CONFIG;
}
