#!/usr/bin/env node

/**
 * Interactive Agent Builder CLI
 * Guides users through creating new agents step-by-step
 */

import readline from 'readline';
import { AgentBuilderService } from '../server/services/agentBuilderService.ts';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const conversation = {
  phase: 'welcome'
};

const builder = AgentBuilderService.getInstance();

// ANSI color helpers (fallback for non-chalk environments)
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function log(message, color = null) {
  if (color && colors[color]) {
    console.log(colors[color](message));
  } else {
    console.log(message);
  }
}

function logBox(title, content) {
  const width = 60;
  const border = '═'.repeat(width);

  console.log('\n' + colors.cyan('╔' + border + '╗'));
  console.log(colors.cyan('║') + colors.bold(` ${title.padEnd(width - 1)}`) + colors.cyan('║'));
  console.log(colors.cyan('╠' + border + '╣'));

  content.forEach(line => {
    console.log(colors.cyan('║') + ` ${line.padEnd(width - 1)}` + colors.cyan('║'));
  });

  console.log(colors.cyan('╚' + border + '╝') + '\n');
}

async function welcome() {
  console.clear();

  logBox('🏗️  AGENT BUILDER - ACE', [
    '',
    'Welcome to the Interactive Agent Creation Wizard!',
    '',
    'I will guide you through creating a custom AI agent',
    'with all the configurations, workflows, and integrations',
    'you need.',
    ''
  ]);

  const ready = await ask(colors.green('Ready to get started? (yes/no): '));

  if (ready.toLowerCase() !== 'yes' && ready.toLowerCase() !== 'y') {
    log('\n👋 No problem! Run this script again when you\'re ready.\n', 'yellow');
    rl.close();
    process.exit(0);
  }

  conversation.phase = 'purpose';
  await askPurpose();
}

async function askPurpose() {
  console.clear();
  logBox('Step 1: Define Purpose', [
    '',
    'What will your agent do?',
    '',
    'Examples:',
    '  • "Help customers book appointments and answer FAQs"',
    '  • "Manage social media posts across platforms"',
    '  • "Analyze sales data and generate reports"',
    '  • "Create and send newsletters to subscribers"',
    ''
  ]);

  const purpose = await ask(colors.cyan('Agent Purpose: '));

  if (!purpose) {
    log('\n⚠️  Purpose is required. Let\'s try again.\n', 'yellow');
    await askPurpose();
    return;
  }

  conversation.purpose = purpose;
  conversation.phase = 'category';
  await askCategory();
}

async function askCategory() {
  console.clear();
  logBox('Step 2: Choose Category', [
    '',
    'Select the category that best fits your agent:',
    '',
    '  1. MARKETING  - Social media, newsletters, content',
    '  2. SALES      - Lead generation, CRM, quotes',
    '  3. HR         - Recruitment, onboarding, employee management',
    '  4. SUPPORT    - Customer service, ticketing, FAQs',
    '  5. OPERATIONS - Workflow automation, task management',
    '  6. GENERAL    - Multi-purpose or custom',
    ''
  ]);

  const categoryChoice = await ask(colors.cyan('Select category (1-6): '));

  const categories = ['MARKETING', 'SALES', 'HR', 'SUPPORT', 'OPERATIONS', 'GENERAL'];
  const categoryIndex = parseInt(categoryChoice) - 1;

  if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= categories.length) {
    log('\n⚠️  Invalid choice. Please enter a number 1-6.\n', 'yellow');
    await askCategory();
    return;
  }

  conversation.category = categories[categoryIndex];
  conversation.phase = 'naming';
  await askNaming();
}

