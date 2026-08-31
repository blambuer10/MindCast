import { ethers } from 'ethers';

const VAULT_ADDRESS = process.env.BONDING_VAULT_ADDRESS || '0xf2f726598E96D85b9b08ece943590529555b867d';
const RPC_URL = process.env.RPC_MAINNET_BASE || 'https://mainnet.base.org';

const VAULT_ABI = [
  'function minds(string) view returns (address token, address creator, uint256 totalRaisedUsdc, bool graduated, address poolAddress)',
  'function registerMind(string mindId, address token, address creator) external',
  'function graduate(string mindId, uint256 tokenLiquidityAmount) external returns (address pool)',
  'function buySharesDeposit(string mindId, uint256 usdcAmount) external returns (bool)',
  'event Deposited(string indexed mindId, address indexed buyer, uint256 amountUsdc, uint256 totalRaised)',
  'event Graduated(string indexed mindId, address indexed token, address pool, uint256 usdcLiquidity, uint256 creatorReward)'
];

export async function getVaultMindData(mindId: string) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
    const data = await vault.minds(mindId);
    return {
      token: data.token,
      creator: data.creator,
      totalRaisedUsdc: ethers.formatUnits(data.totalRaisedUsdc, 6),
      graduated: data.graduated,
      poolAddress: data.poolAddress,
    };
  } catch (error) {
    console.warn('[Vault] Failed to get mind data:', error);
    return null;
  }
}

export async function registerMindInVault(mindId: string, tokenAddress: string, creatorAddress: string) {
  try {
    const privateKey = process.env.DEPLOY_PRIVATE_KEY;
    if (!privateKey) return false;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

    const existing = await vault.minds(mindId);
    if (existing.token !== ethers.ZeroAddress) {
      return true; // Already registered
    }

    const tx = await vault.registerMind(mindId, tokenAddress, creatorAddress);
    await tx.wait();
    console.log(`[Vault] Registered ${mindId} with token ${tokenAddress} in Vault`);
    return true;
  } catch (error) {
    console.error('[Vault] Failed to register mind:', error);
    return false;
  }
}

export async function triggerVaultGraduation(mindId: string) {
  try {
    const privateKey = process.env.DEPLOY_PRIVATE_KEY;
    if (!privateKey) return null;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, wallet);

    const existing = await vault.minds(mindId);
    if (existing.graduated) {
      return { alreadyGraduated: true, poolAddress: existing.poolAddress };
    }

    console.log(`[Vault] Graduating ${mindId} to DEX on Base Mainnet...`);
    const tx = await vault.graduate(mindId, 0); // Trigger DEX pool creation & creator reward payout
    const receipt = await tx.wait();
    console.log(`[Vault] Graduation tx confirmed: ${receipt.hash}`);

    const updated = await vault.minds(mindId);
    return {
      txHash: receipt.hash,
      poolAddress: updated.poolAddress,
    };
  } catch (error) {
    console.error('[Vault] Graduation trigger failed:', error);
    return null;
  }
}
