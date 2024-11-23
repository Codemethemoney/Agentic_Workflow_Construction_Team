import { RedisClient } from '../storage/redis-client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const TaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  priority: z.number().min(0).max(10),
  data: z.any(),
  deadline: z.number().optional(),
  retryCount: z.number().default(0),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Task = z.infer<typeof TaskSchema>;

export class TaskQueue {
  private redis: RedisClient;
  private static instance: TaskQueue;

  private constructor() {
    this.redis = RedisClient.getInstance();
  }

  public static getInstance(): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue();
    }
    return TaskQueue.instance;
  }

  public async enqueue(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const timestamp = Date.now();
    const fullTask: Task = {
      id: uuidv4(),
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      ...task,
    };

    try {
      TaskSchema.parse(fullTask);
      
      // Store task in Redis sorted set with priority as score
      await this.redis.client.zadd(
        'tasks:queue',
        fullTask.priority,
        JSON.stringify(fullTask)
      );

      // Publish task added event
      await this.redis.client.publish(
        'tasks:events',
        JSON.stringify({ type: 'TASK_ADDED', task: fullTask })
      );

      return fullTask.id;
    } catch (error) {
      throw new Error(`Invalid task format: ${error.message}`);
    }
  }

  public async dequeue(): Promise<Task | null> {
    // Get highest priority task
    const result = await this.redis.client.zpopmax('tasks:queue');
    if (!result.length) return null;

    const task: Task = JSON.parse(result[0]);
    task.status = 'processing';
    task.updatedAt = Date.now();

    // Store task in processing set
    await this.redis.client.hset(
      'tasks:processing',
      task.id,
      JSON.stringify(task)
    );

    await this.redis.client.publish(
      'tasks:events',
      JSON.stringify({ type: 'TASK_STARTED', task })
    );

    return task;
  }

  public async complete(taskId: string, result: any): Promise<void> {
    const taskJson = await this.redis.client.hget('tasks:processing', taskId);
    if (!taskJson) throw new Error(`Task ${taskId} not found`);

    const task: Task = JSON.parse(taskJson);
    task.status = 'completed';
    task.updatedAt = Date.now();

    // Store result
    await this.redis.client.hset(
      'tasks:results',
      taskId,
      JSON.stringify({ ...task, result })
    );

    // Remove from processing set
    await this.redis.client.hdel('tasks:processing', taskId);

    await this.redis.client.publish(
      'tasks:events',
      JSON.stringify({ type: 'TASK_COMPLETED', task, result })
    );
  }

  public async fail(taskId: string, error: Error): Promise<void> {
    const taskJson = await this.redis.client.hget('tasks:processing', taskId);
    if (!taskJson) throw new Error(`Task ${taskId} not found`);

    const task: Task = JSON.parse(taskJson);
    
    if (task.retryCount < 3) {
      // Requeue with increased priority and retry count
      task.priority = Math.min(task.priority + 1, 10);
      task.retryCount += 1;
      task.status = 'pending';
      task.updatedAt = Date.now();

      await this.redis.client.zadd(
        'tasks:queue',
        task.priority,
        JSON.stringify(task)
      );
    } else {
      // Mark as failed after max retries
      task.status = 'failed';
      task.updatedAt = Date.now();

      await this.redis.client.hset(
        'tasks:failed',
        taskId,
        JSON.stringify({ ...task, error: error.message })
      );
    }

    // Remove from processing set
    await this.redis.client.hdel('tasks:processing', taskId);

    await this.redis.client.publish(
      'tasks:events',
      JSON.stringify({ type: 'TASK_FAILED', task, error: error.message })
    );
  }

  public async getStatus(taskId: string): Promise<Task | null> {
    // Check all possible task states
    const states = ['processing', 'results', 'failed'];
    
    for (const state of states) {
      const taskJson = await this.redis.client.hget(`tasks:${state}`, taskId);
      if (taskJson) {
        return JSON.parse(taskJson);
      }
    }

    return null;
  }

  public async cleanup(): Promise<void> {
    // Clean up old completed and failed tasks
    const threshold = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    const cleanupSet = async (key: string) => {
      const tasks = await this.redis.client.hgetall(`tasks:${key}`);
      for (const [taskId, taskJson] of Object.entries(tasks)) {
        const task: Task = JSON.parse(taskJson);
        if (task.updatedAt < threshold) {
          await this.redis.client.hdel(`tasks:${key}`, taskId);
        }
      }
    };

    await Promise.all([
      cleanupSet('results'),
      cleanupSet('failed')
    ]);
  }
}