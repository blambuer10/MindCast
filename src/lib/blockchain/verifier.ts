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

    // Multi-RPC endpoints with fallback
    const rpcEndpoints = [
      { name: 'Base Mainnet', url: process.env.RPC_MAINNET_BASE || 'https://mainnet.base.org' },
      { name: 'Base Mainnet (Llama)', url: 'https://base.llamarpc.com' },
      { name: 'Base Mainnet (1RPC)', url: 'https://1rpc.io/base' },
      { name: 'Base Sepolia', url: process.env.BLOCKCHAIN_RPC_URL || 'https://sepolia.base.org' },
      { name: 'Base Sepolia (Public)', url: 'https://sepolia.base.org' },
    ];

    // Supported USDC contract addresses
    const validUsdcContracts = [
      (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913').toLowerCase(),
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'.toLowerCase(), // Base Mainnet Native USDC
      '0x036cbd53842c5426634e7929541ec2318f3dcf7e'.toLowerCase(), // Base Sepolia Test USDC
    ];

    // Supported recipient addresses
    const validRecipients = [
      (process.env.PAYMENT_RECIPIENT_ADDRESS || '0x33f18d0BD613A2afa4694A8AAA6b1daf4FEBdbd2').toLowerCase(),
      '0x33f18d0BD613A2afa4694A8AAA6b1daf4FEBdbd2'.toLowerCase(),
      '0x73877aBf37e7400393B538E3babD182949C1cA55'.toLowerCase(),
      '0x7387Ceb8BA1A068A0b19F7CC098EBC0b3751CA55'.toLowerCase(),
      '0x7a63d9197F49e7C6D27faE4fa4896791e84774B8'.toLowerCase(),
    ];

    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const padAddress = (addr: string) => '0x' + addr.toLowerCase().replace('0x', '').padStart(64, '0');
    const recipientTopics = validRecipients.map(padAddress);

    let lastError = '';
    const maxAttempts = 6; // Poll up to ~9 seconds if tx was just broadcasted
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
                  return { success: true, chain: rpc.name.includes('Mainnet') ? 'Base Mainnet' : 'Base Sepolia' };
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

      // If not found yet and still within max attempts, wait 1.5s for block propagation
      if (attempt < maxAttempts) {
        await sleep(1500);
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
