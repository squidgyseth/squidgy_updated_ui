#!/usr/bin/env node

/**
 * Agent Configuration Validator
 * Validates YAML configuration files for Squidgy agents
 *
 * Usage:
 *   npm run agent:validate agents/configs/my_agent.yaml
 *   npm run agent:validate                    # Validates all agents
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function validateAgent(filePath) {
  const fileName = path.basename(filePath);
  const errors = [];
  const warnings = [];
  const info = [];

  try {
    // Read YAML file
    const content = fs.readFileSync(filePath, 'utf8');
    const config = yaml.load(content);

    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Validating: ${fileName}`, 'bright');
    log('='.repeat(60), 'cyan');

    // Required fields validation
    const requiredFields = {
      'agent.id': config.agent?.id,
      'agent.name': config.agent?.name,
      'agent.category': config.agent?.category,
      'agent.description': config.agent?.description,
      'n8n.webhook_url': config.n8n?.webhook_url
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Agent ID validation
    if (config.agent?.id) {
      const idRegex = /^[a-z0-9_]+$/;
      if (!idRegex.test(config.agent.id)) {
        errors.push('agent.id must be lowercase with underscores only (no spaces, no special chars)');
      }

      // Check if ID matches filename
      const expectedFilename = `${config.agent.id}.yaml`;
      if (fileName !== expectedFilename) {
        warnings.push(`Filename "${fileName}" doesn't match agent.id "${config.agent.id}". Expected: "${expectedFilename}"`);
      }
    }

    // Category validation
    const validCategories = ['MARKETING', 'SALES', 'HR', 'SUPPORT', 'OPERATIONS', 'GENERAL'];
    if (config.agent?.category && !validCategories.includes(config.agent.category)) {
      errors.push(`Invalid category "${config.agent.category}". Must be one of: ${validCategories.join(', ')}`);
    }

    // N8N webhook URL validation
    if (config.n8n?.webhook_url) {
      if (!config.n8n.webhook_url.startsWith('http')) {
        errors.push('n8n.webhook_url must be a valid URL starting with http:// or https://');
      }
    }

    // UI configuration validation
    if (config.ui?.page_type === 'figma' || config.ui?.page_type === 'multi_page') {
      if (!config.ui.figma_url && !config.ui.figma_deployed_url) {
        warnings.push('UI page_type is "figma" or "multi_page" but no figma_url or figma_deployed_url provided');
      }
    }

    // Interface features validation
    if (config.interface?.features) {
      const validFeatures = ['text_input', 'file_upload', 'voice_input', 'suggestion_buttons', 'calculator_widget', 'map_integration'];
      const invalidFeatures = config.interface.features.filter(f => !validFeatures.includes(f));

      if (invalidFeatures.length > 0) {
        warnings.push(`Unknown interface features: ${invalidFeatures.join(', ')}`);
      }
    }

    // Personality validation
    if (config.personality) {
      const validTones = ['creative', 'professional', 'casual', 'friendly', 'formal', 'enthusiastic'];
      const validStyles = ['helpful', 'trendy', 'concise', 'detailed', 'supportive', 'direct'];
      const validApproaches = ['proactive', 'reactive', 'consultative', 'solution_focused', 'data_driven'];

      if (config.personality.tone && !validTones.includes(config.personality.tone)) {
        warnings.push(`Unusual personality.tone: "${config.personality.tone}". Common values: ${validTones.join(', ')}`);
      }

      if (config.personality.style && !validStyles.includes(config.personality.style)) {
        warnings.push(`Unusual personality.style: "${config.personality.style}". Common values: ${validStyles.join(', ')}`);
      }

      if (config.personality.approach && !validApproaches.includes(config.personality.approach)) {
        warnings.push(`Unusual personality.approach: "${config.personality.approach}". Common values: ${validApproaches.join(', ')}`);
      }
    }

    // Best practices checks
    if (!config.agent?.capabilities || config.agent.capabilities.length === 0) {
      warnings.push('No capabilities defined. Consider adding capabilities for better user understanding');
    }

    if (!config.suggestions || config.suggestions.length === 0) {
      warnings.push('No suggestion buttons defined. Users may not know how to interact with the agent');
    }

    if (!config.agent?.initial_message) {
      warnings.push('No initial_message defined. Agent will not have a greeting');
    }

    // Info checks
    if (config.agent?.enabled === false) {
      info.push('Agent is currently disabled (enabled: false)');
    }

    if (config.agent?.pinned === true) {
      info.push('Agent is pinned to top of category');
    }

    if (config.agent?.uses_conversation_state === true) {
      info.push('Agent uses conversation state persistence');
    }

    // Detect tier
    const tier = detectTier(config);
    info.push(`Detected complexity tier: ${tier} (${getTierName(tier)})`);

    // Print results
    console.log('');

    if (info.length > 0) {
      log('ℹ️  INFO:', 'blue');
      info.forEach(msg => log(`  • ${msg}`, 'blue'));
      console.log('');
    }

    if (warnings.length > 0) {
      log('⚠️  WARNINGS:', 'yellow');
      warnings.forEach(msg => log(`  • ${msg}`, 'yellow'));
      console.log('');
    }

    if (errors.length > 0) {
      log('❌ ERRORS:', 'red');
      errors.forEach(msg => log(`  • ${msg}`, 'red'));
      console.log('');
      return false;
    }

    log('✅ Validation passed!', 'green');
    console.log('');
    return true;

  } catch (error) {
    log('\n❌ FATAL ERROR:', 'red');
    log(`  ${error.message}`, 'red');
    console.log('');
    return false;
  }
}

function detectTier(config) {
  const needsCustomUI = config.ui?.page_type === 'multi_page' || config.ui?.figma_url || config.ui?.figma_deployed_url;
  const hasPlatforms = config.platforms && Object.keys(config.platforms).length > 0;
  const hasDomainConfig = config.solar_config || config.domain_config;
  const hasComplexIntegrations = config.integrations && config.integrations.length > 2;

  if (needsCustomUI) return 4;
  if (hasDomainConfig || hasComplexIntegrations) return 3;
  if (hasPlatforms) return 2;
  return 1;
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

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  // Validate all agents
  log('\n🔍 Validating all agent configurations...', 'bright');

  const agentsDir = path.join(process.cwd(), 'agents', 'configs');

  if (!fs.existsSync(agentsDir)) {
    log('\n❌ agents/configs directory not found', 'red');
    process.exit(1);
  }

  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  if (files.length === 0) {
    log('\n⚠️  No YAML files found in agents/configs', 'yellow');
    process.exit(0);
  }

  let passed = 0;
  let failed = 0;

  files.forEach(file => {
    const filePath = path.join(agentsDir, file);
    const result = validateAgent(filePath);

    if (result) {
      passed++;
    } else {
      failed++;
    }
  });

  // Summary
  log('='.repeat(60), 'cyan');
  log('VALIDATION SUMMARY', 'bright');
  log('='.repeat(60), 'cyan');
  log(`Total agents: ${files.length}`, 'blue');
  log(`Passed: ${passed}`, passed > 0 ? 'green' : 'reset');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log('');

  process.exit(failed > 0 ? 1 : 0);

} else {
  // Validate specific file
  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    log(`\n❌ File not found: ${filePath}`, 'red');
    process.exit(1);
  }

  const result = validateAgent(filePath);
  process.exit(result ? 0 : 1);
}
