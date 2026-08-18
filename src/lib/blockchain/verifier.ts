// ============================================================================
// MINDCAST — Production-grade Blockchain RPC Payment Verifier
// ============================================================================

export async function verifyOnChainPayment(txHash: string, customExpectedAmount?: number): Promise<{ success: boolean; error?: string }> {
  try {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '84532';
    const rpcUrl = process.env.RPC_MAINNET_BASE || process.env.BLOCKCHAIN_RPC_URL || (chainId === '84532' ? 'https://sepolia.base.org' : 'https://mainnet.base.org');
    const usdcContract = (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e').toLowerCase();
    const recipient = (process.env.PAYMENT_RECIPIENT_ADDRESS || '0xB284ED722cCC17B0BE3737A1a5cA8b991fA81F3a').toLowerCase();
    const expectedAmount = customExpectedAmount !== undefined ? customExpectedAmount : parseFloat(process.env.PAYMENT_AMOUNT || '1.0');

    // 1. Fetch transaction receipt via JSON-RPC
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })
    });

    if (!response.ok) {
      return { success: false, error: `RPC node returned status ${response.status}` };
    }

    const json = await response.json();
    if (json.error) {
      return { success: false, error: json.error.message };
    }

    const receipt = json.result;
    if (!receipt) {
      return { success: false, error: 'Transaction receipt not found yet. Confirmations pending.' };
    }

    // 2. Verify status is successful (0x1)
    if (receipt.status !== '0x1') {
      return { success: false, error: 'Transaction failed on-chain' };
    }

    // 3. Verify logs for ERC20 Transfer event
    // Signature: Transfer(address,address,uint256)
    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    // Padded address helper to compare topics
    const padAddress = (addr: string) => '0x' + addr.toLowerCase().replace('0x', '').padStart(64, '0');
    const recipientTopic = padAddress(recipient);

    let transferFound = false;
    let transferAmount = 0;

    for (const log of (receipt.logs || [])) {
      const logContract = log.address.toLowerCase();
      const topics = log.topics || [];
      
      if (
        logContract === usdcContract &&
        topics[0] === transferTopic &&
        topics[2]?.toLowerCase() === recipientTopic
      ) {
        transferFound = true;
        // Parse transfer amount (6 decimals for USDC)
        const hexVal = log.data;
        const rawVal = BigInt(hexVal === '0x' ? '0' : hexVal);
        transferAmount = Number(rawVal) / 1000000;
        break;
      }
    }

    if (!transferFound) {
      return { success: false, error: `USDC Transfer to recipient ${recipient} not found in transaction logs.` };
    }

    if (transferAmount < expectedAmount) {
      return { success: false, error: `Incorrect payment amount. Expected at least ${expectedAmount} USDC, got ${transferAmount} USDC.` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown verification error' };
  }
}
