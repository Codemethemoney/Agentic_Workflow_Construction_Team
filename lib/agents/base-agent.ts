import { EventEmitter } from 'events';
import { z } from 'zod';
import { 
  AgentStatus, 
  AgentType, 
  AgentMessage, 
  AgentTask, 
  AgentResult,
  AgentMetrics 
} from './types';

const messageSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['task', 'response', 'error']),
  content: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
});

export class BaseAgent extends EventEmitter {
  protected id: string;
  protected type: AgentType;
  protected status: AgentStatus;
  protected metrics: AgentMetrics;

  constructor(id: string, type: AgentType) {
    super();
    this.id = id;
    this.type = type;
    this.status = 'idle';
    this.metrics = {
      tasksCompleted: 0,
      successRate: 100,
      averageProcessingTime: 0,
      lastActive: Date.now(),
    };
  }

  public getId(): string {
    return this.id;
  }

  public getType(): AgentType {
    return this.type;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  protected async sendMessage(message: AgentMessage): Promise<void> {
    try {
      messageSchema.parse(message);
      this.emit('message', message);
      this.metrics.lastActive = Date.now();
    } catch (error) {
      this.emit('error', {
        id: message.id,
        type: 'error',
        content: 'Invalid message format',
        timestamp: Date.now(),
        metadata: { error },
      });
    }
  }

  public async processTask(task: AgentTask): Promise<AgentResult> {
    this.status = 'busy';
    const startTime = Date.now();

    try {
      // Base implementation - should be overridden by specific agent types
      throw new Error('processTask must be implemented by derived classes');
    } catch (error) {
      this.status = 'error';
      const result: AgentResult = {
        taskId: task.id,
        status: 'failure',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: Date.now(),
      };
      this.updateMetrics(result, startTime);
      return result;
    } finally {
      this.status = 'idle';
    }
  }

  protected updateMetrics(result: AgentResult, startTime: number): void {
    const processingTime = Date.now() - startTime;
    this.metrics.tasksCompleted++;
    
    // Update success rate
    const successCount = this.metrics.successRate * (this.metrics.tasksCompleted - 1);
    this.metrics.successRate = (successCount + (result.status === 'success' ? 1 : 0)) / 
      this.metrics.tasksCompleted;
    
    // Update average processing time
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.tasksCompleted - 1) + processingTime) / 
      this.metrics.tasksCompleted;
    
    this.metrics.lastActive = Date.now();
  }

  public async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.status = 'idle';
  }
}