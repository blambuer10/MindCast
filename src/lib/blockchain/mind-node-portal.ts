// ============================================================================
// MINDCAST — MindNodeClaimPortal & HodlerAirdropVault Configuration
// ============================================================================
// 60% of Total Supply (600,000,000 $MIND) allocated for 2,000 Genesis Node NFTs
// 80% (240,000 $MIND per node) -> Permanent Burn (0x000...dEaD)
// 20% (60,000 $MIND per node) -> Hodler Airdrop Vault (for >= 20k $MIND holders)

export const MIND_NODE_PORTAL_CONFIG = {
  chainId: 4663, // Robinhood Chain Mainnet
  chainName: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  blockExplorerUrl: "https://robinhoodchain.blockscout.com",
  
  tokens: {
    MIND: {
      symbol: "MIND",
      name: "MindCast Protocol Token",
      decimals: 18,
      totalSupply: "1000000000000000000000000000", // 1 Billion $MIND
      address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", // Deployed token address
    },
  },

  contracts: {
    nodePortal: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // MindNodeClaimPortal
    airdropVault: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // HodlerAirdropVault
    nodeLicenseNft: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // MYCA Genesis Spore Node NFT
    deadAddress: "0x000000000000000000000000000000000000dEaD",
  },

  economics: {
    totalSupply: 1_000_000_000,
    nodeAllocationTotal: 600_000_000, // 60%
    burnShareTotal: 480_000_000,      // 80% of 60% = 48% of total supply
    airdropShareTotal: 120_000_000,   // 20% of 60% = 12% of total supply
    
    totalGenesisNodes: 2_000,
    mindPricePerNode: 300_000,
    burnPerNode: 240_000,
    airdropPerNode: 60_000,
    minHolderAirdropRequirement: 20_000, // >= 20k $MIND
  },

  portalUrl: "https://mycai.pro/mindcast-node",
};

export const MIND_NODE_PORTAL_ABI = [
  "function claimNodesWithMind(uint256 count) external",
  "function remainingNodes() external view returns (uint256)",
  "function totalNodesMinted() external view returns (uint256)",
  "function totalMindDeposited() external view returns (uint256)",
  "function totalMindBurned() external view returns (uint256)",
  "function totalMindToAirdrop() external view returns (uint256)",
  "function NODE_PRICE() external view returns (uint256)",
  "function MAX_GENESIS_NODES() external view returns (uint256)",
  "event NodeClaimedViaMind(address indexed buyer, uint256 count, uint256 totalMindDeposited, uint256 amountBurned, uint256 amountToAirdrop, uint256 startingTokenId)"
];

export const HODLER_AIRDROP_VAULT_ABI = [
  "function getClaimableAirdrop(address holder) external view returns (uint256)",
  "function claimAirdrop() external",
  "function MIN_HOLD_REQUIREMENT() external view returns (uint256)",
  "function totalAirdropReceived() external view returns (uint256)",
  "function totalAirdropClaimed() external view returns (uint256)",
  "event AirdropClaimed(address indexed holder, uint256 amount)"
];
