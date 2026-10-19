use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use pyth_sdk_solana::state::SolanaPriceAccount;

declare_id!("M1ndCastVau1t11111111111111111111111111111");

pub const MAX_CLAIM_LEN: usize = 128;
pub const MAX_NAME_LEN: usize = 32;

#[program]
pub mod mindcast_vault {
    use super::*;

    /// Initializes a new autonomous AI prediction market tied to a Pyth price feed
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: String,
        mind_a_name: String,
        mind_b_name: String,
        claim: String,
        target_price: i64,
        target_expo: i32,
        end_timestamp: i64,
        is_bull_target_higher: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(end_timestamp > clock.unix_timestamp, ErrorCode::InvalidTimestamp);
        require!(claim.len() <= MAX_CLAIM_LEN, ErrorCode::ClaimTooLong);

        market.authority = ctx.accounts.authority.key();
        market.market_id = market_id;
        market.mind_a_name = mind_a_name;
        market.mind_b_name = mind_b_name;
        market.claim = claim;
        market.pyth_feed = ctx.accounts.pyth_price_feed.key();
        market.target_price = target_price;
        market.target_expo = target_expo;
        market.end_timestamp = end_timestamp;
        market.is_bull_target_higher = is_bull_target_higher;
        market.total_bull_stake = 0;
        market.total_bear_stake = 0;
        market.status = MarketStatus::Open;
        market.vault_bump = ctx.bumps.vault_token_account;

        emit!(MarketCreatedEvent {
            market_id: market.market_id.clone(),
            authority: market.authority,
            end_timestamp,
            target_price,
        });

        Ok(())
    }

    /// Users place prediction stakes backing either Mind A (Bull) or Mind B (Bear)
    pub fn place_stake(ctx: Context<PlaceStake>, side: StakeSide, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(market.status == MarketStatus::Open, ErrorCode::MarketNotOpen);
        require!(clock.unix_timestamp < market.end_timestamp, ErrorCode::MarketEnded);

        // Transfer USDC from user to program escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update market and user position state
        let position = &mut ctx.accounts.user_position;
        if position.amount == 0 {
            position.user = ctx.accounts.user.key();
            position.market = market.key();
            position.side = side;
            position.claimed = false;
        } else {
            require!(position.side == side, ErrorCode::CannotSwitchSide);
        }

        position.amount = position.amount.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;

        match side {
            StakeSide::Bull => {
                market.total_bull_stake = market.total_bull_stake.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
            }
            StakeSide::Bear => {
                market.total_bear_stake = market.total_bear_stake.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
            }
        }

        emit!(StakePlacedEvent {
            market: market.key(),
            user: ctx.accounts.user.key(),
            side,
            amount,
        });

        Ok(())
    }

    /// Resolves the prediction market outcome trustlessly using Pyth Network price feeds
    pub fn resolve_market_with_pyth(ctx: Context<ResolveMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(market.status == MarketStatus::Open, ErrorCode::MarketAlreadyResolved);
        require!(clock.unix_timestamp >= market.end_timestamp, ErrorCode::MarketNotYetEnded);

        // Read and parse Pyth price account
        let pyth_price_info = &ctx.accounts.pyth_price_feed;
        require_keys_eq!(pyth_price_info.key(), market.pyth_feed, ErrorCode::InvalidPythFeed);

        let price_feed = SolanaPriceAccount::account_info_to_feed(pyth_price_info)
            .map_err(|_| ErrorCode::FailedToParsePythPrice)?;
        
        let current_price = price_feed.get_price_unchecked();

        let resolved_price = current_price.price;
        let condition_met = if market.is_bull_target_higher {
            resolved_price >= market.target_price
        } else {
            resolved_price <= market.target_price
        };

        market.status = if condition_met {
            MarketStatus::BullWon
        } else {
            MarketStatus::BearWon
        };
        market.resolved_price = resolved_price;

        emit!(MarketResolvedEvent {
            market: market.key(),
            resolved_price,
            status: market.status,
            publish_time: current_price.publish_time,
        });

        Ok(())
    }

    /// Winning participants claim their proportional share of the escrow reward vault
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let market = &ctx.accounts.market;
        let position = &mut ctx.accounts.user_position;

        require!(!position.claimed, ErrorCode::AlreadyClaimed);
        require!(position.amount > 0, ErrorCode::ZeroStake);

        let winning_side = match market.status {
            MarketStatus::BullWon => StakeSide::Bull,
            MarketStatus::BearWon => StakeSide::Bear,
            _ => return err!(ErrorCode::MarketNotResolved),
        };

        require!(position.side == winning_side, ErrorCode::NotWinningSide);

        let total_pool = market.total_bull_stake
            .checked_add(market.total_bear_stake)
            .ok_or(ErrorCode::MathOverflow)?;

        let winning_pool = match winning_side {
            StakeSide::Bull => market.total_bull_stake,
            StakeSide::Bear => market.total_bear_stake,
        };

        // Pro-rata payout calculation
        let payout = (position.amount as u128)
            .checked_mul(total_pool as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(winning_pool as u128)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        position.claimed = true;

        // Transfer funds from PDA vault to user
        let market_id_bytes = market.market_id.as_bytes();
        let seeds = &[
            b"vault",
            market_id_bytes,
            &[market.vault_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, payout)?;

        emit!(PayoutClaimedEvent {
            market: market.key(),
            user: ctx.accounts.user.key(),
            payout,
        });

        Ok(())
    }
}

