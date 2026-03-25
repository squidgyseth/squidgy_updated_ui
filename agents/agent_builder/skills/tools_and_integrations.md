# Tools & Integrations

Guide users to add custom tools, API integrations, database access, and MCP servers to agent workflows when agents need capabilities beyond the default RAG management tools.

=======================================================================
## OVERVIEW

**Default Agent Tools:**
Every agent created via the N8N workflow template includes:
- **RAG Management Tools** - Knowledge base search, document retrieval, context management

**When Agents Need Additional Tools:**
If an agent needs to perform actions beyond RAG/knowledge base operations, you must guide the user to add custom tools to the agent's N8N workflow.

=======================================================================
## WHEN TO ADD CUSTOM TOOLS

**Identify tool needs during agent creation by analyzing:**

**1. Agent Capabilities**
- Does the agent need to create/update/delete records?
- Does the agent need to call external APIs?
- Does the agent need to access specific database tables?
- Does the agent need to integrate with third-party platforms?

**2. Agent Category**
- **MARKETING** - May need: Social media APIs, email service APIs, analytics platforms
- **SALES** - May need: CRM APIs, lead databases, payment processors
- **HR** - May need: HRIS systems, calendar APIs, document storage
- **SUPPORT** - May need: Ticketing systems, customer databases, notification services
- **OPERATIONS** - May need: Project management APIs, workflow automation, file storage

**3. User Requirements**
- Listen for phrases like:
  - "The agent needs to create posts"
  - "The agent should update customer records"
  - "The agent needs to send emails"
  - "The agent should check inventory"
  - "The agent needs to access the orders table"

=======================================================================
## N8N TOOL DEFINITION FORMAT

**Tools in N8N are defined using the `httpRequestTool` node type.**

**Key Components:**

1. **toolDescription** - Tells the AI agent what this tool does and when to use it
2. **url** - Webhook endpoint that executes the tool's logic
3. **bodyParameters** - Input parameters the AI agent provides when calling the tool
4. **fromAI()** - Special N8N function that extracts parameters from AI agent's tool call

**Example Tool Definition:**

```json
{
  "nodes": [
    {
      "parameters": {
        "toolDescription": "pass the hole content of file you want to create here to actually write it to a file and user can download it.",
        "url": "https://n8n.theaiteam.uk/webhook/15600793-ccfc-4394-81c1-6f838c77dad7",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "file_name",
              "value": "={{ $fromAI('parameters0_Value', `full file name including folder name. can be system_prompt.md or config.yaml or skill files like agent_name/skills/something.md`, 'string') }}"
            },
            {
              "name": "file_content",
              "value": "={{ $fromAI('parameters1_Value', `pass the hole content of file here`, 'string') }}"
            },
            {
              "name": "action",
              "value": "create"
            },
            {
              "name": "=user_id",
              "value": "={{ $('Code in JavaScript').item.json.user_id }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequestTool",
      "typeVersion": 4.4,
      "position": [1056, 512],
      "id": "3794befd-e61a-46c2-a86f-f63a33d32e2f",
      "name": "create new file"
    }
  ],
  "connections": {
    "create new file": {
      "ai_tool": [[]]
    }
  }
}
```

**How It Works:**

1. **AI Agent sees the tool** via `toolDescription`
2. **AI Agent decides to use tool** based on user request
3. **AI Agent provides parameters** (file_name, file_content)
4. **N8N extracts parameters** using `$fromAI()` function
5. **N8N calls webhook** with parameters in body
6. **Webhook executes logic** (creates file, updates database, calls API, etc.)
7. **Result returns to AI Agent** to include in response

**Parameter Types:**

- **From AI** - Parameters the AI agent provides: `$fromAI('parameterX_Value', 'description', 'type')`
- **From Context** - Parameters from workflow context: `{{ $('NodeName').item.json.field }}`
- **Static** - Fixed values: `"action": "create"`

=======================================================================
## TYPES OF CUSTOM TOOLS

### 1. API Integrations

**When to use:**
- Agent needs to interact with external services (social media, email, CRM, etc.)
- Agent needs to fetch/send data to third-party platforms

**Examples:**
- GoHighLevel API for CRM operations
- Social media APIs (Twitter, LinkedIn, Facebook)
- Email service APIs (SendGrid, Mailgun)
- Payment APIs (Stripe, PayPal)
- Analytics APIs (Google Analytics, Mixpanel)

