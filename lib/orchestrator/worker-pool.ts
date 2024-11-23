import { EventEmitter } from 'events';
import { TaskQueue, Task } from './task-queue';
import { RedisClient } from '../storage/redis-client';
import { BaseAgent } from '../agents/base-agent';

interface WorkerConfig {
  maxConcurrent: number;
  pollInterval: number;
}

export class WorkerPool extends EventEmitter {
  private taskQueue: TaskQueue;
  private redis: RedisClient;
  private agents: Map<string, BaseAgent>;
  private activeTasks: Map<string, Task>;
  private config: WorkerConfig;
  private pollInterval: NodeJS.Timeout | null;
  private static instance: WorkerPool;

  private constructor(config: WorkerConfig) {
    super();
    this.taskQueue = TaskQueue.getInstance();
    this.redis = RedisClient.getInstance();
    this.agents = new Map();
    this.activeTasks = new Map();
    this.config = config;
    this.pollInterval = null;
    this.setupSubscriptions();
  }

  public static getInstance(config?: WorkerConfig): WorkerPool {
    if (!WorkerPool.instance) {
      if (!config) {
        throw new Error('WorkerPool must be initialized with config');
      }
      WorkerPool.instance = new WorkerPool(config);
    }
    return WorkerPool.instance;
  }

  private setupSubscriptions(): void {
    const subscriber = this.redis.client.duplicate();
    
    subscriber.subscribe('worker:control', (err, count) => {
      if (err) {
        console.error('Failed to subscribe:', err);
        return;
      }
    });

    subscriber.on('message', async (channel, message) => {
      const data = JSON.parse(message);
      switch (data.type) {
        case 'STOP_WORKER':
          this.stop();
          break;
        case 'START_WORKER':
          this.start();
          break;
        case 'UPDATE_CONFIG':
          this.updateConfig(data.config);
          break;
      }
    });
  }

  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getId(), agent);
    this.emit('agentRegistered', agent.getId());
  }

  public unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.emit('agentUnregistered', agentId);
  }

  public start(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(
      async () => this.pollTasks(),
      this.config.pollInterval
    );

    this.emit('started');
  }

  public stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.emit('stopped');
  }

  private async pollTasks(): Promise<void> {
    if (this.activeTasks.size >= this.config.maxConcurrent) {
      return;
    }

    const availableSlots = this.config.maxConcurrent - this.activeTasks.size;
    
    for (let i = 0; i < availableSlots; i++) {
      const task = await this.taskQueue.dequeue();
      if (!task) break;

      this.processTask(task).catch(error => {
        console.error(`Error processing task ${task.id}:`, error);
      });
    }
  }

  private async processTask(task: Task): Promise<void> {
    this.activeTasks.set(task.id, task);
    this.emit('taskStarted', task);

    try {
      const agent = this.findAvailableAgent(task.type);
      if (!agent) {
        throw new Error(`No available agent for task type: ${task.type}`);
      }

      const result = await agent.processTask({
        id: task.id,
        type: task.type,
        data: task.data,
      });

      if (result.status === 'success') {
        await this.taskQueue.complete(task.id, result.data);
        this.emit('taskCompleted', task, result);
      } else {
        await this.taskQueue.fail(task.id, new Error(result.error || 'Task failed'));
        this.emit('taskFailed', task, result);
      }
    } catch (error) {
      await this.taskQueue.fail(task.id, error);
      this.emit('taskFailed', task, { error });
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  private findAvailableAgent(taskType: string): BaseAgent | undefined {
    return Array.from(this.agents.values()).find(
      agent => agent.getType() === taskType && agent.getStatus() === 'idle'
    );
  }

  private updateConfig(newConfig: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart polling with new interval if running
    if (this.pollInterval) {
      this.stop();
      this.start();
    }

    this.emit('configUpdated', this.config);
  }

  public getStats(): {
    activeTaskCount: number;
    registeredAgentCount: number;
    config: WorkerConfig;
  } {
    return {
      activeTaskCount: this.activeTasks.size,
      registeredAgentCount: this.agents.size,
      config: { ...this.config },
    };
  }

  public async cleanup(): Promise<void> {
    this.stop();
    this.agents.clear();
    this.activeTasks.clear();
    this.removeAllListeners();
  }
}