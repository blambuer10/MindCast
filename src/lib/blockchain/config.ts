import fs from 'fs';
import path from 'path';

export interface TokenConfig {
  [symbol: string]: string;
}

export interface ChainConfig {
  name: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  tokens: TokenConfig;
}

export interface ManifestConfig {
  chains: {
    [chainId: string]: ChainConfig;
  };
}

let cachedConfig: ManifestConfig | null = null;

export function getManifestConfig(): ManifestConfig {
  if (cachedConfig) return cachedConfig;

  try {
    // Read from project root
    const filePath = path.join(process.cwd(), 'manifest.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      cachedConfig = JSON.parse(data) as ManifestConfig;
      return cachedConfig;
    }
  } catch (err) {
    console.error('[Config] Failed to read manifest.json from filesystem:', err);
  }

  // Hardcoded fallback if file read fails (should match manifest.json)
  const fallbackConfig: ManifestConfig = {
    chains: {
      "8453": {
        name: "Base Mainnet",
        chainId: 8453,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
        tokens: {
          "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        }
      },
      "84532": {
        name: "Base Sepolia",
        chainId: 84532,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://sepolia.base.org"],
        blockExplorerUrls: ["https://sepolia.basescan.org"],
        tokens: {
          "USDC": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        }
      }
    }
  };

  return fallbackConfig;
}

/**
 * Dynamically resolves token address from manifest configuration.
 */
export function getTokenAddress(chainId: string | number, tokenSymbol: string): string | null {
  const config = getManifestConfig();
  const chainStr = String(chainId);
  const chainConfig = config.chains[chainStr];
  if (!chainConfig || !chainConfig.tokens) return null;

  const addr = chainConfig.tokens[tokenSymbol.toUpperCase()];
  return addr || null;
}

/**
 * Validates whether a token address matches the manifest configuration for the given chain.
 */
export function validateTokenAddress(chainId: string | number, tokenSymbol: string, address: string): boolean {
  if (!address) return false;
  const expectedAddress = getTokenAddress(chainId, tokenSymbol);
  if (!expectedAddress) return false;
  return expectedAddress.toLowerCase() === address.toLowerCase();
}
