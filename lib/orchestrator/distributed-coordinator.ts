import { EventEmitter } from 'events';
import { RedisClient } from '../storage/redis-client';
import { WorkerPool } from './worker-pool';
import { v4 as uuidv4 } from 'uuid';

interface WorkerNode {
  id: string;
  status: 'active' | 'inactive';
  lastHeartbeat: number;
  stats: {
    activeTaskCount: number;
    completedTaskCount: number;
    failedTaskCount: number;
    averageProcessingTime: number;
  };
}

export class DistributedCoordinator extends EventEmitter {
  private redis: RedisClient;
  private workerId: string;
  private workerPool: WorkerPool;
  private heartbeatInterval: NodeJS.Timeout | null;
  private static instance: DistributedCoordinator;

  private constructor() {
    super();
    this.redis = RedisClient.getInstance();
    this.workerId = uuidv4();
    this.workerPool = WorkerPool.getInstance({
      maxConcurrent: 5,
      pollInterval: 1000,
    });
    this.heartbeatInterval = null;
    this.setupSubscriptions();
  }

  public static getInstance(): DistributedCoordinator {
    if (!DistributedCoordinator.instance) {
      DistributedCoordinator.instance = new DistributedCoordinator();
    }
    return DistributedCoordinator.instance;
  }

  private setupSubscriptions(): void {
    const subscriber = this.redis.client.duplicate();
    
    subscriber.subscribe('coordinator:events', (err, count) => {
      if (err) {
        console.error('Failed to subscribe:', err);
        return;
      }
    });

    subscriber.on('message', async (channel, message) => {
      const data = JSON.parse(message);
      switch (data.type) {
        case 'WORKER_JOINED':
          this.handleWorkerJoined(data.workerId);
          break;
        case 'WORKER_LEFT':
          this.handleWorkerLeft(data.workerId);
          break;
        case 'TASK_REDISTRIBUTED':
          this.handleTaskRedistributed(data.taskId);
          break;
      }
    });
  }

  public async start(): Promise<void> {
    // Register worker
    const worker: WorkerNode = {
      id: this.workerId,
      status: 'active',
      lastHeartbeat: Date.now(),
      stats: {
        activeTaskCount: 0,
        completedTaskCount: 0,
        failedTaskCount: 0,
        averageProcessingTime: 0,
      },
    };

    await this.redis.client.hset(
      'workers:active',
      this.workerId,
      JSON.stringify(worker)
    );

    // Start heartbeat
    this.startHeartbeat();

    // Start worker pool
    this.workerPool.start();

    // Publish worker joined event
    await this.redis.client.publish(
      'coordinator:events',
      JSON.stringify({ type: 'WORKER_JOINED', workerId: this.workerId })
    );

    this.emit('started');
  }

  public async stop(): Promise<void> {
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Stop worker pool
    this.workerPool.stop();

    // Remove worker from active set
    await this.redis.client.hdel('workers:active', this.workerId);

    // Publish worker left event
    await this.redis.client.publish(
      'coordinator:events',
      JSON.stringify({ type: 'WORKER_LEFT', workerId: this.workerId })
    );

    this.emit('stopped');
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        const stats = this.workerPool.getStats();
        
        await this.redis.client.hset(
          'workers:active',
          this.workerId,
          JSON.stringify({
            id: this.workerId,
            status: 'active',
            lastHeartbeat: Date.now(),
            stats,
          })
        );
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    }, 5000);
  }

  private async handleWorkerJoined(workerId: string): Promise<void> {
    if (workerId === this.workerId) return;

    // Rebalance tasks if needed
    await this.rebalanceTasks();
  }

  private async handleWorkerLeft(workerId: string): Promise<void> {
    // Redistribute tasks from failed worker
    const tasks = await this.redis.client.hgetall(`tasks:${workerId}`);
    
    for (const [taskId, taskJson] of Object.entries(tasks)) {
      await this.redistributeTask(taskId, JSON.parse(taskJson));
    }
  }

  private async handleTaskRedistributed(taskId: string): Promise<void> {
    // Check if this worker should pick up the redistributed task
    const workerCount = await this.redis.client.hlen('workers:active');
    const taskHash = this.hashTaskId(taskId);
    
    if (this.shouldProcessTask(taskHash, workerCount)) {
      const taskJson = await this.redis.client.hget('tasks:redistributed', taskId);
      if (taskJson) {
        const task = JSON.parse(taskJson);
        await this.workerPool.processTask(task);
      }
    }
  }

  private async rebalanceTasks(): Promise<void> {
    const workers = await this.getActiveWorkers();
    if (workers.length <= 1) return;

    const workerStats = workers.map(w => w.stats.activeTaskCount);
    const avgLoad = workerStats.reduce((a, b) => a + b, 0) / workers.length;
    const thisWorker = workers.find(w => w.id === this.workerId);

    if (thisWorker && thisWorker.stats.activeTaskCount > avgLoad * 1.2) {
      // This worker is overloaded, redistribute some tasks
      const tasksToRedistribute = Math.floor(
        thisWorker.stats.activeTaskCount - avgLoad
      );

      for (let i = 0; i < tasksToRedistribute; i++) {
        const task = await this.workerPool.getNextTask();
        if (task) {
          await this.redistributeTask(task.id, task);
        }
      }
    }
  }

  private async redistributeTask(taskId: string, task: any): Promise<void> {
    await this.redis.client.hset(
      'tasks:redistributed',
      taskId,
      JSON.stringify(task)
    );

    await this.redis.client.publish(
      'coordinator:events',
      JSON.stringify({ type: 'TASK_REDISTRIBUTED', taskId })
    );
  }

  private async getActiveWorkers(): Promise<WorkerNode[]> {
    const workers = await this.redis.client.hgetall('workers:active');
    const now = Date.now();
    const activeWorkers: WorkerNode[] = [];

    for (const [id, workerJson] of Object.entries(workers)) {
      const worker: WorkerNode = JSON.parse(workerJson);
      if (now - worker.lastHeartbeat < 15000) { // 15 seconds timeout
        activeWorkers.push(worker);
      }
    }

    return activeWorkers;
  }

  private hashTaskId(taskId: string): number {
    let hash = 0;
    for (let i = 0; i < taskId.length; i++) {
      hash = ((hash << 5) - hash) + taskId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private shouldProcessTask(taskHash: number, workerCount: number): boolean {
    const workerIndex = this.hashTaskId(this.workerId) % workerCount;
    return taskHash % workerCount === workerIndex;
  }

  public async cleanup(): Promise<void> {
    await this.stop();
    this.removeAllListeners();
  }
}