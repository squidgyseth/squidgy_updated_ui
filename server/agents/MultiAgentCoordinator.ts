import { UIAgent } from './UIAgent.ts';
import { QAAgent } from './QAAgent.ts';
import type {
  CodeGenerationRequest,
  GeneratedCode,
  QAValidationResult,
  MultiAgentSession,
  AgentIteration,
  ValidationError
} from '../types/agentSystemTypes.ts';

export class MultiAgentCoordinator {
  private uiAgent: UIAgent;
  private qaAgent: QAAgent;
  private maxIterations: number;
  private sessions: Map<string, MultiAgentSession>;

  constructor(maxIterations: number = 5) {
    this.uiAgent = new UIAgent(process.env.OPENAI_API_KEY);
    this.qaAgent = new QAAgent();
    this.maxIterations = maxIterations;
    this.sessions = new Map();
  }

  /**
   * Process a code generation request (main entry point)
   */
  async processRequest(request: CodeGenerationRequest): Promise<{
    success: boolean;
    finalCode?: string;
    errors?: string[];
    session: MultiAgentSession;
  }> {
    const session = await this.generateAndValidateCode(request);
    
    // Ensure we return the final code properly (use componentCode not code)
    const success = session.status === 'completed' && !!session.finalCode?.componentCode;
    
    return {
      success: success,
      finalCode: session.finalCode?.componentCode,
      errors: !success ? ['Multi-agent validation failed'] : undefined,
      session
    };
  }

  /**
   * Start multi-agent code generation and validation process
   */
  async generateAndValidateCode(request: CodeGenerationRequest): Promise<MultiAgentSession> {
    const sessionId = this.generateSessionId();
    console.log(`\n🚀 MULTI-AGENT SESSION STARTED: ${sessionId}`);
    console.log(`📄 Target: ${request.agentId}/${request.pageName}`);
    console.log(`🔄 Max iterations: ${this.maxIterations}\n`);

    const session: MultiAgentSession = {
      sessionId,
      request,
      iterations: [],
      status: 'running',
      startTime: new Date(),
      maxIterations: this.maxIterations,
      currentIteration: 0
    };

    this.sessions.set(sessionId, session);

    try {
      await this.runAgentLoop(session);
    } catch (error: any) {
      console.error(`❌ Session ${sessionId} failed:`, error.message);
      session.status = 'failed';
    } finally {
      session.endTime = new Date();
      this.logSessionSummary(session);
    }

    return session;
  }

  /**
   * Run the main agent communication loop
   */
  private async runAgentLoop(session: MultiAgentSession): Promise<void> {
    while (session.currentIteration < session.maxIterations && session.status === 'running') {
      session.currentIteration++;
      
      console.log(`\n🔄 ITERATION ${session.currentIteration}/${session.maxIterations}`);
      console.log('=' .repeat(50));

      const iteration: AgentIteration = {
        iterationNumber: session.currentIteration,
        uiAgentCode: {} as GeneratedCode,
        qaValidation: {} as QAValidationResult,
        timestamp: new Date(),
        success: false
      };

      try {
        // Step 1: UI Agent generates code
        console.log('\n1️⃣ UI AGENT: Generating code...');
        const generationRequest = this.prepareGenerationRequest(session);
        iteration.uiAgentCode = await this.uiAgent.generateCode(generationRequest);
        
        console.log(`✅ Code generated: ${iteration.uiAgentCode.fileName}`);
        console.log(`📊 Confidence: ${iteration.uiAgentCode.confidence}%`);

        // Step 2: QA Agent validates code
        console.log('\n2️⃣ QA AGENT: Validating code...');
        iteration.qaValidation = await this.qaAgent.validateCode(iteration.uiAgentCode);
        
        console.log(`📊 Validation confidence: ${iteration.qaValidation.confidence}%`);
        console.log(`🔍 Errors found: ${iteration.qaValidation.errors.length}`);
        console.log(`⚠️ Warnings: ${iteration.qaValidation.warnings.length}`);

        // Step 3: Check if validation passed
        if (iteration.qaValidation.isValid) {
          console.log('\n✨ SUCCESS: Code passed all validations!');
          iteration.success = true;
          session.finalCode = iteration.uiAgentCode;
          session.status = 'completed';
        } else {
          console.log('\n❌ VALIDATION FAILED: Preparing feedback for UI Agent...');
          this.logValidationErrors(iteration.qaValidation);
          
          // Clean up failed attempt
          await this.qaAgent.cleanup(iteration.uiAgentCode.filePath);
        }

        session.iterations.push(iteration);

        // Break if successful
        if (iteration.success) {
          break;
        }

      } catch (error: any) {
        console.error(`❌ Iteration ${session.currentIteration} failed:`, error.message);
        iteration.success = false;
        session.iterations.push(iteration);
      }
    }

    // Check final status
    if (session.status === 'running') {
      if (session.currentIteration >= session.maxIterations) {
        session.status = 'max_iterations';
        console.log(`⚠️ Maximum iterations (${session.maxIterations}) reached`);
      } else {
        session.status = 'failed';
      }
    }
  }

