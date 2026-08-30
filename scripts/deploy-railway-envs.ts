// ============================================================================
// MINDCAST — Auto-Deploy Environment Variables to Railway
// ============================================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[key] = value;
  }
}

const RAILWAY_TOKEN = envVars['RAILWAY_TOKEN'];
if (!RAILWAY_TOKEN) {
  console.error('[FAIL] RAILWAY_TOKEN not found in .env.local');
  process.exit(1);
}

const PROJECT_ID = 'b3eab2b7-a6b3-4cdf-9f48-fb539501c1ee';
const ENVIRONMENT_ID = '456619f5-c68d-4efa-8ec2-3b7664c22828';
const SERVICE_ID = 'd47648a8-e609-4687-8c2e-1241c0874f7c';

// Variables we want to upload (excluding local tools tokens)
const variablesToSync = [
  'AI_PROVIDER',
  'PAYMENT_AMOUNT',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  '0G_API_KEY',
  'ZEROG_API_URL',
  'ZEROG_MODEL',
  'NEXT_PUBLIC_CHAIN_ID',
  'NEXT_PUBLIC_CHAIN_NAME',
  'NEXT_PUBLIC_USDC_CONTRACT_ADDRESS',
  'PAYMENT_RECIPIENT_ADDRESS',
  'DATABASE_PATH',
  'TEST_PRIVATE_KEY',
  'ADMIN_WALLET_ADDRESS',
  'DEPLOY_PRIVATE_KEY'
];

async function syncVariables() {
  console.log('=== SYNCING ENVIRONMENT VARIABLES TO RAILWAY ===\n');

  for (const name of variablesToSync) {
    let value = envVars[name];
    if (value === undefined) {
      console.warn(`[WARN] Variable ${name} not found in .env.local, skipping...`);
      continue;
    }

    // Force database path to point to persistent volume in production
    if (name === 'DATABASE_PATH') {
      value = '/data/mindcast.db';
    }

    console.log(`Uploading ${name} ...`);

    const query = `
      mutation variableUpsert($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
      }
    `;

    const variables = {
      input: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID,
        name,
        value,
      }
    };

    const response = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Project-Access-Token': RAILWAY_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`[FAIL] Failed to upload ${name}: HTTP ${response.status}`);
      continue;
    }

    const resJson = await response.json();
    if (resJson.errors) {
      console.error(`[FAIL] GraphQL error uploading ${name}:`, resJson.errors[0].message);
    } else {
      console.log(`[OK] Successfully synchronized ${name}`);
    }
  }

  console.log('\n=== ENVIRONMENT VARIABLES SYNC COMPLETED ===');
  console.log('Railway is now automatically redeploying your container with the new configuration!');
}

syncVariables().catch(err => {
  console.error('[FAIL] Sync execution failed:', err);
});
