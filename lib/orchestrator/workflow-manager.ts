import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from '../agents/base-agent';
import { AgentTask, AgentResult } from '../agents/types';
import { RedisClient } from '../storage/redis-client';
import { VectorStore } from '../storage/vector-store';
import { WebSocketManager } from '../websocket/connection-manager';

export class WorkflowManager extends EventEmitter {
  private agents: Map<string, BaseAgent>;
  private redis: RedisClient;
  private vectorStore: VectorStore;
  private wsManager: WebSocketManager;
  private static instance: WorkflowManager;

  private constructor() {
    super();
    this.agents = new Map();
    this.redis = RedisClient.getInstance();
    this.vectorStore = VectorStore.getInstance();
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  public static getInstance(): WorkflowManager {
    if (!WorkflowManager.instance) {
      WorkflowManager.instance = new WorkflowManager();
    }
    return WorkflowManager.instance;
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ connectionId, message }) => {
      switch (message.type) {
        case 'SCHEDULE_TASK':
          await this.scheduleTask(message.payload);
          break;
        case 'QUERY_KNOWLEDGE':
          const results = await this.queryKnowledge(message.payload.query);
          this.wsManager.sendTo(connectionId, 'QUERY_RESULTS', results);
          break;
      }
    });
  }

  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getId(), agent);
    agent.on('message', this.handleAgentMessage.bind(this));
    this.wsManager.broadcast('AGENT_REGISTERED', {
      id: agent.getId(),
      type: agent.getType(),
      status: agent.getStatus()
    });
  }

  public async scheduleTask(task: AgentTask): Promise<void> {
    const taskWithId = { ...task, id: uuidv4() };
    await this.redis.pushTask(taskWithId);
    this.wsManager.broadcast('TASK_SCHEDULED', taskWithId);
    await this.processNextTask();
  }

  private async handleAgentMessage(message: any): Promise<void> {
    if (message.type === 'response') {
      await this.vectorStore.storeKnowledge({
        id: uuidv4(),
        agentId: message.metadata.agentId,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata
      });
      this.wsManager.broadcast('AGENT_RESPONSE', message);
    }
  }

  private async processNextTask(): Promise<void> {
    const task = await this.redis.popTask();
    if (!task) return;

    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.getStatus() === 'idle');

    if (availableAgents.length === 0) {
      await this.redis.pushTask(task);
      return;
    }

    const agent = this.selectBestAgent(availableAgents, task);
    try {
      const result = await agent.processTask(task);
      this.handleTaskResult(task, result);
    } catch (error) {
      this.handleTaskError(task, error);
    }
  }

  private selectBestAgent(agents: BaseAgent[], task: AgentTask): BaseAgent {
    // Implement agent selection logic based on task requirements
    return agents[0];
  }

  private handleTaskResult(task: AgentTask, result: AgentResult): void {
    this.wsManager.broadcast('TASK_COMPLETED', {
      taskId: task.id,
      result
    });
  }

  private handleTaskError(task: AgentTask, error: any): void {
    this.wsManager.broadcast('TASK_ERROR', {
      taskId: task.id,
      error: error.message
    });
  }

  public async queryKnowledge(query: string): Promise<any[]> {
    return this.vectorStore.search(query);
  }

  public async cleanup(): Promise<void> {
    this.wsManager.cleanup();
    await this.redis.cleanup();
    this.removeAllListeners();
  }
}