  /**
   * Prepare generation request for UI Agent with feedback from previous iterations
   */
  private prepareGenerationRequest(session: MultiAgentSession): CodeGenerationRequest {
    const baseRequest = session.request;
    const previousIteration = session.iterations[session.iterations.length - 1];

    return {
      ...baseRequest,
      iteration: session.currentIteration,
      previousErrors: previousIteration?.qaValidation?.errors || []
    };
  }

  /**
   * Log validation errors for debugging
   */
  private logValidationErrors(validation: QAValidationResult): void {
    if (validation.errors.length > 0) {
      console.log('\n🚨 ERRORS FOUND:');
      validation.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type.toUpperCase()}] ${error.message}`);
        if (error.line) console.log(`     Line ${error.line}${error.column ? `, Column ${error.column}` : ''}`);
        if (error.suggestion) console.log(`     💡 Suggestion: ${error.suggestion}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      validation.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.message}`);
      });
    }

    if (validation.suggestions.length > 0) {
      console.log('\n💡 SUGGESTIONS:');
      validation.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    }
  }

  /**
   * Log session summary
   */
  private logSessionSummary(session: MultiAgentSession): void {
    const duration = session.endTime 
      ? ((session.endTime.getTime() - session.startTime.getTime()) / 1000).toFixed(1)
      : 'N/A';

    console.log('\n' + '='.repeat(60));
    console.log('📊 MULTI-AGENT SESSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`🆔 Session ID: ${session.sessionId}`);
    console.log(`📄 Target: ${session.request.agentId}/${session.request.pageName}`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log(`🔄 Iterations: ${session.currentIteration}/${session.maxIterations}`);
    console.log(`✨ Status: ${session.status.toUpperCase()}`);
    
    if (session.finalCode) {
      console.log(`📁 Generated file: ${session.finalCode.fileName}`);
      console.log(`📊 Final confidence: ${session.finalCode.confidence}%`);
    }

    // Iteration breakdown
    console.log('\n📈 ITERATION BREAKDOWN:');
    session.iterations.forEach((iteration, index) => {
      const status = iteration.success ? '✅ PASS' : '❌ FAIL';
      const errors = iteration.qaValidation?.errors?.length || 0;
      console.log(`  ${index + 1}. ${status} (${errors} errors, ${iteration.uiAgentCode?.confidence || 0}% confidence)`);
    });

    console.log('='.repeat(60));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): MultiAgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): MultiAgentSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return {
      uiAgent: this.uiAgent.getCapabilities(),
      qaAgent: this.qaAgent.getCapabilities(),
      coordinator: {
        name: 'Multi-Agent Coordinator',
        description: 'Orchestrates UI and QA agents for iterative code generation',
        maxIterations: this.maxIterations,
        version: '1.0.0'
      }
    };
  }

  /**
   * Health check for all agents
   */
  async healthCheck(): Promise<{
    uiAgent: boolean;
    qaAgent: boolean;
    coordinator: boolean;
    overall: boolean;
  }> {
    const health = {
      uiAgent: false,
      qaAgent: false,
      coordinator: true,
      overall: false
    };

    try {
      // Check UI Agent
      const uiCapabilities = this.uiAgent.getCapabilities();
      health.uiAgent = !!uiCapabilities.name;

      // Check QA Agent  
      const qaCapabilities = this.qaAgent.getCapabilities();
      health.qaAgent = !!qaCapabilities.name;

      health.overall = health.uiAgent && health.qaAgent && health.coordinator;
    } catch (error) {
      console.error('Health check failed:', error);
    }

    return health;
  }
}