async function askNaming() {
  console.clear();
  logBox('Step 3: Name Your Agent', [
    '',
    `Category: ${conversation.category}`,
    `Purpose: ${conversation.purpose}`,
    '',
    'Give your agent a memorable name.',
    '',
    'Examples:',
    '  • "Sophia | Social Media Superhero"',
    '  • "Alex | Sales Assistant"',
    '  • "Nova | Newsletter Creator"',
    ''
  ]);

  const name = await ask(colors.cyan('Agent Name: '));

  if (!name) {
    log('\n⚠️  Name is required. Let\'s try again.\n', 'yellow');
    await askNaming();
    return;
  }

  conversation.name = name;
  conversation.id = builder.generateAgentId(name);

  log(`\n✅ Agent ID will be: ${colors.bold(conversation.id)}\n`, 'green');

  const confirm = await ask(colors.yellow('Is this ID okay? (yes/no): '));

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    const customId = await ask(colors.cyan('Enter custom ID (lowercase, underscores): '));
    if (customId) {
      conversation.id = customId;
    }
  }

  conversation.phase = 'personality';
  await askPersonality();
}

async function askPersonality() {
  console.clear();
  logBox('Step 4: Define Personality', [
    '',
    'How should your agent communicate?',
    ''
  ]);

  // Tone
  log(colors.bold('Communication Tone:'));
  log('  1. professional  2. friendly  3. casual  4. enthusiastic  5. formal\n');
  const toneChoice = await ask(colors.cyan('Select tone (1-5, or custom): '));

  const tones = ['professional', 'friendly', 'casual', 'enthusiastic', 'formal'];
  conversation.tone = tones[parseInt(toneChoice) - 1] || toneChoice || 'professional';

  // Style
  log('\n' + colors.bold('Interaction Style:'));
  log('  1. helpful  2. concise  3. detailed  4. trendy  5. supportive\n');
  const styleChoice = await ask(colors.cyan('Select style (1-5, or custom): '));

  const styles = ['helpful', 'concise', 'detailed', 'trendy', 'supportive'];
  conversation.style = styles[parseInt(styleChoice) - 1] || styleChoice || 'helpful';

  // Approach
  log('\n' + colors.bold('Response Approach:'));
  log('  1. proactive  2. consultative  3. data_driven  4. solution_focused\n');
  const approachChoice = await ask(colors.cyan('Select approach (1-4, or custom): '));

  const approaches = ['proactive', 'consultative', 'data_driven', 'solution_focused'];
  conversation.approach = approaches[parseInt(approachChoice) - 1] || approachChoice || 'proactive';

  conversation.phase = 'capabilities';
  await askCapabilities();
}

async function askCapabilities() {
  console.clear();
  logBox('Step 5: Define Capabilities', [
    '',
    'What can your agent do? List 3-5 main capabilities.',
    '',
    'Example:',
    '  • "Schedule and publish social media posts"',
    '  • "Generate content ideas and captions"',
    '  • "Track engagement metrics and analytics"',
    ''
  ]);

  const capabilities = [];

  for (let i = 1; i <= 5; i++) {
    const capability = await ask(colors.cyan(`Capability ${i} (or press Enter to skip): `));

    if (!capability && i <= 3) {
      log('⚠️  At least 3 capabilities recommended. Please continue.\n', 'yellow');
      i--;
      continue;
    }

    if (!capability) break;

    capabilities.push(capability);
  }

  conversation.capabilities = capabilities;
  conversation.phase = 'integrations';
  await askIntegrations();
}

async function askIntegrations() {
  console.clear();
  logBox('Step 6: Platform Integrations', [
    '',
    'Does your agent need to integrate with external platforms?',
    '',
    'Available integrations:',
    '  1. GoHighLevel (GHL) - CRM and automation',
    '  2. Facebook Business - Social media posting',
    '  3. Instagram Business - Social media posting',
    '  4. LinkedIn - Professional networking',
    '  5. Google Calendar - Scheduling',
    '  6. Supabase - Database',
    '  7. None - No integrations needed',
    ''
  ]);

  const platforms = [];
  const integrations = [];

  let selecting = true;

  while (selecting) {
    const choice = await ask(colors.cyan('Select integration (1-7, or "done"): '));

    if (choice.toLowerCase() === 'done' || choice === '') {
      selecting = false;
      break;
    }

    const choiceNum = parseInt(choice);

    if (choiceNum === 7) {
      selecting = false;
      break;
    }

    const platformMap = {
      1: { name: 'GHL', integration: 'ghl' },
      2: { name: 'Facebook', integration: 'facebook' },
      3: { name: 'Instagram', integration: 'instagram' },
      4: { name: 'LinkedIn', integration: 'linkedin' },
      5: { name: 'Google Calendar', integration: 'google_calendar' },
      6: { name: 'Supabase', integration: 'supabase' }
    };

    if (platformMap[choiceNum]) {
      const platform = platformMap[choiceNum];
      if (!platforms.includes(platform.name)) {
        platforms.push(platform.name);
        integrations.push(platform.integration);
        log(`  ✅ Added ${platform.name}\n`, 'green');
      } else {
        log(`  ⚠️  ${platform.name} already added\n`, 'yellow');
      }
    }
  }

  conversation.platforms = platforms;
  conversation.integrations = integrations;
  conversation.phase = 'ui';
  await askUI();
}

