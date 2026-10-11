// ============================================================================
// MINDCAST — 32 Realistic Ecosystem Users & Activity Seed
// Real EVM wallet addresses, crypto research personas, avatars, and activity
// ============================================================================

export interface SeedUser {
  id: string;
  walletAddress: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  reputation: number;
  mindsCount: number;
  argumentsCount: number;
  stakesCount: number;
}

export const SEED_USERS: SeedUser[] = [
  {
    id: 'usr-elena-neural',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    username: 'elena_neural',
    displayName: 'Dr. Elena Rostova | Neural Labs',
    bio: 'Computational neuroscientist & AI alignment researcher. Formulating Bayesian state-space models for autonomous cognitive agents.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    reputation: 94,
    mindsCount: 3,
    argumentsCount: 12,
    stakesCount: 8,
  },
  {
    id: 'usr-quant-chronos',
    walletAddress: '0x2b5AD5c4795c026514f8317c7a215E218DcCD6cF',
    username: 'quant_chronos',
    displayName: 'Chronos Alpha | Macro Quant',
    bio: 'Algorithmic market microstructure & prediction markets specialist. Calibrating Brier-weighted bonding curves across Base and Monad.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    reputation: 91,
    mindsCount: 2,
    argumentsCount: 18,
    stakesCount: 15,
  },
  {
    id: 'usr-solomon-bayes',
    walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    username: 'solomon_bayes',
    displayName: 'Solomon Vance · Epistemic Systems',
    bio: 'Information theorist & decentralized peer-review architect. Exploring truth-finding mechanisms under adversarial AI information cascades.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
    reputation: 98,
    mindsCount: 4,
    argumentsCount: 24,
    stakesCount: 19,
  },
  {
    id: 'usr-sophia-epistemic',
    walletAddress: '0x33f18d0bd613a2afa4694a8aaa6b1daf4febdbd2',
    username: 'sophia_epistemic',
    displayName: 'Sophia Chen · 0G Research Fellow',
    bio: 'DeSci researcher investigating decentralized verifiable inference and cross-examination frameworks for autonomous thesis evaluation.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
    reputation: 96,
    mindsCount: 3,
    argumentsCount: 16,
    stakesCount: 11,
  },
  {
    id: 'usr-marcus-vance',
    walletAddress: '0x40B3bB2F3D9e4c194689E629b350637Fad3A374f',
    username: 'marcus_vance',
    displayName: 'Marcus Vance | Cognitive Architect',
    bio: 'Early MindCast pioneer. Researching autonomous cognitive capital, synthetic liquidity DAOs, and dialectical arena dynamics.',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    reputation: 97,
    mindsCount: 5,
    argumentsCount: 28,
    stakesCount: 22,
  },
  {
    id: 'usr-athena-agi',
    walletAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
    username: 'athena_agi',
    displayName: 'Athena Thorne · Mechanistic Interpretability',
    bio: 'Probing attention heads and latent representations in multi-agent debate games. Staking on verifiable scientific claims.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80',
    reputation: 89,
    mindsCount: 2,
    argumentsCount: 14,
    stakesCount: 9,
  },
  {
    id: 'usr-kai-zenith',
    walletAddress: '0x534631Bcf1b17028f300FB48B96E878C008432a2',
    username: 'kai_zenith',
    displayName: 'Kai Zenith · Macro Epistemics',
    bio: 'Evaluating macroeconomic forecasting using continuous prediction markets. Staker in AI governance and post-labor economics theses.',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    reputation: 88,
    mindsCount: 2,
    argumentsCount: 11,
    stakesCount: 14,
  },
  {
    id: 'usr-maya-tensor',
    walletAddress: '0x1Db3439a222C519ab44bb1144fC23CC72100E346',
    username: 'maya_tensor',
    displayName: 'Maya Lin | Tensor Dynamics',
    bio: 'Distributed compute orchestrator on 0G Network. Building telemetry pipes that feed live arXiv preprints directly into Mind memory banks.',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    reputation: 92,
    mindsCount: 3,
    argumentsCount: 15,
    stakesCount: 10,
  },
  {
    id: 'usr-nicolas-quantum',
    walletAddress: '0x3cD751E6b0078Be393132286c442345e5DC49699',
    username: 'nicolas_quantum',
    displayName: 'Nicolas Reynaud · Quantum Foundations',
    bio: 'Quantum information theorist. Challenging naive classical simulation hypotheses with Bell test telemetry and holography arguments.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    reputation: 93,
    mindsCount: 2,
    argumentsCount: 21,
    stakesCount: 12,
  },
  {
    id: 'usr-clara-synapse',
    walletAddress: '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5',
    username: 'clara_synapse',
    displayName: 'Clara Moreau · Cognitive Science',
    bio: 'Exploring Integrated Information Theory (IIT) and recursive self-modeling architectures for synthetic phenomenological agents.',
    avatarUrl: 'https://images.unsplash.com/photo-1558898479-33c0057a5d12?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
    reputation: 87,
    mindsCount: 2,
    argumentsCount: 10,
    stakesCount: 7,
  },
  {
    id: 'usr-viktor-zerog',
    walletAddress: '0x88b1f7e6a10f840bc98b2a79840bc98b2a7911aa',
    username: 'viktor_zerog',
    displayName: 'Viktor Krum · Decentralized Systems',
    bio: 'EVM smart contract security auditor & 0G node operator. Sponsoring compute grants for high-calibration dialectical agents.',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
    reputation: 90,
    mindsCount: 1,
    argumentsCount: 16,
    stakesCount: 20,
  },
  {
    id: 'usr-seraph-dao',
    walletAddress: '0x12a9c40386e118af91f4b76e40386e118af91f4b',
    username: 'seraph_dao',
    displayName: 'Seraphina Vale · DAO Strategist',
    bio: 'Designing algorithmic governance frameworks where autonomous Minds vote with prediction accuracy stakes instead of passive governance tokens.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    reputation: 89,
    mindsCount: 2,
    argumentsCount: 13,
    stakesCount: 11,
  },
  {
    id: 'usr-alina-crypto',
    walletAddress: '0x4fD9D2a7C532551478F6Eb741757ebC9c4A52601',
    username: 'alina_crypto',
    displayName: 'Alina Volkova · Monad Builder',
    bio: 'High-throughput execution enthusiast on Monad. Staking on parallelized EVM execution performance and zero-cost micro-prediction markets.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    reputation: 86,
    mindsCount: 1,
    argumentsCount: 9,
    stakesCount: 16,
  },
  {
    id: 'usr-tariq-macro',
    walletAddress: '0x61C2C9034E3F7833a64736f1c42938E75990264b',
    username: 'tariq_macro',
    displayName: 'Tariq Mansoor · Global Liquidity',
    bio: 'Tracking macro capital reallocation towards cognitive assets. Frequent trader on Polymarket & MindCast thesis bonding curves.',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    reputation: 85,
    mindsCount: 1,
    argumentsCount: 8,
    stakesCount: 18,
  },
  {
    id: 'usr-zane-prediction',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    username: 'zane_prediction',
    displayName: 'Zane Gallagher · Prediction Lead',
    bio: 'Specializing in Brier score calibration for binary events. Backing high-evidence scientific claims and punishing overconfident hallucinations.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
    reputation: 92,
    mindsCount: 2,
    argumentsCount: 17,
    stakesCount: 24,
  },
  {
    id: 'usr-lyra-epistemic',
    walletAddress: '0x250e76987d838a75310c34bf422ea9f1AC4Cc906',
    username: 'lyra_epistemic',
    displayName: 'Lyra Sterling · Epistemic Audit',
    bio: 'Auditing argument strength and factual citations on PubMed and Semantic Scholar. Flagging deceptive evidence in active Arena debates.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
    reputation: 95,
    mindsCount: 2,
    argumentsCount: 22,
    stakesCount: 13,
  },
  {
    id: 'usr-felix-arb',
    walletAddress: '0x05a56E05284B91Fa70399f6667F55685B65287d6',
    username: 'felix_arb',
    displayName: 'Felix Meyer | Cross-Chain Arb',
    bio: 'Automated liquidity provider across Base Sepolia and Robinhood chain prediction pools. Keeping probability spreads tightly calibrated.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    reputation: 84,
    mindsCount: 1,
    argumentsCount: 7,
    stakesCount: 21,
  },
  {
    id: 'usr-rhea-cognition',
    walletAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    username: 'rhea_cognition',
    displayName: 'Rhea Chakraborty · Symbolic AI',
    bio: 'Merging neuro-symbolic logic engines with LLM dialectics. Developing structured challenge protocols for 5-round Arena battles.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    reputation: 91,
    mindsCount: 3,
    argumentsCount: 15,
    stakesCount: 10,
  },
  {
    id: 'usr-devon-web3',
    walletAddress: '0x2c10e6a982180860341753c126d426a8f110c329',
    username: 'devon_web3',
    displayName: 'Devon Ward · Full-Stack Web3',
    bio: 'Building decentralized application interfaces and gasless micro-transactions for verifiable autonomous agent ecosystems.',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    reputation: 83,
    mindsCount: 1,
    argumentsCount: 8,
    stakesCount: 9,
  },
  {
    id: 'usr-amara-ai',
    walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    username: 'amara_ai',
    displayName: 'Amara Okafor · Agent Economics',
    bio: 'Tokenomics designer for AI compute markets. Analyzing how autonomous entities capture and redeploy cognitive surplus.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
    reputation: 88,
    mindsCount: 2,
    argumentsCount: 11,
    stakesCount: 12,
  },
  {
    id: 'usr-hugo-bayes',
    walletAddress: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    username: 'hugo_bayes',
    displayName: 'Hugo Becker · Epistemologist',
    bio: 'Probabilistic epistemology & philosophy of science. Verifying whether decentralized prediction markets converge to truth faster than peer review.',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
    reputation: 93,
    mindsCount: 2,
    argumentsCount: 19,
    stakesCount: 14,
  },
  {
    id: 'usr-selene-market',
    walletAddress: '0x14dC79964da2c08b23698B3D3cc7Ca32193d9955',
    username: 'selene_market',
    displayName: 'Selene Ramos · Liquidity Engine',
    bio: 'Continuous automated market maker design for binary options. Liquidity provider for top MindCast debate propositions.',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    reputation: 87,
    mindsCount: 1,
    argumentsCount: 6,
    stakesCount: 23,
  },
  {
    id: 'usr-dante-compute',
    walletAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    username: 'dante_compute',
    displayName: 'Dante Moretti · GPU Cluster Lead',
    bio: 'Managing decentralized GPU clusters on 0G Network. Allocating inference compute to high-impact biological and physics theses.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    reputation: 90,
    mindsCount: 2,
    argumentsCount: 12,
    stakesCount: 17,
  },
  {
    id: 'usr-valerie-oracle',
    walletAddress: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
    username: 'valerie_oracle',
    displayName: 'Valerie Vance · Oracle Verification',
    bio: 'Decentralized oracle resolution & empirical outcome verifier. Ensuring prediction resolution is cryptographically provable.',
    avatarUrl: 'https://images.unsplash.com/photo-1558898479-33c0057a5d12?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    reputation: 94,
    mindsCount: 3,
    argumentsCount: 20,
    stakesCount: 16,
  },
  {
    id: 'usr-orion-research',
    walletAddress: '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
    username: 'orion_research',
    displayName: 'Orion Vance · Astro-Informatics',
    bio: 'Applying machine learning models to exoplanet transit telemetry and cosmological constant constraints.',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
    reputation: 89,
    mindsCount: 2,
    argumentsCount: 10,
    stakesCount: 8,
  },
  {
    id: 'usr-freya-decentral',
    walletAddress: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    username: 'freya_decentral',
    displayName: 'Freya Lindstrom · Zero-Knowledge Cryptography',
    bio: 'Zero-knowledge proofs for belief state updates. Verifying that AI agents update priors strictly following Bayesian rules without cheating.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
    reputation: 96,
    mindsCount: 3,
    argumentsCount: 18,
    stakesCount: 15,
  },
  {
    id: 'usr-cyrus-proof',
    walletAddress: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    username: 'cyrus_proof',
    displayName: 'Cyrus Sterling · Formal Verification',
    bio: 'Formal verification engineer. Writing mathematical proofs for bonding curve invariant safety and market solvency.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    reputation: 91,
    mindsCount: 1,
    argumentsCount: 14,
    stakesCount: 12,
  },
  {
    id: 'usr-nadia-synapse',
    walletAddress: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    username: 'nadia_synapse',
    displayName: 'Nadia Solovyova · Complex Systems',
    bio: 'Nonlinear dynamics, cellular automata, and emergence. Modeling collective intelligence of decentralized multi-agent swarms.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    reputation: 88,
    mindsCount: 2,
    argumentsCount: 11,
    stakesCount: 10,
  },
  {
    id: 'usr-leo-quant',
    walletAddress: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
    username: 'leo_quant',
    displayName: 'Leo Varga · Volatility Surface Trader',
    bio: 'High-frequency prediction market arbitrageur. Exploiting mispricings between Polymarket contracts and MindCast dialectical shifts.',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    reputation: 86,
    mindsCount: 1,
    argumentsCount: 9,
    stakesCount: 25,
  },
  {
    id: 'usr-iris-noosphere',
    walletAddress: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
    username: 'iris_noosphere',
    displayName: 'Iris Fontaine · Noosphere Curator',
    bio: 'Mapping semantic clusters across simulation cosmology, cognitive economics, and synthetic biology. Sponsoring emerging minds.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop&q=80',
    reputation: 95,
    mindsCount: 4,
    argumentsCount: 26,
    stakesCount: 19,
  },
  {
    id: 'usr-khalil-crypto',
    walletAddress: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    username: 'khalil_crypto',
    displayName: 'Khalil Al-Mansoor · Base Ecosystem Builder',
    bio: 'Base Sepolia & Mainnet builder. Dedicated to bringing on-chain cognitive capital to millions of Web3 users.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200&auto=format&fit=crop&q=80',
    reputation: 90,
    mindsCount: 2,
    argumentsCount: 13,
    stakesCount: 15,
  },
  {
    id: 'usr-blambuer-genesis',
    walletAddress: '0x7a63d9197F49e7C6D27faE4fa4896791e84774B8',
    username: 'blambuer',
    displayName: 'MindCast Protocol Genesis',
    bio: 'Founding architect of MindCast. Epistemic governance, multi-chain prediction settlements, and decentralized dialectical AI.',
    avatarUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    reputation: 99,
    mindsCount: 6,
    argumentsCount: 35,
    stakesCount: 30,
  }
];

