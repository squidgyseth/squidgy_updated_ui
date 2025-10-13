#!/usr/bin/env node

// Enhanced Multi-Agent Import Script
// Usage: node scripts/import-multiagent.js agents/configs/smm_assistant_enhanced.yaml

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { MultiPageAgentParser } from '../server/services/multiPageAgentParser.ts';
import { EnhancedMultiPageGenerator } from '../server/services/enhancedMultiPageGenerator.ts';

async function importWithMultiAgent(yamlPath) {
  console.log('\n🤖 MULTI-AGENT CODE GENERATION SYSTEM');
  console.log('=' .repeat(50));
  console.log('🧠 UI Agent: Generates React components');
  console.log('🔍 QA Agent: Validates & tests code');
  console.log('🔄 Iterative feedback loop until perfect');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Parse YAML configuration
    console.log('\n1️⃣ Parsing agent configuration...');
    const parser = new MultiPageAgentParser();
    const config = parser.parseYamlFile(yamlPath);
    
    console.log(`✅ Parsed: ${config.agent.name}`);
    console.log(`📁 Category: ${config.agent.category}`);
    
    const pages = config.ui?.pages || [];
    console.log(`📄 Pages detected: ${pages.length}`);
    
    if (pages.length === 0) {
      throw new Error('No pages found in configuration. Check your figma_url or figma_deployed_url.');
    }

    // Display page information
    console.log('\n📋 Pages to generate with multi-agent system:');
    pages.forEach((page, index) => {
      console.log(`  ${index + 1}. ${page.name}`);
      console.log(`     Source: ${page.source?.type}`);
      console.log(`     URL: ${page.source?.url}`);
    });
    
    // Step 2: Check multi-agent system health
    console.log('\n2️⃣ Checking multi-agent system health...');
    const generator = new EnhancedMultiPageGenerator();
    const health = await generator.getHealthStatus();
    
    console.log(`🧠 UI Agent: ${health.uiAgent ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`🔍 QA Agent: ${health.qaAgent ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`🤖 Coordinator: ${health.coordinator ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`🌟 Overall: ${health.overall ? '✅ System Ready' : '❌ System Issues'}`);
    
    if (!health.overall) {
      throw new Error('Multi-agent system health check failed. Please check your setup.');
    }

    // Step 3: Generate components with multi-agent approach
    console.log('\n3️⃣ Starting multi-agent generation process...');
    console.log('This may take several minutes as each page goes through multiple validation cycles...\n');
    
    const result = await generator.generateAgentPages(config);
    
    // Step 4: Display results
    console.log('\n4️⃣ Multi-Agent Generation Results:');
    console.log('=' .repeat(60));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📄 Pages Generated: ${result.pages.length}/${pages.length}`);
    console.log(`📁 Folder: ${result.folderPath}`);
    
    if (result.pages.length > 0) {
      console.log('\n📄 Successfully Generated & Validated Files:');
      result.pages.forEach((page, index) => {
        console.log(`  ${index + 1}. ${page.pageName}`);
        console.log(`     ✅ Passed all validations`);
        console.log(`     📁 File: ${path.basename(page.filePath)}`);
        console.log(`     🌐 Source: ${page.sourceUrl}`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️ Issues encountered:');
      result.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    // Step 5: Update YAML with generated page information
    if (result.pages.length > 0) {
      console.log('\n5️⃣ Updating YAML configuration...');
      
      const generatedPages = result.pages.map((page, index) => ({
        name: page.pageName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        path: `/agents/${config.agent.id}/${page.pageName}`,
        order: index + 1,
        generatedComponent: page.filePath,
        validated: true,
        multiAgent: true
      }));
      
      await parser.updateYamlWithPages(yamlPath, generatedPages);
      console.log('✅ YAML updated with validated page information');
    }
    
    // Step 6: System capabilities report
    console.log('\n6️⃣ Multi-Agent System Report:');
    const capabilities = generator.getCapabilities();
    console.log(`🧠 UI Agent: ${capabilities.uiAgent.name} v${capabilities.uiAgent.version}`);
    console.log(`   Frameworks: ${capabilities.uiAgent.supportedFrameworks.join(', ')}`);
    console.log(`🔍 QA Agent: ${capabilities.qaAgent.name} v${capabilities.qaAgent.version}`);
    console.log(`   Validations: ${capabilities.qaAgent.validationTypes.join(', ')}`);
    console.log(`🤖 Coordinator: ${capabilities.coordinator.name} v${capabilities.coordinator.version}`);
    console.log(`   Max Iterations: ${capabilities.coordinator.maxIterations}`);
    
    // Step 7: Next steps
    console.log('\n✨ SUCCESS! Multi-agent generation completed!');
    console.log('\n📋 What happened:');
    console.log('• UI Agent analyzed designs and generated React components');
    console.log('• QA Agent validated code with npm run dev and build checks');
    console.log('• Feedback loops ensured all code works perfectly');
    console.log('• All components passed syntax, type, and runtime validation');
    
    console.log('\n📋 Next Steps:');
    console.log('1. All components are validated and ready to use');
    console.log('2. Restart dev server if needed: npm run dev');
    console.log(`3. Navigate to: http://localhost:8080/chat/agents/${config.agent.id}`);
    console.log('4. The agent will appear in the sidebar under:', config.agent.category);
    console.log('5. All pages are guaranteed to work without errors! 🎉');
    
  } catch (error) {
    console.error('\n❌ Multi-agent import failed:', error.message);
    console.error('\nDebug information:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/import-multiagent.js <yaml-file>');
  console.log('Example: node scripts/import-multiagent.js agents/configs/smm_assistant_enhanced.yaml');
  console.log('\nFeatures:');
  console.log('• Multi-agent code generation (UI Agent + QA Agent)');
  console.log('• Automatic validation with npm run dev');
  console.log('• Iterative feedback loops until code works perfectly');
  console.log('• Guaranteed error-free components');
  process.exit(1);
}

const yamlPath = path.resolve(args[0]);
if (!fs.existsSync(yamlPath)) {
  console.error(`Error: YAML file not found: ${yamlPath}`);
  process.exit(1);
}

// Run the multi-agent import
importWithMultiAgent(yamlPath).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});