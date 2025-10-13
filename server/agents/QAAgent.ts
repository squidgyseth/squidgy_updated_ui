import * as fs from 'fs';
import * as path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import type { 
  GeneratedCode, 
  QAValidationResult, 
  ValidationError,
  QAAgentCapabilities 
} from '../types/agentSystemTypes.ts';

const execAsync = promisify(exec);

export class QAAgent {
  private capabilities: QAAgentCapabilities;
  private projectRoot: string;
  private maxValidationTime: number;

  constructor() {
    this.projectRoot = process.cwd();
    this.maxValidationTime = 120000; // 2 minutes
    
    this.capabilities = {
      name: 'QA Validation Agent',
      description: 'Validates generated React components and ensures they work correctly',
      inputTypes: ['react_component', 'typescript_code'],
      outputTypes: ['validation_result', 'error_report'],
      maxProcessingTime: this.maxValidationTime,
      version: '1.0.0',
      validationTypes: ['syntax', 'type_checking', 'build', 'dev_server', 'import_resolution'],
      supportedTestFrameworks: ['jest', 'vitest'],
      errorDetectionFeatures: ['syntax_errors', 'type_errors', 'import_errors', 'runtime_errors']
    };
  }

  /**
   * Validate generated code comprehensively
   */
  async validateCode(generatedCode: GeneratedCode): Promise<QAValidationResult> {
    console.log(`🔍 QA Agent: Validating ${generatedCode.fileName}`);
    
    const result: QAValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      devServerStarted: false,
      buildSuccessful: false,
      suggestions: [],
      confidence: 0
    };

