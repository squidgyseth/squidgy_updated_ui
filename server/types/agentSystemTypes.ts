// Multi-Agent System Types for Code Generation & QA

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: 'code_generation' | 'code_review' | 'error_report' | 'approval' | 'iteration_request';
  timestamp: Date;
  data: any;
}

export interface CodeGenerationRequest {
  agentId: string;
  pageName: string;
  sourceType: 'figma_api' | 'figma_deployed';
  sourceUrl: string;
  screenshots?: string[];
  figmaData?: any;
  requirements?: string[];
  iteration?: number;
  previousErrors?: ValidationError[];
}

export interface GeneratedCode {
  componentCode: string;
  fileName: string;
  filePath: string;
  dependencies?: string[];
  imports?: string[];
  confidence: number;
  reasoning?: string;
}

export interface ValidationError {
  type: 'syntax' | 'type' | 'import' | 'runtime' | 'build';
  message: string;
  line?: number;
  column?: number;
  file?: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface QAValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  devServerStarted: boolean;
  buildSuccessful: boolean;
  suggestions: string[];
  confidence: number;
}

export interface AgentIteration {
  iterationNumber: number;
  uiAgentCode: GeneratedCode;
  qaValidation: QAValidationResult;
  timestamp: Date;
  success: boolean;
}

export interface MultiAgentSession {
  sessionId: string;
  request: CodeGenerationRequest;
  iterations: AgentIteration[];
  finalCode?: GeneratedCode;
  status: 'running' | 'completed' | 'failed' | 'max_iterations';
  startTime: Date;
  endTime?: Date;
  maxIterations: number;
  currentIteration: number;
}

export interface AgentCapabilities {
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  maxProcessingTime: number;
  version: string;
}

export interface UIAgentCapabilities extends AgentCapabilities {
  supportedFrameworks: string[];
  designAnalysisFeatures: string[];
  codeGenerationFeatures: string[];
}

export interface QAAgentCapabilities extends AgentCapabilities {
  validationTypes: string[];
  supportedTestFrameworks: string[];
  errorDetectionFeatures: string[];
}

export const AGENT_TYPES = {
  UI_AGENT: 'ui_agent',
  QA_AGENT: 'qa_agent',
  COORDINATOR: 'coordinator'
} as const;

export type AgentType = typeof AGENT_TYPES[keyof typeof AGENT_TYPES];