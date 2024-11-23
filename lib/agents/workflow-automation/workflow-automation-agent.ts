import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from '../base-agent';
import { AgentTask, AgentResult } from '../types';
import { 
  WorkflowDefinition, 
  WorkflowState, 
  WorkflowStep,
  WorkflowMetrics,
  StepState 
} from './types';
import { RedisClient } from '../../storage/redis-client';
import { VectorStore } from '../../storage/vector-store';
import { WebSocketManager } from '../../websocket/connection-manager';

export class WorkflowAutomationAgent extends BaseAgent {
  private workflows: Map<string, WorkflowDefinition>;
  private states: Map<string, WorkflowState>;
  private metrics: Map<string, WorkflowMetrics>;
  private redis: RedisClient;
  private vectorStore: VectorStore;
  private wsManager: WebSocketManager;

  constructor(id: string) {
    super(id, 'workflow-automation');
    this.workflows = new Map();
    this.states = new Map();
    this.metrics = new Map();
    this.redis = RedisClient.getInstance();
    this.vectorStore = VectorStore.getInstance();
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      switch (message.type) {
        case 'WORKFLOW_STATUS':
          await this.handleStatusRequest(message.payload);
          break;
        case 'WORKFLOW_CONTROL':
          await this.handleControlCommand(message.payload);
          break;
      }
    });
  }

  public async processTask(task: AgentTask): Promise<AgentResult> {
    this.status = 'busy';

    try {
      switch (task.data.action) {
        case 'create_workflow':
          return await this.createWorkflow(task.data.definition);
        case 'execute_workflow':
          return await this.executeWorkflow(task.data.workflowId, task.data.input);
        case 'update_workflow':
          return await this.updateWorkflow(task.data.workflowId, task.data.updates);
        case 'get_metrics':
          return await this.getWorkflowMetrics(task.data.workflowId);
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

  private async createWorkflow(definition: WorkflowDefinition): Promise<AgentResult> {
    const workflowId = uuidv4();
    const workflow = { ...definition, id: workflowId };
    
    // Validate workflow definition
    this.validateWorkflow(workflow);
    
    // Store workflow
    this.workflows.set(workflowId, workflow);
    await this.persistWorkflow(workflow);
    
    // Initialize metrics
    this.initializeMetrics(workflowId);
    
    return {
      taskId: workflowId,
      status: 'success',
      data: { workflowId, workflow },
    };
  }

  private async executeWorkflow(
    workflowId: string,
    input: any
  ): Promise<AgentResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = uuidv4();
    const state: WorkflowState = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: Date.now(),
      steps: {},
    };

    this.states.set(executionId, state);
    
    try {
      // Execute workflow steps
      const result = await this.executeWorkflowSteps(workflow, state, input);
      
      // Update metrics
      await this.updateWorkflowMetrics(workflowId, state);
      
      return {
        taskId: executionId,
        status: 'success',
        data: result,
      };
    } catch (error) {
      state.status = 'failed';
      state.endTime = Date.now();
      
      // Handle error according to workflow configuration
      await this.handleWorkflowError(workflow, state, error);
      
      throw error;
    }
  }

  private async executeWorkflowSteps(
    workflow: WorkflowDefinition,
    state: WorkflowState,
    input: any
  ): Promise<any> {
    let currentStepId = workflow.steps[0].id;
    let stepInput = input;

    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) break;

      state.currentStep = currentStepId;
      const stepState = await this.executeStep(step, stepInput, workflow, state);
      
      if (stepState.status === 'failed') {
        if (step.onError) {
          currentStepId = step.onError;
          continue;
        }
        throw new Error(`Step ${step.id} failed: ${stepState.error}`);
      }

      stepInput = stepState.output;
      currentStepId = this.determineNextStep(step, stepInput);
    }

    state.status = 'completed';
    state.endTime = Date.now();
    
    return stepInput;
  }

  private async executeStep(
    step: WorkflowStep,
    input: any,
    workflow: WorkflowDefinition,
    state: WorkflowState
  ): Promise<StepState> {
    const stepState: StepState = {
      status: 'running',
      startTime: Date.now(),
      attempts: 0,
    };

    state.steps[step.id] = stepState;
    this.broadcastStateUpdate(state);

    try {
      let result;
      switch (step.type) {
        case 'agent-task':
          result = await this.executeAgentTask(step, input);
          break;
        case 'condition':
          result = await this.evaluateCondition(step, input);
          break;
        case 'transformation':
          result = await this.applyTransformation(step, input);
          break;
      }

      stepState.status = 'completed';
      stepState.endTime = Date.now();
      stepState.output = result;
    } catch (error) {
      stepState.status = 'failed';
      stepState.error = error.message;
      
      if (await this.shouldRetry(step, stepState)) {
        return await this.retryStep(step, input, workflow, state);
      }
    }

    this.broadcastStateUpdate(state);
    return stepState;
  }

  private async executeAgentTask(step: WorkflowStep, input: any): Promise<any> {
    const { agentId, taskType } = step.config;
    if (!agentId || !taskType) {
      throw new Error('Invalid agent task configuration');
    }

    const task: AgentTask = {
      id: uuidv4(),
      type: taskType,
      data: input,
    };

    // Execute task through workflow manager
    const result = await this.executeTask(agentId, task);
    if (result.status === 'failure') {
      throw new Error(result.error || 'Agent task failed');
    }

    return result.data;
  }

  private async evaluateCondition(step: WorkflowStep, input: any): Promise<boolean> {
    const { condition } = step.config;
    if (!condition) {
      throw new Error('Invalid condition configuration');
    }

    // Evaluate condition expression
    return this.evaluateExpression(condition, input);
  }

  private async applyTransformation(step: WorkflowStep, input: any): Promise<any> {
    const { transformation } = step.config;
    if (!transformation) {
      throw new Error('Invalid transformation configuration');
    }

    // Apply transformation logic
    return this.transformData(transformation, input);
  }

  private determineNextStep(step: WorkflowStep, stepOutput: any): string | null {
    if (step.type === 'condition') {
      return stepOutput ? step.next[0] : step.next[1];
    }
    return step.next[0] || null;
  }

  private async shouldRetry(step: WorkflowStep, state: StepState): boolean {
    const policy = step.config.retryPolicy;
    if (!policy) return false;

    return state.attempts < policy.maxAttempts;
  }

  private async retryStep(
    step: WorkflowStep,
    input: any,
    workflow: WorkflowDefinition,
    state: WorkflowState
  ): Promise<StepState> {
    const stepState = state.steps[step.id];
    const policy = step.config.retryPolicy!;

    // Calculate backoff delay
    const delay = Math.min(
      policy.backoffMs * Math.pow(2, stepState.attempts),
      policy.maxBackoffMs
    );

    await new Promise(resolve => setTimeout(resolve, delay));
    stepState.attempts++;

    return this.executeStep(step, input, workflow, state);
  }

  private async handleWorkflowError(
    workflow: WorkflowDefinition,
    state: WorkflowState,
    error: any
  ): Promise<void> {
    // Execute fallback actions
    for (const action of workflow.errorHandling.fallbackActions) {
      try {
        await this.executeStep(action, null, workflow, state);
      } catch (fallbackError) {
        console.error('Fallback action failed:', fallbackError);
      }
    }

    // Send notifications
    await this.sendErrorNotifications(workflow, state, error);
  }

  private async updateWorkflowMetrics(
    workflowId: string,
    state: WorkflowState
  ): Promise<void> {
    const metrics = this.metrics.get(workflowId)!;
    metrics.totalExecutions++;

    if (state.status === 'completed') {
      metrics.successRate = 
        (metrics.successRate * (metrics.totalExecutions - 1) + 1) / 
        metrics.totalExecutions;
    } else {
      metrics.successRate = 
        (metrics.successRate * (metrics.totalExecutions - 1)) / 
        metrics.totalExecutions;
    }

    const duration = (state.endTime! - state.startTime);
    metrics.averageDuration = 
      (metrics.averageDuration * (metrics.totalExecutions - 1) + duration) /
      metrics.totalExecutions;

    // Update step metrics
    Object.entries(state.steps).forEach(([stepId, stepState]) => {
      const stepMetrics = metrics.stepMetrics[stepId];
      const stepDuration = stepState.endTime! - stepState.startTime!;

      stepMetrics.averageDuration = 
        (stepMetrics.averageDuration * (metrics.totalExecutions - 1) + stepDuration) /
        metrics.totalExecutions;

      stepMetrics.failureRate = 
        (stepMetrics.failureRate * (metrics.totalExecutions - 1) + 
          (stepState.status === 'failed' ? 1 : 0)) /
        metrics.totalExecutions;

      stepMetrics.lastExecutionTime = stepState.endTime!;
    });

    await this.persistMetrics(workflowId, metrics);
  }

  private broadcastStateUpdate(state: WorkflowState): void {
    this.wsManager.broadcast('WORKFLOW_STATE_UPDATE', {
      executionId: state.id,
      workflowId: state.workflowId,
      status: state.status,
      currentStep: state.currentStep,
      steps: state.steps,
    });
  }

  private async persistWorkflow(workflow: WorkflowDefinition): Promise<void> {
    await this.redis.setKey(
      `workflow:${workflow.id}`,
      JSON.stringify(workflow)
    );

    await this.vectorStore.addDocument({
      id: workflow.id,
      content: JSON.stringify(workflow),
      metadata: {
        type: 'workflow',
        name: workflow.name,
        timestamp: Date.now(),
      },
    });
  }

  private async persistMetrics(
    workflowId: string,
    metrics: WorkflowMetrics
  ): Promise<void> {
    await this.redis.setKey(
      `workflow:metrics:${workflowId}`,
      JSON.stringify(metrics)
    );
  }

  private initializeMetrics(workflowId: string): void {
    const workflow = this.workflows.get(workflowId)!;
    
    const metrics: WorkflowMetrics = {
      totalExecutions: 0,
      successRate: 1,
      averageDuration: 0,
      stepMetrics: {},
    };

    workflow.steps.forEach(step => {
      metrics.stepMetrics[step.id] = {
        averageDuration: 0,
        failureRate: 0,
        lastExecutionTime: 0,
      };
    });

    this.metrics.set(workflowId, metrics);
  }

  private validateWorkflow(workflow: WorkflowDefinition): void {
    // Implement workflow validation logic
    if (!workflow.steps.length) {
      throw new Error('Workflow must contain at least one step');
    }

    // Validate step connections
    const stepIds = new Set(workflow.steps.map(s => s.id));
    workflow.steps.forEach(step => {
      step.next.forEach(nextId => {
        if (!stepIds.has(nextId)) {
          throw new Error(`Invalid step reference: ${nextId}`);
        }
      });
    });
  }

  private evaluateExpression(expression: string, context: any): boolean {
    // Implement expression evaluation logic
    return true;
  }

  private transformData(transformation: string, data: any): any {
    // Implement data transformation logic
    return data;
  }

  private async sendErrorNotifications(
    workflow: WorkflowDefinition,
    state: WorkflowState,
    error: any
  ): Promise<void> {
    // Implement notification logic
  }

  public async cleanup(): Promise<void> {
    this.wsManager.cleanup();
    this.workflows.clear();
    this.states.clear();
    this.metrics.clear();
  }
}