/**
 * GoHighLevel (GHL) Automation Script
 *
 * This script automates the setup of a GHL subaccount for Squidgy agents.
 *
 * Usage:
 *   npx tsx integration-helpers/playwright/ghl-setup.ts
 *
 * What it does:
 *   - Logs into GHL agency account
 *   - Creates a new subaccount (location)
 *   - Configures basic settings
 *   - Retrieves API credentials
 *   - Saves configuration to .env file
 */

import { chromium, Browser, Page } from 'playwright';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m'     // Yellow
  };

  const icons = {
    info: 'ℹ',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  };

  console.log(`${colors[type]}${icons[type]} ${message}\x1b[0m`);
}

async function setupGHL() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    log('Starting GoHighLevel automation setup...', 'info');
    log('', 'info');

    // Get configuration from user
    const agentId = await ask('Agent ID (e.g., social_media_agent): ');
    const subaccountName = await ask('Subaccount name (e.g., "ACME Corp - Squidgy"): ');
    const ghlEmail = await ask('GHL Agency account email: ');
    const ghlPassword = await ask('GHL Agency account password: ');

    log('', 'info');
    log('Launching browser...', 'info');

    // Launch browser in non-headless mode so user can see what's happening
    browser = await chromium.launch({
      headless: false,
      slowMo: 500 // Slow down for visibility
    });

    page = await browser.newPage();

    // Step 1: Login to GHL
    log('Logging into GoHighLevel...', 'info');
    await page.goto('https://app.gohighlevel.com/');
    await page.waitForTimeout(2000);

    // Fill login form
    await page.fill('input[type="email"]', ghlEmail);
    await page.fill('input[type="password"]', ghlPassword);
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL('**/location/**', { timeout: 30000 });
    log('Login successful!', 'success');

    // Step 2: Navigate to agency view
    log('Navigating to agency settings...', 'info');
    await page.goto('https://app.gohighlevel.com/v2/agency/settings');
    await page.waitForTimeout(2000);

    // Step 3: Create subaccount
    log(`Creating subaccount: ${subaccountName}...`, 'info');

    // Click "Add Location" button
    const addLocationButton = await page.waitForSelector('button:has-text("Add Location"), button:has-text("Add Sub-Account")');
    await addLocationButton.click();
    await page.waitForTimeout(1000);

    // Fill subaccount details
    await page.fill('input[name="name"], input[placeholder*="name"]', subaccountName);

    // Optional: Fill additional fields if needed
    // await page.fill('input[name="address"]', 'Optional address');
    // await page.fill('input[name="city"]', 'Optional city');

    // Submit form
    const createButton = await page.waitForSelector('button:has-text("Create"), button:has-text("Save")');
    await createButton.click();

    // Wait for subaccount to be created
    await page.waitForTimeout(3000);
    log('Subaccount created successfully!', 'success');

    // Step 4: Get API credentials
    log('Retrieving API credentials...', 'info');

    // Navigate to subaccount settings
    // This varies by GHL version, so we'll provide instructions
    log('', 'warn');
    log('MANUAL STEP REQUIRED:', 'warn');
    log('1. Navigate to Settings > API in the GHL dashboard', 'warn');
    log('2. Generate an API key if not already available', 'warn');
    log('3. Copy the Location ID and API Key', 'warn');
    log('', 'warn');

    const locationId = await ask('Paste the Location ID: ');
    const apiKey = await ask('Paste the API Key (or Bearer Token): ');

    // Step 5: Save to .env file
    log('Saving configuration...', 'info');

    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Add GHL config for this agent
    const ghlConfig = `
# GoHighLevel Configuration for ${agentId}
GHL_${agentId.toUpperCase()}_LOCATION_ID=${locationId}
GHL_${agentId.toUpperCase()}_API_KEY=${apiKey}
GHL_${agentId.toUpperCase()}_SUBACCOUNT_NAME=${subaccountName}
`;

    // Append if not already present
    if (!envContent.includes(`GHL_${agentId.toUpperCase()}_LOCATION_ID`)) {
      fs.appendFileSync(envPath, ghlConfig);
      log('Configuration saved to .env file!', 'success');
    } else {
      log('Configuration already exists in .env file', 'warn');
    }

    // Step 6: Save to Supabase (optional)
    log('', 'info');
    const saveToSupabase = await ask('Save to Supabase database? (yes/no): ');

    if (saveToSupabase.toLowerCase() === 'yes' || saveToSupabase.toLowerCase() === 'y') {
      log('', 'info');
      log('To save to Supabase, add this to your ghl_subaccounts table:', 'info');
      log('', 'info');
      log('INSERT INTO ghl_subaccounts (', 'info');
      log('  agent_id,', 'info');
      log('  ghl_location_id,', 'info');
      log('  pit_token,', 'info');
      log('  subaccount_name', 'info');
      log(') VALUES (', 'info');
      log(`  '${agentId}',`, 'info');
      log(`  '${locationId}',`, 'info');
      log(`  '${apiKey}',`, 'info');
      log(`  '${subaccountName}'`, 'info');
      log(');', 'info');
      log('', 'info');
    }

    // Summary
    log('', 'success');
    log('═'.repeat(60), 'success');
    log('GHL SETUP COMPLETE!', 'success');
    log('═'.repeat(60), 'success');
    log('', 'info');
    log('Configuration:', 'info');
    log(`  Agent ID: ${agentId}`, 'info');
    log(`  Subaccount: ${subaccountName}`, 'info');
    log(`  Location ID: ${locationId}`, 'info');
    log('', 'info');
    log('Next steps:', 'info');
    log('  1. Update your agent YAML with GHL integration', 'info');
    log('  2. Use GHLMediaService in your agent code', 'info');
    log('  3. Test the integration', 'info');
    log('', 'info');

    // Keep browser open for verification
    const keepOpen = await ask('Keep browser open for verification? (yes/no): ');

    if (keepOpen.toLowerCase() !== 'yes' && keepOpen.toLowerCase() !== 'y') {
      await browser.close();
    } else {
      log('Browser will stay open. Close it manually when done.', 'info');
    }

  } catch (error: any) {
    log(`Error during GHL setup: ${error.message}`, 'error');
    log('', 'error');
    log('Troubleshooting:', 'warn');
    log('  1. Ensure you have the correct GHL agency credentials', 'warn');
    log('  2. Check if GHL UI has changed (update selectors if needed)', 'warn');
    log('  3. Try running the script again', 'warn');

    if (browser) {
      await browser.close();
    }

  } finally {
    rl.close();
  }
}

// Run the automation
log('', 'info');
log('🏗️  GoHighLevel (GHL) Automation Setup', 'info');
log('═'.repeat(60), 'info');
log('', 'info');
log('This script will automate the creation of a GHL subaccount', 'info');
log('for your Squidgy agent.', 'info');
log('', 'info');
log('Requirements:', 'warn');
log('  ✓ GHL Agency account credentials', 'warn');
log('  ✓ Permission to create subaccounts', 'warn');
log('  ✓ Playwright installed (npm install @playwright/test)', 'warn');
log('', 'info');

setupGHL().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