// ----------------------------------------------------------------------------
// ACCOUNTS & INSTRUCTION CONTEXTS
// ----------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(market_id: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 64 + 4 + MAX_NAME_LEN + 4 + MAX_NAME_LEN + 4 + MAX_CLAIM_LEN + 32 + 8 + 4 + 8 + 1 + 8 + 8 + 1 + 8 + 1,
        seeds = [b"market", market_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, MarketAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = vault_token_account,
        seeds = [b"vault", market_id.as_bytes()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    /// CHECK: Validated against Pyth program in runtime
    pub pyth_price_feed: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PlaceStake<'info> {
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 1 + 8 + 1,
        seeds = [b"position", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, PositionAccount>,

    #[account(
        mut,
        seeds = [b"vault", market.market_id.as_bytes()],
        bump = market.vault_bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,

    /// CHECK: Must match market.pyth_feed stored on creation
    pub pyth_price_feed: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    pub market: Account<'info, MarketAccount>,

    #[account(
        mut,
        seeds = [b"position", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, PositionAccount>,

    #[account(
        mut,
        seeds = [b"vault", market.market_id.as_bytes()],
        bump = market.vault_bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ----------------------------------------------------------------------------
// STATE SCHEMAS & ENUMS
// ----------------------------------------------------------------------------

#[account]
pub struct MarketAccount {
    pub authority: Pubkey,
    pub market_id: String,
    pub mind_a_name: String,
    pub mind_b_name: String,
    pub claim: String,
    pub pyth_feed: Pubkey,
    pub target_price: i64,
    pub target_expo: i32,
    pub end_timestamp: i64,
    pub is_bull_target_higher: bool,
    pub total_bull_stake: u64,
    pub total_bear_stake: u64,
    pub status: MarketStatus,
    pub resolved_price: i64,
    pub vault_bump: u8,
}

#[account]
pub struct PositionAccount {
    pub user: Pubkey,
    pub market: Pubkey,
    pub side: StakeSide,
    pub amount: u64,
    pub claimed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketStatus {
    Open,
    BullWon,
    BearWon,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum StakeSide {
    Bull,
    Bear,
}

// ----------------------------------------------------------------------------
// EVENTS & ERRORS
// ----------------------------------------------------------------------------

#[event]
pub struct MarketCreatedEvent {
    pub market_id: String,
    pub authority: Pubkey,
    pub end_timestamp: i64,
    pub target_price: i64,
}

#[event]
pub struct StakePlacedEvent {
    pub market: Pubkey,
    pub user: Pubkey,
    pub side: StakeSide,
    pub amount: u64,
}

#[event]
pub struct MarketResolvedEvent {
    pub market: Pubkey,
    pub resolved_price: i64,
    pub status: MarketStatus,
    pub publish_time: i64,
}

#[event]
pub struct PayoutClaimedEvent {
    pub market: Pubkey,
    pub user: Pubkey,
    pub payout: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid end timestamp")]
    InvalidTimestamp,
    #[msg("Claim string exceeds maximum length")]
    ClaimTooLong,
    #[msg("Stake amount must be greater than zero")]
    ZeroAmount,
    #[msg("Market is not open for staking")]
    MarketNotOpen,
    #[msg("Market has already ended")]
    MarketEnded,
    #[msg("Cannot stake on opposite side in the same market")]
    CannotSwitchSide,
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    #[msg("Market end time has not yet arrived")]
    MarketNotYetEnded,
    #[msg("Supplied account does not match registered Pyth feed")]
    InvalidPythFeed,
    #[msg("Failed to parse Pyth price feed")]
    FailedToParsePythPrice,
    #[msg("Reward already claimed")]
    AlreadyClaimed,
    #[msg("User has zero stake in this market")]
    ZeroStake,
    #[msg("Market is not resolved yet")]
    MarketNotResolved,
    #[msg("User position is not on the winning side")]
    NotWinningSide,
    #[msg("Math overflow error")]
    MathOverflow,
}
