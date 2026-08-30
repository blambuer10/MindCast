import { getManifestConfig, getTokenAddress, validateTokenAddress } from '../src/lib/blockchain/config';

function testConfig() {
  console.log('--- Testing Chain Configuration & Token Mapping ---');
  
  const config = getManifestConfig();
  console.log('Successfully retrieved manifest config. Number of chains:', Object.keys(config.chains).length);
  
  const mainnetUsdc = getTokenAddress(8453, 'USDC');
  const sepoliaUsdc = getTokenAddress('84532', 'USDC');
  
  console.log('Base Mainnet USDC Address:', mainnetUsdc);
  console.log('Base Sepolia USDC Address:', sepoliaUsdc);
  
  const isValidMainnet = validateTokenAddress(8453, 'USDC', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
  const isValidSepolia = validateTokenAddress('84532', 'USDC', '0x036CbD53842c5426634e7929541eC2318f3dCF7e');
  const isInvalid = validateTokenAddress('84532', 'USDC', '0x0000000000000000000000000000000000000000');
  
  console.log('Is valid Mainnet USDC address validation working?', isValidMainnet ? 'PASS' : 'FAIL');
  console.log('Is valid Sepolia USDC address validation working?', isValidSepolia ? 'PASS' : 'FAIL');
  console.log('Is invalid USDC address correctly rejected?', !isInvalid ? 'PASS' : 'FAIL');
  
  if (isValidMainnet && isValidSepolia && !isInvalid) {
    console.log('ALL CONFIG & VALIDATION TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}

testConfig();