**What user needs to add to N8N workflow:**
- `httpRequestTool` node with:
  - `toolDescription`: Clear description of what the tool does
  - `url`: API endpoint or webhook URL
  - `bodyParameters`: Required parameters from AI agent
  - Authentication in headers or body
- Error handling for API failures

**Example Tool Definition:**
```json
{
  "parameters": {
    "toolDescription": "Create a social media post on the specified platform. Provide the content, platform (twitter/linkedin/facebook), and optional schedule time.",
    "url": "https://api.gohighlevel.com/v1/social-media/posts",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "content",
          "value": "={{ $fromAI('parameters0_Value', 'The text content of the social media post', 'string') }}"
        },
        {
          "name": "platform",
          "value": "={{ $fromAI('parameters1_Value', 'Platform: twitter, linkedin, or facebook', 'string') }}"
        },
        {
          "name": "schedule_time",
          "value": "={{ $fromAI('parameters2_Value', 'Optional: ISO timestamp for scheduling', 'string') }}"
        },
        {
          "name": "api_key",
          "value": "={{ $('Get User Settings').item.json.ghl_api_key }}"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.httpRequestTool",
  "name": "Create Social Media Post"
}
```

### 2. Database Access Tools

**When to use:**
- Agent needs to read/write specific database tables beyond system tables
- Agent needs to perform custom queries
- Agent needs to access business data (customers, orders, products, etc.)

**Examples:**
- Access `social_media_posts` table
- Query `customer_orders` table
- Update `inventory` table
- Read `user_preferences` table
- Insert into `email_campaigns` table

**What user needs to add to N8N workflow:**
- `httpRequestTool` node that calls a webhook
- Webhook contains Postgres/Supabase node for database operations
- SQL queries for specific operations
- Database credentials
- Data validation and sanitization

**Example Tool Definition:**
```json
{
  "parameters": {
    "toolDescription": "Query customer orders from the database. Provide customer_id to get their order history.",
    "url": "https://n8n.theaiteam.uk/webhook/query-customer-orders",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "customer_id",
          "value": "={{ $fromAI('parameters0_Value', 'The customer ID to query orders for', 'string') }}"
        },
        {
          "name": "limit",
          "value": "={{ $fromAI('parameters1_Value', 'Optional: Maximum number of orders to return (default 10)', 'number') }}"
        },
        {
          "name": "user_id",
          "value": "={{ $('Code in JavaScript').item.json.user_id }}"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.httpRequestTool",
  "name": "Query Customer Orders"
}
```

**Webhook Implementation:**
The webhook URL should contain:
1. Receive parameters from tool call
2. Postgres node with SQL query:
   ```sql
   SELECT * FROM customer_orders 
   WHERE customer_id = {{ $json.customer_id }} 
   AND user_id = {{ $json.user_id }}
   LIMIT {{ $json.limit || 10 }}
   ```
3. Return results to AI agent

### 3. MCP (Model Context Protocol) Servers

**When to use:**
- Agent needs structured access to external systems
- Agent needs standardized tool interfaces
- Agent needs to use pre-built integrations

**Examples:**
- File system MCP server for file operations
- Git MCP server for repository operations
- Slack MCP server for team communication
- Custom business logic MCP servers

**What user needs to add to N8N workflow:**
- `httpRequestTool` node that connects to MCP server
- MCP server configuration and credentials
- Tool selection and parameter mapping
- Response handling

**Example Tool Definition:**
```json
{
  "parameters": {
    "toolDescription": "Access file system operations via MCP server. Can read, write, list, or delete files.",
    "url": "https://n8n.theaiteam.uk/webhook/mcp-filesystem",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "operation",
          "value": "={{ $fromAI('parameters0_Value', 'Operation: read, write, list, or delete', 'string') }}"
        },
        {
          "name": "path",
          "value": "={{ $fromAI('parameters1_Value', 'File or directory path', 'string') }}"
        },
        {
          "name": "content",
          "value": "={{ $fromAI('parameters2_Value', 'Content for write operations', 'string') }}"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.httpRequestTool",
  "name": "MCP File System"
}
```

### 4. Custom Business Logic Tools

**When to use:**
- Agent needs to perform calculations
- Agent needs to apply business rules
- Agent needs to transform data
- Agent needs to validate inputs

**Examples:**
- Price calculation tools
- Inventory availability checks
- Eligibility verification
- Data formatting/transformation

**What user needs to add to N8N workflow:**
- `httpRequestTool` node that calls a webhook
- Webhook contains Function/Code nodes with custom logic
- Input validation
- Business rule implementation
- Output formatting

