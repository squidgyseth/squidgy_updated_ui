# N8N Workflow Generation

Generate complete N8N workflow JSON files with proper node configuration and connections.

=======================================================================
## WORKFLOW STRUCTURE

Every N8N workflow must have:
1. **Metadata** - Name, nodes, connections, settings
2. **Webhook Trigger** - Entry point for agent requests
3. **System Prompt Loader** - Fetch agent's system prompt
4. **AI Agent Node** - Main conversation handler
5. **Response Formatter** - Structure output for frontend
6. **Conditional Nodes** - Based on agent capabilities

=======================================================================
## BASIC TEMPLATE

```json
{
  "name": "Squidgy_[Agent_Name]_Workflow",
  "nodes": [
    {
      "parameters": {
        "path": "<<agent_id>>",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "postgresApi",
        "operation": "executeQuery",
        "query": "SELECT system_prompt FROM agent_system_prompts WHERE agent_id = '<<agent_id>>'"
      },
      "id": "load-system-prompt",
      "name": "Load System Prompt",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.4,
      "position": [460, 300],
      "credentials": {
        "postgresApi": {
          "id": "9VZuQcfK90oMX16w",
          "name": "Neon Postgres"
        }
      }
    },
    {
      "parameters": {
        "options": {
          "systemMessage": "={{ $json.system_prompt }}"
        }
      },
      "id": "ai-agent",
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.6,
      "position": [680, 300],
      "credentials": {
        "openRouterApi": {
          "id": "7hB3eGzzdDVoxaV5",
          "name": "Claude_Demo_SMM"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"response\": $json.output, \"agent_id\": \"<<agent_id>>\" } }}"
      },
      "id": "response-formatter",
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Load System Prompt", "type": "main", "index": 0 }]]
    },
    "Load System Prompt": {
      "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]
    },
    "AI Agent": {
      "main": [[{ "node": "Response", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

=======================================================================
## NODE TYPES

### Required Nodes

**1. Webhook Trigger**
```json
{
  "parameters": {
    "path": "<<agent_id>>",
    "responseMode": "responseNode",
    "options": {}
  },
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "position": [240, 300]
}
```

**2. System Prompt Loader (Postgres)**
```json
{
  "parameters": {
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "postgresApi",
    "operation": "executeQuery",
    "query": "SELECT system_prompt FROM agent_system_prompts WHERE agent_id = '<<agent_id>>'"
  },
  "name": "Load System Prompt",
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2.4,
  "credentials": {
    "postgresApi": {
      "id": "9VZuQcfK90oMX16w",
      "name": "Neon Postgres"
    }
  }
}
```

**3. AI Agent Node**
```json
{
  "parameters": {
    "options": {
      "systemMessage": "={{ $json.system_prompt }}"
    }
  },
  "name": "AI Agent",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1.6,
  "credentials": {
    "openRouterApi": {
      "id": "7hB3eGzzdDVoxaV5",
      "name": "Claude_Demo_SMM"
    }
  }
}
```

**4. Response Formatter**
```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ { \"response\": $json.output, \"agent_id\": \"<<agent_id>>\" } }}"
  },
  "name": "Response",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1.1
}
```

### Conditional Nodes

**Supabase Data Fetch** (for agents needing user data):
```json
{
  "parameters": {
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "supabaseApi",
    "operation": "getAll",
    "tableId": "user_table",
    "returnAll": false,
    "limit": 10
  },
  "name": "Fetch User Data",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "credentials": {
    "supabaseApi": {
      "id": "uk8y8Aw346FSXNbw",
      "name": "Supabase account"
    }
  }
}
```

**HTTP Request** (for external APIs):
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/endpoint",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpBasicAuth",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "data",
          "value": "={{ $json.input }}"
        }
      ]
    }
  },
  "name": "External API Call",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

**Code Node** (for custom logic):
```json
{
  "parameters": {
    "language": "javaScript",
    "jsCode": "// Custom JavaScript code\nconst result = items[0].json;\nreturn [{ json: result }];"
  },
  "name": "Custom Logic",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2
}
```

**Conditional Router** (for decision logic):
```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "leftValue": "={{ $json.intent }}",
          "rightValue": "create_post",
          "operator": {
            "type": "string",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    },
    "options": {}
  },
  "name": "Route By Intent",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2
}
```

=======================================================================
## CREDENTIAL MAPPING

Use these credential IDs for the Squidgy platform:

```javascript
{
  "Claude_Demo_SMM": "7hB3eGzzdDVoxaV5",      // OpenRouter API
  "Neon Postgres": "9VZuQcfK90oMX16w",        // Neon Database
  "Supabase account": "uk8y8Aw346FSXNbw"      // Supabase
}
```

=======================================================================
## NODE POSITIONING

Position nodes in a logical left-to-right flow:

**Standard Layout:**
- Webhook: [240, 300]
- Load System Prompt: [460, 300]
- AI Agent: [680, 300]
- Response: [900, 300]

**With Conditional Branches:**
- Main flow: Y = 300
- Branch 1: Y = 200
- Branch 2: Y = 400
- Increment X by 220 for each step

=======================================================================
## CONNECTION STRUCTURE

```json
{
  "connections": {
    "Node A": {
      "main": [[{ "node": "Node B", "type": "main", "index": 0 }]]
    },
    "Node B": {
      "main": [[{ "node": "Node C", "type": "main", "index": 0 }]]
    }
  }
}
```

**Multiple Outputs:**
```json
{
  "connections": {
    "Router": {
      "main": [
        [{ "node": "Branch A", "type": "main", "index": 0 }],
        [{ "node": "Branch B", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

=======================================================================
## AGENT COMPLEXITY TIERS

### Tier 1 - Basic Chat
Use basic template with 4 nodes:
- Webhook → Load System Prompt → AI Agent → Response

### Tier 2 - Platform Integrated
Add nodes for:
- Supabase data fetch
- HTTP requests to external APIs
- File handling nodes

### Tier 3 - Domain Expert
Add nodes for:
- Custom calculations (Code nodes)
- Specialized API integrations
- Data transformations

### Tier 4 - Multi-Modal
Add nodes for:
- Conversation state persistence
- Complex routing logic
- Multiple AI agent nodes
- Custom UI data preparation

=======================================================================
## PLACEHOLDER REPLACEMENT

Always use `<<agent_id>>` placeholder in:
- Webhook path
- System prompt query
- Response body
- Any agent-specific references

The placeholder will be replaced during deployment.

=======================================================================
## VALIDATION CHECKLIST

Before finalizing workflow JSON:
- ✅ All required nodes present (Webhook, Load Prompt, AI Agent, Response)
- ✅ Credentials use correct IDs
- ✅ Connections are properly defined
- ✅ Node positions are logical
- ✅ Placeholder `<<agent_id>>` used correctly
- ✅ JSON syntax is valid
- ✅ Workflow name follows format: `Squidgy_[Agent_Name]_Workflow`
- ✅ File uses UTF-8 encoding
