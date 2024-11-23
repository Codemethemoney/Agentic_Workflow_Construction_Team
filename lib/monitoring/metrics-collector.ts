import { Registry, collectDefaultMetrics, Gauge, Histogram } from 'prom-client';
import { EventEmitter } from 'events';
import { RedisClient } from '../storage/redis-client';
import { WebSocketManager } from '../websocket/connection-manager';
import { LangchainService } from '../services/langchain-service';

export class MetricsCollector extends EventEmitter {
  private registry: Registry;
  private redis: RedisClient;
  private wsManager: WebSocketManager;
  private langchain: LangchainService;
  private static instance: MetricsCollector;

  // Metrics
  private agentTaskDuration: Histogram;
  private agentTaskCount: Gauge;
  private systemLoad: Gauge;
  private memoryUsage: Gauge;
  private predictionAccuracy: Gauge;

  private constructor() {
    super();
    this.registry = new Registry();
    this.redis = RedisClient.getInstance();
    this.wsManager = new WebSocketManager();
    this.langchain = new LangchainService();
    this.initializeMetrics();
    this.setupEventHandlers();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private initializeMetrics(): void {
    // Enable default Node.js metrics
    collectDefaultMetrics({ register: this.registry });

    // Custom metrics
    this.agentTaskDuration = new Histogram({
      name: 'agent_task_duration_seconds',
      help: 'Duration of agent tasks in seconds',
      labelNames: ['agent_id', 'task_type'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.agentTaskCount = new Gauge({
      name: 'agent_task_count',
      help: 'Number of tasks processed by agents',
      labelNames: ['agent_id', 'status'],
      registers: [this.registry],
    });

    this.systemLoad = new Gauge({
      name: 'system_load',
      help: 'System load average',
      registers: [this.registry],
    });

    this.memoryUsage = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.predictionAccuracy = new Gauge({
      name: 'prediction_accuracy',
      help: 'Accuracy of system predictions',
      labelNames: ['type'],
      registers: [this.registry],
    });
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      switch (message.type) {
        case 'TASK_COMPLETED':
          this.recordTaskMetrics(message.payload);
          break;
        case 'SYSTEM_ALERT':
          await this.handleSystemAlert(message.payload);
          break;
      }
    });
  }

  public async recordTaskMetrics(task: any): Promise<void> {
    const duration = (Date.now() - task.startTime) / 1000;
    
    this.agentTaskDuration.observe(
      { agent_id: task.agentId, task_type: task.type },
      duration
    );

    this.agentTaskCount.inc({
      agent_id: task.agentId,
      status: task.status,
    });

    await this.predictPotentialIssues();
  }

  private async predictPotentialIssues(): Promise<void> {
    try {
      const metrics = await this.registry.getMetricsAsJSON();
      const prediction = await this.langchain.predictSystemIssues(metrics);

      if (prediction.confidence > 0.8) {
        this.wsManager.broadcast('SYSTEM_PREDICTION', {
          type: prediction.type,
          probability: prediction.probability,
          suggestedActions: prediction.actions,
          timestamp: Date.now(),
        });
      }

      this.predictionAccuracy.set(
        { type: prediction.type },
        prediction.confidence
      );
    } catch (error) {
      console.error('Failed to predict system issues:', error);
    }
  }

  private async handleSystemAlert(alert: any): Promise<void> {
    const metrics = await this.registry.getMetricsAsJSON();
    const analysis = await this.langchain.analyzeSystemAlert(alert, metrics);

    if (analysis.severity === 'high') {
      this.wsManager.broadcast('SYSTEM_ALERT_ANALYSIS', {
        alert,
        analysis,
        timestamp: Date.now(),
      });
    }
  }

  public async getMetrics(): Promise<any> {
    return this.registry.getMetricsAsJSON();
  }

  public async cleanup(): Promise<void> {
    this.registry.clear();
    this.wsManager.cleanup();
    this.removeAllListeners();
  }
}