**Example Tool Definition:**
```json
{
  "parameters": {
    "toolDescription": "Calculate shipping cost based on weight, destination, and shipping method. Returns total cost and estimated delivery time.",
    "url": "https://n8n.theaiteam.uk/webhook/calculate-shipping",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "weight_kg",
          "value": "={{ $fromAI('parameters0_Value', 'Package weight in kilograms', 'number') }}"
        },
        {
          "name": "destination_country",
          "value": "={{ $fromAI('parameters1_Value', 'Destination country code (e.g., US, UK, CA)', 'string') }}"
        },
        {
          "name": "shipping_method",
          "value": "={{ $fromAI('parameters2_Value', 'Shipping method: standard, express, or overnight', 'string') }}"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.httpRequestTool",
  "name": "Calculate Shipping Cost"
}
```

=======================================================================
## HOW TO GUIDE USERS

### Step 1: Identify Tool Requirements

**During agent creation, ask:**
1. "What actions does this agent need to perform?"
2. "Does the agent need to access any external services or APIs?"
3. "Does the agent need to read or write to specific database tables?"
4. "Are there any integrations required (CRM, social media, email, etc.)?"

**Document the requirements:**
- List all required tools/integrations
- Identify API endpoints needed
- Identify database tables needed
- Note any authentication requirements

### Step 2: Inform User About Custom Tools

**When custom tools are needed, tell the user:**

```markdown
⚠️ **Custom Tools Required**

Your agent needs additional tools beyond the default RAG management:

**Required Tools:**
1. [Tool Name] - [Purpose]
   - Type: [API/Database/MCP Server]
   - What it does: [Description]
   - Example: [Use case]

2. [Tool Name] - [Purpose]
   - Type: [API/Database/MCP Server]
   - What it does: [Description]
   - Example: [Use case]

**Next Steps:**
After I create the agent and N8N workflow, you'll need to:
1. Open the N8N workflow editor
2. Add the required tool nodes
3. Configure authentication and parameters
4. Test the tools before activating the workflow

I'll provide detailed instructions for each tool after workflow creation.
```

### Step 3: Provide N8N Workflow Modification Instructions

**After creating the N8N workflow, provide specific instructions:**

