import { BaseAgent } from '../base-agent';
import { AgentTask, AgentResult } from '../types';
import { VectorStore } from '@/lib/storage/vector-store';
import { WebSocketManager } from '@/lib/websocket/connection-manager';
import { 
  generateCode,
  validateCode,
  optimizeCode 
} from './code-generator';
import { 
  prepareDeployment,
  validateDeployment 
} from './deployment-manager';
import { 
  LanguageConfig,
  DeploymentConfig,
  CodeGenerationResult,
  DeploymentResult 
} from './types';

export class ImplementationSpecialistAgent extends BaseAgent {
  private vectorStore: VectorStore;
  private wsManager: WebSocketManager;
  private supportedLanguages: Set<string>;

  constructor(id: string) {
    super(id, 'implementation-specialist');
    this.supportedLanguages = new Set(['typescript', 'javascript', 'python', 'bash']);
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    this.vectorStore = await VectorStore.getInstance();
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      switch (message.type) {
        case 'CODE_GENERATION_STATUS':
          this.broadcastStatus(message.payload.taskId);
          break;
        case 'DEPLOYMENT_STATUS':
          this.handleDeploymentStatus(message.payload);
          break;
      }
    });
  }

  public async processTask(task: AgentTask): Promise<AgentResult> {
    this.status = 'busy';

    try {
      switch (task.data.action) {
        case 'generate_code':
          return await this.generateImplementation(task.data);
        case 'prepare_deployment':
          return await this.prepareDeploymentPackage(task.data);
        case 'optimize_code':
          return await this.optimizeImplementation(task.data);
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

  private async generateImplementation(data: {
    language: string;
    requirements: any;
    config: LanguageConfig;
  }): Promise<AgentResult> {
    if (!this.supportedLanguages.has(data.language)) {
      throw new Error(`Unsupported language: ${data.language}`);
    }

    const result = await generateCode(data.language, data.requirements, data.config);
    await this.validateAndStoreCode(result);

    return {
      taskId: data.requirements.id,
      status: 'success',
      data: result,
    };
  }

  private async prepareDeploymentPackage(data: {
    code: CodeGenerationResult;
    environment: string;
    config: DeploymentConfig;
  }): Promise<AgentResult> {
    const deploymentPackage = await prepareDeployment(data.code, data.environment, data.config);
    const validationResult = await validateDeployment(deploymentPackage);

    if (!validationResult.valid) {
      throw new Error(`Deployment validation failed: ${validationResult.errors.join(', ')}`);
    }

    return {
      taskId: data.code.id,
      status: 'success',
      data: deploymentPackage,
    };
  }

  private async optimizeImplementation(data: {
    code: CodeGenerationResult;
    optimizationLevel: 'minimal' | 'balanced' | 'aggressive';
  }): Promise<AgentResult> {
    const optimized = await optimizeCode(data.code, data.optimizationLevel);
    await this.validateAndStoreCode(optimized);

    return {
      taskId: data.code.id,
      status: 'success',
      data: optimized,
    };
  }

  private async validateAndStoreCode(code: CodeGenerationResult): Promise<void> {
    const validationResult = await validateCode(code);
    if (!validationResult.valid) {
      throw new Error(`Code validation failed: ${validationResult.errors.join(', ')}`);
    }

    await this.vectorStore.addDocument({
      id: code.id,
      content: JSON.stringify(code),
      metadata: {
        type: 'generated-code',
        language: code.language,
        timestamp: Date.now(),
      },
    });
  }

  private broadcastStatus(taskId: string): void {
    this.wsManager.broadcast('IMPLEMENTATION_STATUS', {
      taskId,
      agent: this.getId(),
      status: this.status,
      timestamp: Date.now(),
    });
  }

  private handleDeploymentStatus(status: DeploymentResult): void {
    this.wsManager.broadcast('DEPLOYMENT_UPDATE', {
      ...status,
      timestamp: Date.now(),
    });
  }

  public async cleanup(): void {
    this.wsManager.cleanup();
  }
}