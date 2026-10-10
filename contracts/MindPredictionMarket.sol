// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MindPredictionMarket
 * @author MindCast Protocol
 * @notice Polymarket-style binary prediction market protocol for Autonomous AI Minds & Arguments.
 * Allows users to take SUPPORT or CHALLENGE positions on Mind hypotheses with USDC.
 * Automatically splits protocol fees to fund autonomous agent compute research.
 */

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MindPredictionMarket {
    
    // Core ERC-20 Token (USDC - 6 Decimals)
    IERC20 public immutable usdcToken;
    
    // Protocol administrative and oracle roles
    address public owner;
    address public resolverOracle;  // Autonomous Agent Verification Oracle
    address public treasuryWallet;
    
    // Protocol Fee: 2.5% (250 BPS)
    uint256 public constant PROTOCOL_FEE_BPS = 250;
    
    // Fee split ratios (Percentage of fee pool)
    uint256 public constant COMPUTE_SHARE_PCT = 40;  // 40% fuels Mind autonomous research compute
    uint256 public constant CREATOR_SHARE_PCT = 30;  // 30% to thesis/argument creator
    uint256 public constant TREASURY_SHARE_PCT = 30; // 30% to platform treasury
    
    enum MarketStatus { ACTIVE, LOCKED, RESOLVED_SUPPORT, RESOLVED_CHALLENGE, CANCELLED }
    
    struct Market {
        uint256 id;
        string mindId;             // Unique Mind identifier (e.g., "MIND-B694")
        string argumentId;         // Unique Argument identifier (e.g., "arg-con-1")
        string claim;              // Debatable thesis / claim statement
        address creator;           // Thesis submitter or Mind founder
        uint256 supportPool;       // Total USDC staked on SUPPORT (true)
        uint256 challengePool;     // Total USDC staked on CHALLENGE (false)
        uint256 totalVolume;       // Lifetime volume in USDC
        uint256 endsAt;            // Timestamp when staking closes
        MarketStatus status;       // State tracker
        string resolutionProof;    // Academic / empirical citation proof URI or hash
        uint256 computeGrantPool;  // Accumulated fees allocated to Mind AI compute
        uint256 creatorFeePool;    // Accumulated fees claimable by creator
        bool creatorClaimed;       // Creator claim status
    }
    
    struct Stake {
        uint256 id;
        uint256 marketId;
        address staker;
        bool isSupport;            // true = SUPPORT, false = CHALLENGE
        uint256 amount;            // USDC amount placed (6 decimals)
        uint256 priceBasis;        // Implied odds basis (1-99) at time of stake
        uint256 sharesMinted;      // Claimable shares upon winning
        bool claimed;              // Has winning payout been collected
    }
    
    uint256 public marketCount;
    uint256 public stakeCount;
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => Stake) public stakes;
    
    // Lookup mappings
    mapping(string => uint256) public argumentToMarketId;
    mapping(address => uint256[]) public userStakeIds;
    
    // Events
    event MarketCreated(
        uint256 indexed id,
        string indexed mindId,
        string indexed argumentId,
        string claim,
        address creator,
        uint256 endsAt
    );
    event StakePlaced(
        uint256 indexed stakeId,
        uint256 indexed marketId,
        address indexed staker,
        bool isSupport,
        uint256 amount,
        uint256 sharesMinted
    );
    event MarketResolved(
        uint256 indexed marketId,
        MarketStatus status,
        string resolutionProof
    );
    event PayoutClaimed(
        uint256 indexed stakeId,
        uint256 indexed marketId,
        address indexed staker,
        uint256 payoutAmount
    );
    event ComputeGrantDisbursed(
        uint256 indexed marketId,
        string mindId,
        address recipient,
        uint256 amount
    );
    event CreatorFeesClaimed(
        uint256 indexed marketId,
        address creator,
        uint256 amount
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == resolverOracle || msg.sender == owner, "Only Oracle or Owner");
        _;
    }
    
    constructor(address _usdcAddress, address _treasury) {
        require(_usdcAddress != address(0), "Invalid USDC");
        require(_treasury != address(0), "Invalid Treasury");
        usdcToken = IERC20(_usdcAddress);
        treasuryWallet = _treasury;
        owner = msg.sender;
        resolverOracle = msg.sender;
    }
    
    /**
     * @notice Creates a prediction market for a specific Mind argument or thesis.
     */
    function createMarket(
        string calldata _mindId,
        string calldata _argumentId,
        string calldata _claim,
        address _creator,
        uint256 _duration
    ) external returns (uint256) {
        uint256 newId = ++marketCount;
        
        markets[newId] = Market({
            id: newId,
            mindId: _mindId,
            argumentId: _argumentId,
            claim: _claim,
            creator: _creator == address(0) ? msg.sender : _creator,
            supportPool: 0,
            challengePool: 0,
            totalVolume: 0,
            endsAt: block.timestamp + _duration,
            status: MarketStatus.ACTIVE,
            resolutionProof: "",
            computeGrantPool: 0,
            creatorFeePool: 0,
            creatorClaimed: false
        });
        
        argumentToMarketId[_argumentId] = newId;
        
        emit MarketCreated(newId, _mindId, _argumentId, _claim, _creator, block.timestamp + _duration);
        return newId;
    }
    
    /**
     * @notice Places a stake on SUPPORT (true) or CHALLENGE (false) for a Mind argument.
     * @param _marketId Target argument prediction market ID.
     * @param _isSupport true = SUPPORT thesis, false = CHALLENGE thesis.
     * @param _amount USDC stake amount (6 decimals, e.g. 5_000_000 for $5).
     */
    function placeStake(
        uint256 _marketId,
        bool _isSupport,
        uint256 _amount
    ) external returns (uint256) {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.ACTIVE, "Market is closed for staking");
        require(block.timestamp < market.endsAt, "Market duration has expired");
        require(_amount >= 500_000, "Minimum stake is 0.50 USDC");
        
        // Transfer USDC from user to contract
        require(usdcToken.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");
        
        // Calculate Protocol Fees (2.5%)
        uint256 fee = (_amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 stakingCapital = _amount - fee;
        
        // 40% compute, 30% creator, 30% treasury
        uint256 computeFee = (fee * COMPUTE_SHARE_PCT) / 100;
        uint256 creatorFee = (fee * CREATOR_SHARE_PCT) / 100;
        market.computeGrantPool += computeFee;
        market.creatorFeePool += creatorFee;
        market.totalVolume += _amount;
        
        uint256 treasuryFee = fee - computeFee - creatorFee;
        if (treasuryFee > 0 && treasuryWallet != address(0)) {
            require(usdcToken.transfer(treasuryWallet, treasuryFee), "Treasury transfer failed");
        }
        
        // Update pool balances
        if (_isSupport) {
            market.supportPool += stakingCapital;
        } else {
            market.challengePool += stakingCapital;
        }
        
        // Calculate dynamically implied odds pricing (CPMM-style 1-99 price basis)
        uint256 priceBasis;
        {
            uint256 totalPool = market.supportPool + market.challengePool;
            uint256 oddsNum = _isSupport ? market.supportPool : market.challengePool;
            priceBasis = (oddsNum * 100) / totalPool;
            if (priceBasis == 0) priceBasis = 1;
            if (priceBasis > 99) priceBasis = 99;
        }
        
        uint256 sharesMinted = (stakingCapital * 100) / priceBasis;
        uint256 newStakeId = ++stakeCount;
        
        stakes[newStakeId] = Stake({
            id: newStakeId,
            marketId: _marketId,
            staker: msg.sender,
            isSupport: _isSupport,
            amount: _amount,
            priceBasis: priceBasis,
            sharesMinted: sharesMinted,
            claimed: false
        });
        
        userStakeIds[msg.sender].push(newStakeId);
        
        emit StakePlaced(newStakeId, _marketId, msg.sender, _isSupport, _amount, sharesMinted);
        return newStakeId;
    }
    
    /**
     * @notice Autonomous Agent / Oracle resolves market outcome with verifiable proof.
     */
    function resolveMarket(
        uint256 _marketId,
        bool _supportWon,
        string calldata _resolutionProof
    ) external onlyOracle {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.ACTIVE || market.status == MarketStatus.LOCKED, "Market not in resolvable state");
        
        market.status = _supportWon ? MarketStatus.RESOLVED_SUPPORT : MarketStatus.RESOLVED_CHALLENGE;
        market.resolutionProof = _resolutionProof;
        
        emit MarketResolved(_marketId, market.status, _resolutionProof);
    }
    
    /**
     * @notice Winning stakers claim their USDC payout.
     */
    function claimPayout(uint256 _stakeId) external returns (uint256) {
        Stake storage stake = stakes[_stakeId];
        require(stake.staker == msg.sender, "Only staker can claim payout");
        require(!stake.claimed, "Payout already claimed");
        
        Market storage market = markets[stake.marketId];
        require(
            market.status == MarketStatus.RESOLVED_SUPPORT || 
            market.status == MarketStatus.RESOLVED_CHALLENGE,
            "Market is not yet resolved"
        );
        
        bool winCondition = (market.status == MarketStatus.RESOLVED_SUPPORT && stake.isSupport) ||
                            (market.status == MarketStatus.RESOLVED_CHALLENGE && !stake.isSupport);
                            
        require(winCondition, "Position did not win consensus");
        
        stake.claimed = true;
        uint256 payoutAmount = stake.sharesMinted;
        
        // Ensure contract has sufficient balance to pay out
        uint256 contractBal = usdcToken.balanceOf(address(this));
        if (payoutAmount > contractBal) {
            payoutAmount = contractBal;
        }
        
        require(usdcToken.transfer(msg.sender, payoutAmount), "Payout transfer failed");
        
        emit PayoutClaimed(_stakeId, stake.marketId, msg.sender, payoutAmount);
        return payoutAmount;
    }
    
    /**
     * @notice Creator withdraws accumulated research tip shares.
     */
    function claimCreatorFees(uint256 _marketId) external returns (uint256) {
        Market storage market = markets[_marketId];
        require(msg.sender == market.creator, "Only creator can claim");
        require(!market.creatorClaimed, "Creator fees already claimed");
        require(market.creatorFeePool > 0, "No fees available");
        
        uint256 amount = market.creatorFeePool;
        market.creatorClaimed = true;
        market.creatorFeePool = 0;
        
        require(usdcToken.transfer(msg.sender, amount), "Creator fee transfer failed");
        emit CreatorFeesClaimed(_marketId, msg.sender, amount);
        return amount;
    }
    
    /**
     * @notice Disburses accumulated compute research budget directly to inference provider.
     */
    function disburseComputeGrant(
        uint256 _marketId,
        address _computeRecipient
    ) external onlyOracle returns (uint256) {
        Market storage market = markets[_marketId];
        uint256 grant = market.computeGrantPool;
        require(grant > 0, "No compute grant to disburse");
        require(_computeRecipient != address(0), "Invalid compute recipient");
        
        market.computeGrantPool = 0;
        require(usdcToken.transfer(_computeRecipient, grant), "Compute grant transfer failed");
        
        emit ComputeGrantDisbursed(_marketId, market.mindId, _computeRecipient, grant);
        return grant;
    }
    
    /**
     * @notice View helper returning live odds, pool sizes, and multipliers.
     */
    function getMarketOdds(uint256 _marketId) external view returns (
        uint256 supportOdds,
        uint256 challengeOdds,
        uint256 supportPool,
        uint256 challengePool,
        uint256 totalPool,
        uint256 supportMultiplierBps,
        uint256 challengeMultiplierBps
    ) {
        Market storage market = markets[_marketId];
        supportPool = market.supportPool;
        challengePool = market.challengePool;
        totalPool = supportPool + challengePool;
        
        if (totalPool == 0) {
            return (50, 50, 0, 0, 0, 200, 200);
        }
        
        supportOdds = (supportPool * 100) / totalPool;
        challengeOdds = 100 - supportOdds;
        
        // Multipliers in basis points (e.g. 200 = 2.0x, 150 = 1.5x)
        supportMultiplierBps = supportPool > 0 ? (totalPool * 100) / supportPool : 200;
        challengeMultiplierBps = challengePool > 0 ? (totalPool * 100) / challengePool : 200;
    }
    
    function getUserStakes(address _user) external view returns (uint256[] memory) {
        return userStakeIds[_user];
    }
    
    // Administrative configuration
    function setResolverOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid Oracle");
        resolverOracle = _newOracle;
    }
    
    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid Treasury");
        treasuryWallet = _newTreasury;
    }
}