```markdown
🔧 **N8N Workflow Customization Required**

Your agent's N8N workflow has been created, but you need to add custom tools:

**Workflow Editor:** [workflow_editor_url]

**Tools to Add:**

### 1. [Tool Name] - [API/Database/MCP]

**Purpose:** [What this tool does]

**Steps to Add:**
1. Open the workflow editor link above
2. Click the **+** button to add a new node
3. Search for "[Node Type]" (e.g., "HTTP Request", "Postgres", "Function")
4. Configure the node:
   - **[Setting 1]:** [Value]
   - **[Setting 2]:** [Value]
   - **Authentication:** [How to set up credentials]
5. Connect the node to the AI Agent node
6. Test the node with sample data

**Example Configuration:**
```json
{
  "url": "https://api.example.com/endpoint",
  "method": "POST",
  "authentication": "headerAuth",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

**Testing:**
- Input: [Sample input]
- Expected Output: [Sample output]

---

### 2. [Next Tool Name]
[Repeat for each tool]

---

**After Adding All Tools:**
1. Click **Execute Workflow** to test
2. Verify all tools work correctly
3. Click **Activate** toggle to enable the workflow
4. Test the agent in the UI

**Need Help?**
- Check N8N documentation for specific node types
- Test each tool individually before connecting to agent
- Verify credentials are valid and have correct permissions
```

### Step 4: Document Tools in Agent Configuration

**Add tool information to agent's system prompt or skills:**

```markdown
## AVAILABLE TOOLS

This agent has access to the following tools:

1. **[Tool Name]**
   - Purpose: [Description]
   - When to use: [Use cases]
   - Parameters: [What data is needed]
   - Returns: [What data comes back]

2. **[Tool Name]**
   - Purpose: [Description]
   - When to use: [Use cases]
   - Parameters: [What data is needed]
   - Returns: [What data comes back]
```

=======================================================================
## COMMON TOOL PATTERNS

### Pattern 1: Social Media Posting

**Agent needs:** Create/schedule social media posts

**Tools required:**
- GoHighLevel API for social media management
- Database access to `social_media_posts` table

**N8N nodes to add:**
1. HTTP Request node for GHL API
2. Postgres node for database operations
3. Function node for data formatting

**Configuration guidance:**
```
1. HTTP Request Node:
   - URL: GHL social media endpoint
   - Method: POST
   - Auth: API key from user settings
   - Body: Post content, platform, schedule time

2. Postgres Node:
   - Operation: Insert
   - Table: social_media_posts
   - Fields: user_id, content, platform, status, scheduled_for

3. Function Node:
   - Transform agent response to API format
   - Validate required fields
   - Handle errors
```

### Pattern 2: CRM Operations

**Agent needs:** Create/update customer records

**Tools required:**
- CRM API (GoHighLevel, Salesforce, HubSpot)
- Database access to customer tables

**N8N nodes to add:**
1. HTTP Request node for CRM API
2. Postgres node for local customer cache
3. Function node for data validation

### Pattern 3: Email Campaigns

**Agent needs:** Create and send email campaigns

**Tools required:**
- Email service API
- Database access to `email_campaigns` table
- Template storage access

**N8N nodes to add:**
1. HTTP Request node for email service
2. Postgres node for campaign tracking
3. Function node for template rendering

### Pattern 4: Custom Database Queries

**Agent needs:** Access specific business data

**Tools required:**
- Database access to custom tables

**N8N nodes to add:**
1. Postgres node with custom SQL queries
2. Function node for data transformation
3. Error handling for query failures

=======================================================================
## VALIDATION CHECKLIST

**Before finalizing agent creation:**

- ✅ Identified all required tools/integrations
- ✅ Documented each tool's purpose and configuration
- ✅ Provided clear N8N workflow modification instructions
- ✅ Included example configurations for each tool
- ✅ Listed authentication requirements
- ✅ Provided testing steps for each tool
- ✅ Documented tools in agent's system prompt/skills
- ✅ Warned user that workflow needs customization before activation
- ✅ Provided workflow editor URL for easy access

**After user adds tools:**

- ✅ User has tested each tool individually
- ✅ User has verified authentication works
- ✅ User has connected tools to AI agent node
- ✅ User has tested full workflow end-to-end
- ✅ User has activated the workflow
- ✅ User has tested agent in UI with real requests

=======================================================================
## IMPORTANT NOTES

**1. Default Template Only Has RAG Tools**
- The standard N8N workflow template only includes RAG/knowledge base tools
- Any other functionality requires custom tool nodes
- Always check agent requirements and inform user about needed customizations

**2. User Must Add Tools Manually**
- You cannot add tools to N8N workflows programmatically
- You can only create the base workflow via the workflow creation tool
- User must open N8N editor and add custom nodes themselves

**3. Provide Clear Instructions**
- Be specific about node types, configurations, and connections
- Include example JSON configurations
- Provide testing steps
- Link to relevant N8N documentation if helpful

**4. Security Considerations**
- Remind users to use environment variables for API keys
- Warn about credential security in N8N
- Suggest least-privilege access for database connections
- Recommend testing in development before production

**5. Document Everything**
- Add tool documentation to agent's system prompt or create a dedicated skill file
- List all tools, their purposes, parameters, and return values
- Help the agent understand when and how to use each tool

=======================================================================
## EXAMPLE: Social Media Agent Tools

**Agent:** Social Media Manager
**Category:** MARKETING
**Required Tools:**

1. **GoHighLevel Social Media API**
   - Purpose: Create and schedule social media posts
   - Type: API Integration
   - Authentication: API key from user settings

2. **Social Media Posts Database**
   - Purpose: Track post history and analytics
   - Type: Database Access
   - Tables: `social_media_posts`, `post_analytics`

3. **Image Processing Tool**
   - Purpose: Optimize images for social media
   - Type: Custom Function
   - Operations: Resize, compress, format conversion

**User Instructions:**
```markdown
🔧 **Your Social Media Manager agent needs custom tools**

After the N8N workflow is created, you'll need to add:

1. **GoHighLevel API Node** - For posting to social media
2. **Postgres Nodes** - For tracking posts in database
3. **Function Node** - For image optimization

I'll provide detailed setup instructions after workflow creation.
```

=======================================================================
## WHEN NOT TO ADD TOOLS

**Don't suggest custom tools if:**
- Agent only needs to answer questions (RAG is sufficient)
- Agent only provides information/advice (no actions needed)
- Agent only searches knowledge base (default RAG tools work)
- User hasn't mentioned any specific integrations or actions

**Examples of agents that DON'T need custom tools:**
- General Q&A agents
- Advisory/consulting agents
- Information lookup agents
- Simple chat assistants

**Examples of agents that DO need custom tools:**
- Social media posting agents
- CRM management agents
- Email campaign agents
- Order processing agents
- Inventory management agents
- Booking/scheduling agents
