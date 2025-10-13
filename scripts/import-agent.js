#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Read command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node import-agent.js <path-to-yaml>');
  process.exit(1);
}

const yamlPath = args[0];
const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

// Read YAML file
if (!fs.existsSync(yamlPath)) {
  console.error(`File not found: ${yamlPath}`);
  process.exit(1);
}

const yamlContent = fs.readFileSync(yamlPath, 'utf8');

console.log('📦 Importing agent from:', yamlPath);

// Send to server
axios.post(`${serverUrl}/api/agents/import`, {
  yamlContent
})
.then(response => {
  console.log('✅ Agent imported successfully!');
  console.log('📍 Agent ID:', response.data.agent.agent_id);
  console.log('📍 Agent Name:', response.data.agent.name);
  if (response.data.componentPath) {
    console.log('🎨 Generated component:', response.data.componentPath);
  }
  console.log('\n✨ Your agent is now available in the chat interface!');
})
.catch(error => {
  console.error('❌ Import failed:', error.response?.data?.error || error.message);
  process.exit(1);
});