async function askUI() {
  console.clear();
  logBox('Step 7: Custom UI', [
    '',
    'Does your agent need a custom user interface?',
    '',
    '  • Standard: Use default chat interface (recommended)',
    '  • Custom: Generate from Figma design (advanced)',
    ''
  ]);

  const needsCustom = await ask(colors.cyan('Need custom UI? (yes/no): '));

  conversation.needsCustomUI = needsCustom.toLowerCase() === 'yes' || needsCustom.toLowerCase() === 'y';

  if (conversation.needsCustomUI) {
    const figmaUrl = await ask(colors.cyan('Figma URL (or deployed site URL): '));
    conversation.figmaUrl = figmaUrl;
  }

  conversation.phase = 'summary';
  await showSummary();
}

async function showSummary() {
  console.clear();

  const tier = builder.detectTier(conversation);

  logBox('📋 Agent Summary', [
    '',
    `Name: ${conversation.name}`,
    `ID: ${conversation.id}`,
    `Category: ${conversation.category}`,
    `Tier: ${tier} (${getTierName(tier)})`,
    '',
    `Tone: ${conversation.tone}`,
    `Style: ${conversation.style}`,
    `Approach: ${conversation.approach}`,
    '',
    'Capabilities:',
    ...conversation.capabilities.map(c => `  • ${c}`),
    '',
    'Integrations:',
    ...(conversation.platforms.length > 0
      ? conversation.platforms.map(p => `  • ${p}`)
      : ['  • None']),
    '',
    `Custom UI: ${conversation.needsCustomUI ? 'Yes' : 'No'}`,
    ''
  ]);

  const confirm = await ask(colors.green('Generate agent files? (yes/no): '));

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    log('\n❌ Agent creation cancelled.\n', 'yellow');
    rl.close();
    process.exit(0);
  }

  await generateAgent();
}

async function generateAgent() {
  console.clear();
  log('\n🚀 Generating agent files...\n', 'cyan');

  try {
    const result = await builder.saveAgent(conversation);

    log('✅ YAML configuration generated', 'green');
    log(`   ${result.yamlPath}\n`);

    log('✅ N8N workflow template generated', 'green');
    log(`   ${result.n8nWorkflowPath}\n`);

    log('✅ Setup guide generated', 'green');
    log(`   See below for next steps\n`);

    console.log(colors.bold('\n' + '='.repeat(60)));
    console.log(result.setupGuide);
    console.log(colors.bold('='.repeat(60) + '\n'));

    log('🎉 Agent created successfully!\n', 'green');
    log('Next steps:', 'cyan');
    log('  1. Review the generated YAML configuration');
    log('  2. Import the N8N workflow to your N8N instance');
    log('  3. Configure any required integrations');
    log('  4. Run: npm run dev');
    log('  5. Test your new agent!\n');

  } catch (error) {
    log(`\n❌ Error generating agent: ${error.message}\n`, 'yellow');
  }

  rl.close();
}

function getTierName(tier) {
  const names = {
    1: 'Basic Chat',
    2: 'Platform Integrated',
    3: 'Domain Expert',
    4: 'Multi-Modal'
  };
  return names[tier] || 'Unknown';
}

// Start the wizard
welcome().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
