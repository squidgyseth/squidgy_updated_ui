/**
 * N8N Template Service
 * Handles downloading, modifying, and deploying N8N workflow templates
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface N8NWorkflowTemplate {
  id: string;
  name: string;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

export interface N8NNodeModification {
  nodeName?: string;
  nodeId?: string;
  nodeType?: string;
  modifications: {
    path: string; // e.g., 'parameters.path', 'parameters.jsCode'
    value: any;
  }[];
}

export interface N8NToolNode {
  name: string;
  type: string;
  parameters: any;
  position?: [number, number];
  description?: string;
}

export class N8NTemplateService {
  private static instance: N8NTemplateService;
  private apiKey: string;
  private baseUrl: string = 'https://n8n.theaiteam.uk/api/v1';

  private constructor() {
    // Load API key from environment variable
    this.apiKey = process.env.VITE_N8N_TOKEN || process.env.N8N_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  N8N API key not found. Set VITE_N8N_TOKEN in .env file');
    }
  }

  static getInstance(): N8NTemplateService {
    if (!N8NTemplateService.instance) {
      N8NTemplateService.instance = new N8NTemplateService();
    }
    return N8NTemplateService.instance;
  }


  /**
   * Download workflow template from N8N by workflow ID
   */
  async downloadTemplate(workflowId: string): Promise<N8NWorkflowTemplate> {
    try {
      const response = await axios.get(`${this.baseUrl}/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to download N8N template: ${error.message}`);
    }
  }

  /**
   * Download template and save to local file
   */
  async downloadAndSaveTemplate(
    workflowId: string,
    savePath: string
  ): Promise<N8NWorkflowTemplate> {
    const template = await this.downloadTemplate(workflowId);

    // Ensure directory exists
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save to file
    fs.writeFileSync(savePath, JSON.stringify(template, null, 2), 'utf8');

    return template;
  }

  /**
   * Modify specific fields in workflow nodes
   */
  modifyWorkflowNodes(
    workflow: N8NWorkflowTemplate,
    modifications: N8NNodeModification[]
  ): N8NWorkflowTemplate {
    const modifiedWorkflow = JSON.parse(JSON.stringify(workflow)); // Deep clone

    modifications.forEach(mod => {
      // Find the node to modify
      const nodeIndex = modifiedWorkflow.nodes.findIndex((node: any) => {
        if (mod.nodeId) return node.id === mod.nodeId;
        if (mod.nodeName) return node.name === mod.nodeName;
        if (mod.nodeType) return node.type === mod.nodeType;
        return false;
      });

      if (nodeIndex === -1) {
        console.warn(`Node not found for modification: ${mod.nodeName || mod.nodeId || mod.nodeType}`);
        return;
      }

      // Apply each modification
      mod.modifications.forEach(({ path: fieldPath, value }) => {
        this.setNestedProperty(modifiedWorkflow.nodes[nodeIndex], fieldPath, value);
      });
    });

    return modifiedWorkflow;
  }

  /**
   * Add tool nodes to AI Agent node
   */
  addToolNodesToWorkflow(
    workflow: N8NWorkflowTemplate,
    tools: N8NToolNode[],
    aiAgentNodeName: string = 'AI Agent'
  ): N8NWorkflowTemplate {
    const modifiedWorkflow = JSON.parse(JSON.stringify(workflow)); // Deep clone

    // Find AI Agent node
    const aiAgentNode = modifiedWorkflow.nodes.find((node: any) => node.name === aiAgentNodeName);
    if (!aiAgentNode) {
      throw new Error(`AI Agent node "${aiAgentNodeName}" not found in workflow`);
    }

    // Calculate positions for tool nodes (arrange vertically below AI Agent)
    const aiAgentPosition = aiAgentNode.position || [400, 300];
    const toolStartY = aiAgentPosition[1] + 200;
    const toolSpacing = 100;

    // Add tool nodes
    tools.forEach((tool, index) => {
      const toolNode = {
        parameters: tool.parameters,
        id: `tool-${tool.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
        name: tool.name,
        type: tool.type,
        typeVersion: this.getToolTypeVersion(tool.type),
        position: tool.position || [aiAgentPosition[0], toolStartY + (index * toolSpacing)]
      };

      modifiedWorkflow.nodes.push(toolNode);

      // Add connection from tool to AI Agent
      if (!modifiedWorkflow.connections[tool.name]) {
        modifiedWorkflow.connections[tool.name] = {};
      }

      modifiedWorkflow.connections[tool.name].ai_tool = [
        [{ node: aiAgentNodeName, type: 'ai_tool', index: 0 }]
      ];
    });

    return modifiedWorkflow;
  }

  /**
   * Update agent-specific fields in workflow
   * Note: System prompt is NOT inserted here - it's fetched from Neon database during execution
   */
  customizeWorkflowForAgent(
    workflow: N8NWorkflowTemplate,
    agentId: string,
    agentName: string,
    webhookPath?: string
  ): N8NWorkflowTemplate {
    const modifications: N8NNodeModification[] = [];

    // Find webhook node by type
    const webhookNode = workflow.nodes.find((node: any) => 
      node.type === 'n8n-nodes-base.webhook'
    );

    if (webhookNode) {
      // Update webhook path
      modifications.push({
        nodeName: webhookNode.name,
        modifications: [
          { path: 'parameters.path', value: webhookPath || agentId }
        ]
      });
    }

    // Note: System prompt is NOT inserted into the AI Agent node
    // It's stored in agents/{agent_id}/system_prompt.md and uploaded to Neon database
    // The workflow fetches it dynamically using the "Get system prompt" Postgres node

    // Update all agent_id placeholders and agent_name references
    workflow.nodes.forEach((node: any) => {
      // Update code nodes
      if (node.type === 'n8n-nodes-base.code' && node.parameters?.jsCode) {
        let updatedCode = node.parameters.jsCode
          .replace(/agent_name:\s*["'][\w_]+["']/g, `agent_name: "${agentId}"`)
          .replace(/<<agent_id>>/g, agentId);

        modifications.push({
          nodeId: node.id,
          modifications: [
            { path: 'parameters.jsCode', value: updatedCode }
          ]
        });
      }

      // Update HTTP Request tool nodes with <<agent_id>> placeholders
      if (node.type === 'n8n-nodes-base.httpRequest' && node.parameters?.bodyParameters) {
        const bodyParams = node.parameters.bodyParameters.parameters || [];
        bodyParams.forEach((param: any, index: number) => {
          if (param.value && typeof param.value === 'string' && param.value.includes('<<agent_id>>')) {
            modifications.push({
              nodeId: node.id,
              modifications: [
                { path: `parameters.bodyParameters.parameters[${index}].value`, value: param.value.replace(/<<agent_id>>/g, agentId) }
              ]
            });
          }
        });
      }

      // Update Postgres nodes with <<agent_id>> placeholders
      if (node.type === 'n8n-nodes-base.postgres' && node.parameters?.where) {
        const whereValues = node.parameters.where.values || [];
        whereValues.forEach((where: any, index: number) => {
          if (where.value && typeof where.value === 'string' && where.value.includes('<<agent_id>>')) {
            modifications.push({
              nodeId: node.id,
              modifications: [
                { path: `parameters.where.values[${index}].value`, value: where.value.replace(/<<agent_id>>/g, agentId) }
              ]
            });
          }
        });
      }
    });

    return this.modifyWorkflowNodes(workflow, modifications);
  }

  /**
   * Deploy modified workflow to N8N
   */
  async deployWorkflow(
    workflow: N8NWorkflowTemplate,
    workflowName?: string
  ): Promise<{ id: string; url: string }> {
    try {
      // Clean workflow data for new workflow creation
      const workflowData: any = {
        name: workflowName || workflow.name,
        nodes: workflow.nodes.map((node: any) => {
          const cleanNode: any = {
            parameters: node.parameters || {},
            type: node.type,
            typeVersion: node.typeVersion,
            position: node.position,
            name: node.name
          };
          
          // Remove node IDs - N8N will generate new ones
          // Remove credentials - they need to be set manually in N8N UI
          // Keep webhookId if it exists
          if (node.webhookId) {
            cleanNode.webhookId = node.webhookId;
          }
          
          return cleanNode;
        }),
        connections: workflow.connections || {},
        settings: workflow.settings || {},
        staticData: null
      };

      const response = await axios.post(`${this.baseUrl}/workflows`, workflowData, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const createdWorkflow = response.data;

      return {
        id: createdWorkflow.id,
        url: `${this.baseUrl.replace('/api/v1', '')}/workflow/${createdWorkflow.id}`
      };
    } catch (error: any) {
      throw new Error(`Failed to deploy workflow to N8N: ${error.message}`);
    }
  }

  /**
   * Update existing workflow
   */
  async updateWorkflow(
    workflowId: string,
    workflow: N8NWorkflowTemplate
  ): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/workflows/${workflowId}`, workflow, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<Array<{ id: string; name: string; active: boolean }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.apiKey
        }
      });

      return response.data.data.map((wf: any) => ({
        id: wf.id,
        name: wf.name,
        active: wf.active
      }));
    } catch (error: any) {
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  /**
   * Helper: Set nested property using dot notation
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Helper: Get appropriate typeVersion for tool node type
   */
  private getToolTypeVersion(nodeType: string): number {
    const typeVersionMap: Record<string, number> = {
      'n8n-nodes-base.httpRequestTool': 4.3,
      '@n8n/n8n-nodes-langchain.toolCode': 1,
      '@n8n/n8n-nodes-langchain.toolCalculator': 1,
      '@n8n/n8n-nodes-langchain.toolWorkflow': 1
    };

    return typeVersionMap[nodeType] || 1;
  }

  /**
   * Generate tool nodes from agent capabilities
   */
  generateToolNodesFromCapabilities(capabilities: string[]): N8NToolNode[] {
    const tools: N8NToolNode[] = [];

    capabilities.forEach(capability => {
      const lowerCap = capability.toLowerCase();

      // Facebook posting
      if (lowerCap.includes('facebook') && lowerCap.includes('post')) {
        tools.push({
          name: 'Facebook Post Tool',
          type: 'n8n-nodes-base.httpRequestTool',
          parameters: {
            method: 'POST',
            url: '={{$env.BACKEND_URL}}/api/facebook/post',
            authentication: 'genericCredentialType',
            genericAuthType: 'httpHeaderAuth',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: 'Authorization', value: '=Bearer {{$env.API_TOKEN}}' }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: 'user_id', value: '={{$json.user_id}}' },
                { name: 'content', value: '={{$json.content}}' },
                { name: 'media_url', value: '={{$json.media_url}}' }
              ]
            }
          },
          description: 'Post content to Facebook'
        });
      }

      // GHL media management
      if (lowerCap.includes('ghl') || lowerCap.includes('gohighlevel') || lowerCap.includes('media')) {
        tools.push({
          name: 'Get GHL Media',
          type: 'n8n-nodes-base.httpRequestTool',
          parameters: {
            method: 'GET',
            url: '={{$env.BACKEND_URL}}/api/ghl/media',
            authentication: 'genericCredentialType',
            genericAuthType: 'httpHeaderAuth',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: 'Authorization', value: '=Bearer {{$env.API_TOKEN}}' }
              ]
            },
            sendQuery: true,
            queryParameters: {
              parameters: [
                { name: 'user_id', value: '={{$json.user_id}}' }
              ]
            }
          },
          description: 'Fetch media files from GHL'
        });
      }

      // Knowledge base search
      if (lowerCap.includes('knowledge') || lowerCap.includes('search') || lowerCap.includes('rag')) {
        tools.push({
          name: 'Search Knowledge Base',
          type: 'n8n-nodes-base.httpRequestTool',
          parameters: {
            method: 'POST',
            url: '={{$env.BACKEND_URL}}/n8n/agent/query',
            authentication: 'genericCredentialType',
            genericAuthType: 'httpHeaderAuth',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: 'Authorization', value: '=Bearer {{$env.API_TOKEN}}' }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: 'user_id', value: '={{$json.user_id}}' },
                { name: 'query', value: '={{$json.query}}' },
                { name: 'category', value: '={{$json.category}}' }
              ]
            }
          },
          description: 'Search user knowledge base'
        });
      }

      // Calculator
      if (lowerCap.includes('calculat') || lowerCap.includes('math')) {
        tools.push({
          name: 'Calculator',
          type: '@n8n/n8n-nodes-langchain.toolCalculator',
          parameters: {},
          description: 'Perform mathematical calculations'
        });
      }
    });

    return tools;
  }
}
