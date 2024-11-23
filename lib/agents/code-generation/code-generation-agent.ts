import { BaseAgent } from '../base-agent';
import { AgentTask, AgentResult } from '../types';
import {
  CodeGenerationConfig,
  APIIntegration,
  WorkflowStep,
  GeneratedCode,
  TestResult,
  DeploymentConfig,
  WorkflowTemplate
} from './types';
import { generateWorkflowCode } from './generators/workflow-generator';
import { generateTests } from './generators/test-generator';
import { validateCode } from './validators/code-validator';
import { VectorStore } from '@/lib/storage/vector-store';
import { WebSocketManager } from '@/lib/websocket/connection-manager';

export class CodeGenerationAgent extends BaseAgent {
  private vectorStore: VectorStore;
  private wsManager: WebSocketManager;
  private codeCache: Map<string, GeneratedCode>;
  private templates: Map<string, WorkflowTemplate>;

  constructor(id: string) {
    super(id, 'code-generation');
    this.codeCache = new Map();
    this.templates = new Map();
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    this.vectorStore = await VectorStore.getInstance();
    await this.loadTemplates();
  }

  private async loadTemplates(): Promise<void> {
    // Load predefined workflow templates
    const defaultTemplates: WorkflowTemplate[] = [
      {
        id: 'api-integration',
        name: 'API Integration Workflow',
        description: 'Template for API integration workflows',
        steps: [
          {
            id: 'auth',
            type: 'authentication',
            config: { type: 'oauth2' }
          },
          {
            id: 'fetch',
            type: 'api',
            config: { method: 'GET' }
          },
          {
            id: 'transform',
            type: 'transformation',
            config: { type: 'json' }
          }
        ]
      },
      {
        id: 'data-sync',
        name: 'Data Synchronization',
        description: 'Template for data synchronization workflows',
        steps: [
          {
            id: 'extract',
            type: 'database',
            config: { operation: 'read' }
          },
          {
            id: 'transform',
            type: 'transformation',
            config: { type: 'data-mapping' }
          },
          {
            id: 'load',
            type: 'database',
            config: { operation: 'write' }
          }
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      switch (message.type) {
        case 'CODE_GENERATION_STATUS':
          this.broadcastStatus(message.payload.taskId);
          break;
        case 'CODE_VALIDATION_RESULT':
          this.handleValidationResult(message.payload);
          break;
      }
    });
  }

  public async processTask(task: AgentTask): Promise<AgentResult> {
    this.status = 'busy';
    const startTime = Date.now();

    try {
      switch (task.data.action) {
        case 'generate_workflow':
          return await this.generateWorkflow(task);
        case 'test_workflow':
          return await this.testWorkflow(task);
        case 'deploy_workflow':
          return await this.deployWorkflow(task);
        case 'optimize_code':
          return await this.optimizeCode(task);
        default:
          throw new Error(`Unsupported action: ${task.data.action}`);
      }
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failure',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.status = 'idle';
    }
  }

  private async generateWorkflow(task: AgentTask): Promise<AgentResult> {
    const { config, steps, integrations, templateId } = task.data;
    
    // Use template if specified
    const template = templateId ? this.templates.get(templateId) : null;
    const workflowSteps = template ? template.steps.concat(steps || []) : steps;
    
    // Generate code
    const generatedCode = await generateWorkflowCode(
      config as CodeGenerationConfig,
      workflowSteps as WorkflowStep[],
      integrations as APIIntegration[]
    );

    // Store in cache and vector store
    this.codeCache.set(task.id, generatedCode);
    await this.storeCode(task.id, generatedCode);

    // Validate generated code
    const validationResult = await validateCode(generatedCode);
    if (!validationResult.valid) {
      throw new Error(`Code validation failed: ${validationResult.errors.join(', ')}`);
    }

    return {
      taskId: task.id,
      status: 'success',
      data: generatedCode,
    };
  }

  private async testWorkflow(task: AgentTask): Promise<AgentResult> {
    const { codeId, testConfig } = task.data;
    const generatedCode = this.codeCache.get(codeId);

    if (!generatedCode) {
      throw new Error(`No generated code found for ID: ${codeId}`);
    }

    // Generate and run tests
    const tests = await generateTests(generatedCode, testConfig);
    const testResults = await this.runTests(tests);

    // Store test results
    await this.storeTestResults(codeId, testResults);

    return {
      taskId: task.id,
      status: testResults.passed ? 'success' : 'failure',
      data: testResults,
    };
  }

  private async deployWorkflow(task: AgentTask): Promise<AgentResult> {
    const { codeId, deploymentConfig } = task.data;
    const generatedCode = this.codeCache.get(codeId);

    if (!generatedCode) {
      throw new Error(`No generated code found for ID: ${codeId}`);
    }

    // Validate deployment configuration
    this.validateDeploymentConfig(deploymentConfig);

    // Prepare deployment package
    const deploymentPackage = await this.prepareDeployment(
      generatedCode,
      deploymentConfig
    );

    // Execute deployment
    const deploymentResult = await this.executeDeployment(
      deploymentPackage,
      deploymentConfig
    );

    return {
      taskId: task.id,
      status: 'success',
      data: deploymentResult,
    };
  }

  private async optimizeCode(task: AgentTask): Promise<AgentResult> {
    const { codeId, optimizationConfig } = task.data;
    const generatedCode = this.codeCache.get(codeId);

    if (!generatedCode) {
      throw new Error(`No generated code found for ID: ${codeId}`);
    }

    // Perform code optimization
    const optimizedCode = await this.performCodeOptimization(
      generatedCode,
      optimizationConfig
    );

    // Update cache with optimized code
    this.codeCache.set(codeId, optimizedCode);

    return {
      taskId: task.id,
      status: 'success',
      data: optimizedCode,
    };
  }

  private async storeCode(id: string, code: GeneratedCode): Promise<void> {
    await this.vectorStore.addDocument({
      id,
      content: JSON.stringify(code),
      metadata: {
        type: 'generated-code',
        timestamp: Date.now(),
        language: code.language,
        framework: code.framework,
      },
    });
  }

  private async storeTestResults(codeId: string, results: TestResult): Promise<void> {
    await this.vectorStore.addDocument({
      id: `test-${codeId}`,
      content: JSON.stringify(results),
      metadata: {
        type: 'test-results',
        timestamp: Date.now(),
        codeId,
      },
    });
  }

  private validateDeploymentConfig(config: DeploymentConfig): void {
    const requiredFields = ['platform', 'environment', 'resources'];
    requiredFields.forEach(field => {
      if (!config[field]) {
        throw new Error(`Missing required deployment configuration: ${field}`);
      }
    });
  }

  private async prepareDeployment(
    code: GeneratedCode,
    config: DeploymentConfig
  ): Promise<any> {
    // Implementation of deployment package preparation
    return {
      code,
      config,
      timestamp: Date.now(),
    };
  }

  private async executeDeployment(
    deploymentPackage: any,
    config: DeploymentConfig
  ): Promise<any> {
    // Implementation of deployment execution
    return {
      status: 'deployed',
      url: 'https://example.com/deployed-workflow',
      timestamp: Date.now(),
    };
  }

  private async performCodeOptimization(
    code: GeneratedCode,
    config: any
  ): Promise<GeneratedCode> {
    // Implementation of code optimization logic
    return code;
  }

  private broadcastStatus(taskId: string): void {
    const status = {
      taskId,
      timestamp: Date.now(),
      agent: this.getId(),
      status: this.status,
    };
    this.wsManager.broadcast('CODE_GENERATION_STATUS', status);
  }

  private handleValidationResult(result: any): void {
    if (!result.valid) {
      this.emit('error', {
        type: 'validation_error',
        details: result.errors,
      });
    }
  }

  public async cleanup(): Promise<void> {
    this.wsManager.cleanup();
    this.codeCache.clear();
    this.templates.clear();
  }
}