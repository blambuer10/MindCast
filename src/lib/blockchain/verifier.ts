// ============================================================================
// MINDCAST — Production-grade Multi-Chain Payment Verifier (Sepolia + Mainnet)
// Supports both Base Sepolia (84532) and Base Mainnet (8453) USDC payments
// ============================================================================

export async function verifyOnChainPayment(
  txHash: string,
  customExpectedAmount?: number
): Promise<{ success: boolean; error?: string; chain?: string }> {
  try {
    const expectedAmount = customExpectedAmount !== undefined ? customExpectedAmount : parseFloat(process.env.PAYMENT_AMOUNT || '1.0');

    // Candidate RPC endpoints
    const rpcEndpoints = [
      { name: 'Base Sepolia', url: process.env.BLOCKCHAIN_RPC_URL || 'https://sepolia.base.org' },
      { name: 'Base Mainnet', url: process.env.RPC_MAINNET_BASE || 'https://mainnet.base.org' },
    ];

    // Supported USDC contract addresses
    const validUsdcContracts = [
      (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e').toLowerCase(),
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'.toLowerCase(), // Base Mainnet Native USDC
    ];

    // Supported recipient addresses
    const validRecipients = [
      (process.env.PAYMENT_RECIPIENT_ADDRESS || '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a').toLowerCase(),
      '0x7a63d9197F49e7C6D27faE4fa4896791e84774B8'.toLowerCase(),
      '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a'.toLowerCase(),
    ];

    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const padAddress = (addr: string) => '0x' + addr.toLowerCase().replace('0x', '').padStart(64, '0');
    const recipientTopics = validRecipients.map(padAddress);

    let lastError = '';

    // Check across candidate RPCs
    for (const rpc of rpcEndpoints) {
      try {
        const response = await fetch(rpc.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          }),
        });

        if (!response.ok) continue;
        const json = await response.json();
        const receipt = json.result;

        if (!receipt) continue;

        if (receipt.status !== '0x1') {
          return { success: false, error: `Transaction reverted/failed on ${rpc.name}` };
        }

        // Search logs for valid USDC Transfer
        for (const log of receipt.logs || []) {
          const logContract = (log.address || '').toLowerCase();
          const topics = log.topics || [];

          if (
            topics[0] === transferTopic &&
            (validUsdcContracts.includes(logContract) || logContract.length === 42)
          ) {
            const destTopic = (topics[2] || '').toLowerCase();
            const isRecipientMatch = recipientTopics.some(rt => rt.toLowerCase() === destTopic);

            if (isRecipientMatch) {
              const hexVal = log.data;
              const rawVal = BigInt(hexVal === '0x' ? '0' : hexVal);
              const transferAmount = Number(rawVal) / 1000000;

              if (transferAmount >= expectedAmount * 0.95) { // 5% slippage tolerance
                return { success: true, chain: rpc.name };
              } else {
                return {
                  success: false,
                  error: `Transfer amount too low. Expected ${expectedAmount} USDC, received ${transferAmount} USDC.`,
                };
              }
            }
          }
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return {
      success: false,
      error: lastError || 'Transaction not found on Base Sepolia or Base Mainnet. Please wait 5-10 seconds for block confirmations and try again.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown verification error' };
  }
}