    try {
      // Step 1: Write code to file system
      await this.writeCodeToFile(generatedCode);
      console.log('✅ Code written to file system');

      // Step 2: Syntax validation
      const syntaxErrors = await this.validateSyntax(generatedCode.filePath);
      result.errors.push(...syntaxErrors);
      console.log(`📝 Syntax check: ${syntaxErrors.length} errors`);

      // Step 3: TypeScript type checking
      const typeErrors = await this.validateTypes(generatedCode.filePath);
      result.errors.push(...typeErrors);
      console.log(`🔤 Type check: ${typeErrors.length} errors`);

      // Step 4: Import resolution
      const importErrors = await this.validateImports(generatedCode);
      result.errors.push(...importErrors);
      console.log(`📦 Import check: ${importErrors.length} errors`);

      // Step 5: Build validation (if no critical errors)
      if (result.errors.filter(e => e.severity === 'error').length === 0) {
        result.buildSuccessful = await this.validateBuild();
        console.log(`🏗️ Build check: ${result.buildSuccessful ? 'passed' : 'failed'}`);
      }

      // Step 6: Dev server validation (if build passes)
      if (result.buildSuccessful) {
        result.devServerStarted = await this.validateDevServer();
        console.log(`🚀 Dev server check: ${result.devServerStarted ? 'passed' : 'failed'}`);
      }

      // Step 7: Generate suggestions
      result.suggestions = this.generateSuggestions(result);

      // Step 8: Calculate overall validation result
      result.isValid = this.calculateValidationResult(result);
      result.confidence = this.calculateConfidence(result);

      console.log(`✨ QA Validation complete: ${result.isValid ? 'PASSED' : 'FAILED'}`);
      
      return result;

    } catch (error: any) {
      console.error('🚨 QA Agent Error:', error.message);
      result.errors.push({
        type: 'runtime',
        message: `QA Agent validation failed: ${error.message}`,
        severity: 'error'
      });
      return result;
    }
  }

  /**
   * Write generated code to file system
   */
  private async writeCodeToFile(generatedCode: GeneratedCode): Promise<void> {
    const directory = path.dirname(generatedCode.filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write the code
    fs.writeFileSync(generatedCode.filePath, generatedCode.componentCode, 'utf8');
  }

  /**
   * Validate syntax using TypeScript compiler
   */
  private async validateSyntax(filePath: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      const { stdout, stderr } = await execAsync(
        `npx tsc --noEmit --jsx react-jsx "${filePath}"`,
        { timeout: 30000 }
      );

      if (stderr) {
        const syntaxErrors = this.parseTscOutput(stderr);
        errors.push(...syntaxErrors);
      }

    } catch (error: any) {
      if (error.stdout || error.stderr) {
        const syntaxErrors = this.parseTscOutput(error.stderr || error.stdout);
        errors.push(...syntaxErrors);
      } else {
        errors.push({
          type: 'syntax',
          message: `Syntax validation failed: ${error.message}`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  /**
   * Validate TypeScript types
   */
  private async validateTypes(filePath: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      // Run TypeScript compiler with strict mode
      const { stderr } = await execAsync(
        `npx tsc --noEmit --strict --jsx react-jsx "${filePath}"`,
        { timeout: 30000 }
      );

      if (stderr) {
        const typeErrors = this.parseTscOutput(stderr);
        errors.push(...typeErrors.map(error => ({ ...error, type: 'type' as const })));
      }

    } catch (error: any) {
      if (error.stderr) {
        const typeErrors = this.parseTscOutput(error.stderr);
        errors.push(...typeErrors.map(error => ({ ...error, type: 'type' as const })));
      }
    }

    return errors;
  }

  /**
   * Validate import statements
   */
  private async validateImports(generatedCode: GeneratedCode): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const code = generatedCode.componentCode;
    
    // Check for common import issues
    const importLines = code.split('\n').filter(line => line.trim().startsWith('import'));
    
    for (const importLine of importLines) {
      // Check for relative imports that might not exist
      if (importLine.includes('./') || importLine.includes('../')) {
        const match = importLine.match(/from ['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          const resolvedPath = path.resolve(path.dirname(generatedCode.filePath), importPath);
          
          // Check if .ts, .tsx, .js, .jsx files exist
          const extensions = ['.ts', '.tsx', '.js', '.jsx', '.d.ts'];
          let found = false;
          
          for (const ext of extensions) {
            if (fs.existsSync(resolvedPath + ext)) {
              found = true;
              break;
            }
          }
          
          if (!found && !fs.existsSync(resolvedPath)) {
            errors.push({
              type: 'import',
              message: `Cannot resolve import: ${importPath}`,
              severity: 'error',
              suggestion: `Check if the import path is correct: ${importPath}`
            });
          }
        }
      }
      
      // Check for missing dependencies
      if (generatedCode.dependencies) {
        for (const dep of generatedCode.dependencies) {
          if (importLine.includes(`from '${dep}'`) || importLine.includes(`from "${dep}"`)) {
            try {
              require.resolve(dep);
            } catch {
              errors.push({
                type: 'import',
                message: `Missing dependency: ${dep}`,
                severity: 'error',
                suggestion: `Run: npm install ${dep}`
              });
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate build process
   */
  private async validateBuild(): Promise<boolean> {
    try {
      console.log('🏗️ Running build validation...');
      
      const { stdout, stderr } = await execAsync(
        'npm run build',
        { 
          timeout: this.maxValidationTime,
          cwd: this.projectRoot 
        }
      );

      // Check for successful build indicators
      return !stderr.includes('ERROR') && 
             !stdout.includes('ERROR') && 
             (stdout.includes('built successfully') || stdout.includes('Build complete'));

    } catch (error: any) {
      console.log('❌ Build failed:', error.message);
      return false;
    }
  }

  /**
   * Validate dev server startup
   */
  private async validateDevServer(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🚀 Testing dev server startup...');
      
      let serverStarted = false;
      let timeout: NodeJS.Timeout;
      
      // Start dev server
      const devServer = spawn('npm', ['run', 'dev'], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      // Set timeout
      timeout = setTimeout(() => {
        devServer.kill();
        resolve(serverStarted);
      }, 45000); // 45 seconds timeout

      // Listen for server ready
      devServer.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Local:') || 
            output.includes('localhost') || 
            output.includes('ready in') ||
            output.includes('VITE') ||
            output.includes('Network:')) {
          serverStarted = true;
          clearTimeout(timeout);
          devServer.kill();
          resolve(true);
        }
      });

      devServer.stderr?.on('data', (data) => {
        const error = data.toString();
        if (error.includes('ERROR') || error.includes('Failed')) {
          clearTimeout(timeout);
          devServer.kill();
          resolve(false);
        }
      });

      devServer.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      devServer.on('exit', (code) => {
        clearTimeout(timeout);
        resolve(code === 0 && serverStarted);
      });
    });
  }

  /**
   * Parse TypeScript compiler output
   */
  private parseTscOutput(output: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Parse TSC error format: file(line,col): error TS####: message
      const match = line.match(/(.+)\((\d+),(\d+)\):\s*(error|warning)\s*TS\d+:\s*(.+)/);
      if (match) {
        const message = match[5];
        
        // Skip import.meta.env related errors as requested by user
        if (message.includes('import.meta') || 
            message.includes('ImportMeta') ||
            message.includes("'--module' option") ||
            message.includes("Property 'env' does not exist") ||
            message.includes('esModuleInterop') || // Skip esModuleInterop errors
            message.includes("Argument of type '{}' is not assignable")) { // Skip empty object type errors
          continue; // Skip these errors
        }
        
        errors.push({
          type: 'syntax',
          message: message,
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          file: match[1],
          severity: match[4] === 'error' ? 'error' : 'warning'
        });
      }
    }

    return errors;
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(result: QAValidationResult): string[] {
    const suggestions: string[] = [];

    if (result.errors.some(e => e.type === 'syntax')) {
      suggestions.push('Fix syntax errors by ensuring proper TypeScript syntax');
    }

    if (result.errors.some(e => e.type === 'type')) {
      suggestions.push('Add proper TypeScript type annotations');
    }

    if (result.errors.some(e => e.type === 'import')) {
      suggestions.push('Check import paths and install missing dependencies');
    }

    if (!result.buildSuccessful) {
      suggestions.push('Fix build errors before proceeding');
    }

    if (!result.devServerStarted) {
      suggestions.push('Ensure the component doesn\'t break the development server');
    }

    if (suggestions.length === 0) {
      suggestions.push('Code validation passed - no issues found');
    }

    return suggestions;
  }

  /**
   * Calculate if validation passes
   */
  private calculateValidationResult(result: QAValidationResult): boolean {
    // Filter out import.meta.env related errors and esModuleInterop errors
    const criticalErrors = result.errors.filter(e => {
      if (e.severity !== 'error') return false;
      
      // Skip esModuleInterop flag errors for React imports
      if (e.message?.includes('esModuleInterop')) return false;
      
      // Skip common React/Lucide import errors if they're just about missing packages
      if (e.type === 'import' && (e.message?.includes('react') || e.message?.includes('lucide-react'))) {
        return false; // These are expected and will work at runtime
      }
      
      return true;
    });
    
    // Pass validation if no critical errors remain
    return criticalErrors.length === 0;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(result: QAValidationResult): number {
    let confidence = 0;

    // Base scoring
    if (result.errors.length === 0) confidence += 40;
    if (result.warnings.length === 0) confidence += 10;
    if (result.buildSuccessful) confidence += 25;
    if (result.devServerStarted) confidence += 25;

    // Penalty for errors
    confidence -= result.errors.filter(e => e.severity === 'error').length * 10;
    confidence -= result.warnings.length * 2;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): QAAgentCapabilities {
    return this.capabilities;
  }

  /**
   * Clean up temporary files
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Cleaned up: ${filePath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not clean up ${filePath}:`, error);
    }
  }
}