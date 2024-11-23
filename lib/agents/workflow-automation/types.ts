import { AgentTask } from '../types';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  errorHandling: ErrorHandlingConfig;
  metadata: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'agent-output' | 'schedule' | 'event';
  config: {
    agentId?: string;
    eventType?: string;
    schedule?: string;
    conditions?: TriggerCondition[];
  };
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt';
  value: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent-task' | 'condition' | 'transformation';
  config: {
    agentId?: string;
    taskType?: string;
    condition?: string;
    transformation?: string;
    retryPolicy?: RetryPolicy;
  };
  next: string[];
  onError?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface ErrorHandlingConfig {
  defaultRetryPolicy: RetryPolicy;
  notificationChannels: string[];
  fallbackActions: WorkflowStep[];
}

export interface WorkflowState {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  startTime: number;
  endTime?: number;
  steps: Record<string, StepState>;
}

export interface StepState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  attempts: number;
  error?: string;
  output?: any;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  stepMetrics: Record<string, {
    averageDuration: number;
    failureRate: number;
    lastExecutionTime: number;
  }>;
}