#!/usr/bin/env node

// Multi-Page Agent Import Script
// Usage: node scripts/import-multipage-agent.js agents/configs/smm_assistant_multipage.yaml

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { MultiPageAgentParser } from '../server/services/multiPageAgentParser.ts';
import { MultiPageComponentGenerator } from '../server/services/multiPageComponentGenerator.ts';

async function importMultiPageAgent(yamlPath) {
  
  try {
    // Step 1: Parse YAML configuration
    const parser = new MultiPageAgentParser();
    const config = parser.parseYamlFile(yamlPath);
    
    
    const pages = config.ui?.pages || [];
    
    if (pages.length === 0) {
      throw new Error('No pages found in configuration. Check your figma_url or figma_deployed_url.');
    }

    // Display page information
    pages.forEach((page, index) => {
    });
    
    // Step 2: Generate components for all pages
    const generator = new MultiPageComponentGenerator(process.env.FIGMA_ACCESS_TOKEN);
    const result = await generator.generateAgentPages(config);
    
    // Step 3: Display results
    
    if (result.pages.length > 0) {
      result.pages.forEach((page, index) => {
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(error => {
      });
    }
    
    // Step 4: Update YAML with generated page information
    if (result.pages.length > 0) {
      
      const generatedPages = result.pages.map((page, index) => ({
        name: page.pageName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        path: `/agents/${config.agent.id}/${page.pageName}`,
        order: index + 1,
        generatedComponent: page.filePath
      }));
      
      await parser.updateYamlWithPages(yamlPath, generatedPages);
    }
    
    // Step 5: Update database (if applicable)
    
    // Step 6: Next steps
    
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