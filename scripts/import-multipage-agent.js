#!/usr/bin/env node

// Multi-Page Agent Import Script
// Usage: node scripts/import-multipage-agent.js agents/configs/smm_assistant_multipage.yaml

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { MultiPageAgentParser } from '../server/services/multiPageAgentParser.ts';
import { MultiPageComponentGenerator } from '../server/services/multiPageComponentGenerator.ts';

async function importMultiPageAgent(yamlPath) {
  console.log('\n🚀 MULTI-PAGE AGENT IMPORT SYSTEM');
  console.log('=====================================\n');
  
  try {
    // Step 1: Parse YAML configuration
    console.log('1️⃣ Parsing agent configuration...');
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
    console.log('\n📋 Pages to generate:');
    pages.forEach((page, index) => {
      console.log(`  ${index + 1}. ${page.name}`);
      console.log(`     Source: ${page.source?.type}`);
      console.log(`     URL: ${page.source?.url}`);
    });
    
    // Step 2: Generate components for all pages
    console.log('\n2️⃣ Generating page components...');
    const generator = new MultiPageComponentGenerator(process.env.FIGMA_ACCESS_TOKEN);
    const result = await generator.generateAgentPages(config);
    
    // Step 3: Display results
    console.log('\n3️⃣ Generation Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📄 Pages Generated: ${result.pages.length}/${pages.length}`);
    console.log(`📁 Folder: ${result.folderPath}`);
    
    if (result.pages.length > 0) {
      console.log('\n📄 Generated Files:');
      result.pages.forEach((page, index) => {
        console.log(`  ${index + 1}. ${page.pageName}`);
        console.log(`     File: ${page.filePath}`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    // Step 4: Update YAML with generated page information
    if (result.pages.length > 0) {
      console.log('\n4️⃣ Updating YAML configuration...');
      
      const generatedPages = result.pages.map((page, index) => ({
        name: page.pageName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        path: `/agents/${config.agent.id}/${page.pageName}`,
        order: index + 1,
        generatedComponent: page.filePath
      }));
      
      await parser.updateYamlWithPages(yamlPath, generatedPages);
      console.log('✅ YAML updated with generated page information');
    }
    
    // Step 5: Update database (if applicable)
    console.log('\n5️⃣ Database Update:');
    console.log('TODO: Run database migration to add agent to database');
    console.log(`SQL: INSERT INTO agents (id, name, category, pages) VALUES ('${config.agent.id}', '${config.agent.name}', '${config.agent.category}', ${result.pages.length})`);
    
    // Step 6: Next steps
    console.log('\n✨ SUCCESS! Multi-page agent imported successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Restart the development server: npm run dev');
    console.log(`2. Navigate to: http://localhost:8080/chat/agents/${config.agent.id}`);
    console.log('3. The agent will appear in the sidebar under:', config.agent.category);
    console.log('4. Click the agent to see all pages with tab navigation');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('\nDebug information:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/import-multipage-agent.js <yaml-file>');
  console.log('Example: node scripts/import-multipage-agent.js agents/configs/smm_assistant_multipage.yaml');
  process.exit(1);
}

const yamlPath = path.resolve(args[0]);
if (!fs.existsSync(yamlPath)) {
  console.error(`Error: YAML file not found: ${yamlPath}`);
  process.exit(1);
}

// Run the import
importMultiPageAgent(yamlPath).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});