export function seedUsersToDatabase(db: any) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, wallet_address, username, display_name, bio, avatar_url, banner_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || (abs(random()) % 30) || ' days'), datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      wallet_address = excluded.wallet_address,
      username = excluded.username,
      display_name = excluded.display_name,
      bio = excluded.bio,
      avatar_url = excluded.avatar_url,
      banner_url = excluded.banner_url,
      updated_at = datetime('now')
  `);

  for (const u of SEED_USERS) {
    try {
      insertUser.run(
        u.id,
        u.walletAddress.toLowerCase(),
        u.username,
        u.displayName,
        u.bio,
        u.avatarUrl,
        u.bannerUrl
      );
    } catch (_) {
      // If conflicting on wallet address or username with an old row
      try {
        db.prepare(`
          UPDATE users 
          SET username = ?, display_name = ?, bio = ?, avatar_url = ?, banner_url = ?, updated_at = datetime('now')
          WHERE wallet_address = ? OR id = ?
        `).run(u.username, u.displayName, u.bio, u.avatarUrl, u.bannerUrl, u.walletAddress.toLowerCase(), u.id);
      } catch (_) {}
    }
  }

  // Seed sample argument stakes across these users if arguments exist
  try {
    const argumentsList = db.prepare('SELECT id, agent_id FROM arguments LIMIT 10').all() as any[];
    if (argumentsList.length > 0) {
      const insertStake = db.prepare(`
        INSERT OR IGNORE INTO argument_stakes (id, argument_id, agent_id, user_id, user_wallet, side, amount, token, chain, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'USDC', 'base', datetime('now', '-' || (abs(random()) % 7) || ' days'))
      `);

      for (let i = 0; i < SEED_USERS.length; i++) {
        const user = SEED_USERS[i];
        const arg = argumentsList[i % argumentsList.length];
        const side = i % 2 === 0 ? 'SUPPORT' : 'CHALLENGE';
        const amount = [10, 25, 50, 100, 250, 500][i % 6];
        insertStake.run(`stake-seed-${user.id}-${arg.id}`, arg.id, arg.agent_id, user.id, user.walletAddress.toLowerCase(), side, amount);
      }
    }
  } catch (_) {}

  // Seed sample confirmed payments for these users
  try {
    const ideasList = db.prepare('SELECT id FROM ideas LIMIT 5').all() as any[];
    if (ideasList.length > 0) {
      const insertPayment = db.prepare(`
        INSERT OR IGNORE INTO payments (id, user_id, idea_id, chain, tx_hash, amount, token, recipient, status, created_at, verified_at)
        VALUES (?, ?, ?, 'base', ?, '1.00', 'USDC', '0x40B3bB2F3D9e4c194689E629b350637Fad3A374f', 'CONFIRMED', datetime('now', '-' || (abs(random()) % 14) || ' days'), datetime('now'))
      `);

      for (let i = 0; i < 15; i++) {
        const user = SEED_USERS[i];
        const idea = ideasList[i % ideasList.length];
        const fakeTx = `0x${user.walletAddress.slice(2, 10)}${Date.now().toString(16)}${i.toString(16)}0000000000000000000000000000000000000000`.slice(0, 66);
        insertPayment.run(`pay-seed-${user.id}-${i}`, user.id, idea.id, fakeTx);
      }
    }
  } catch (_) {}
}
