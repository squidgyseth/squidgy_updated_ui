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
    // Load API key from environment or file
    this.apiKey = process.env.N8N_API_KEY || this.loadApiKeyFromFile();
  }

  static getInstance(): N8NTemplateService {
    if (!N8NTemplateService.instance) {
      N8NTemplateService.instance = new N8NTemplateService();
    }
    return N8NTemplateService.instance;
  }

  /**
   * Load N8N API key from file
   */
  private loadApiKeyFromFile(): string {
    try {
      const keyPath = path.join(process.cwd(), '.n8n-api-key');
      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath, 'utf8').trim();
      }
    } catch (error) {
      console.warn('Could not load N8N API key from file');
    }
    return '';
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
   */
  customizeWorkflowForAgent(
    workflow: N8NWorkflowTemplate,
    agentId: string,
    agentName: string,
    systemPrompt: string,
    webhookPath?: string
  ): N8NWorkflowTemplate {
    const modifications: N8NNodeModification[] = [
      // Update webhook path
      {
        nodeName: 'Webhook',
        modifications: [
          { path: 'parameters.path', value: webhookPath || agentId }
        ]
      },
      // Update workflow name
      {
        nodeName: 'Webhook',
        modifications: [
          { path: 'name', value: `${agentName} Webhook` }
        ]
      }
    ];

    // Update AI Agent system prompt if exists
    const aiAgentNode = workflow.nodes.find((node: any) => 
      node.type === '@n8n/n8n-nodes-langchain.agent' || 
      node.name.includes('AI Agent')
    );

    if (aiAgentNode) {
      modifications.push({
        nodeName: aiAgentNode.name,
        modifications: [
          { path: 'parameters.options.systemMessage', value: systemPrompt }
        ]
      });
    }

    // Update all agent_name references in code nodes
    workflow.nodes.forEach((node: any) => {
      if (node.type === 'n8n-nodes-base.code' && node.parameters?.jsCode) {
        const updatedCode = node.parameters.jsCode.replace(
          /agent_name:\s*["'][\w_]+["']/g,
          `agent_name: "${agentId}"`
        );

        modifications.push({
          nodeId: node.id,
          modifications: [
            { path: 'parameters.jsCode', value: updatedCode }
          ]
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
      // Remove id for new workflow creation
      const workflowData = { ...workflow };
      delete workflowData.id;

      if (workflowName) {
        workflowData.name = workflowName;
      }

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
