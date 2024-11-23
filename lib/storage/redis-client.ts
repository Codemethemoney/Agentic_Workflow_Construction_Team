import Redis from 'ioredis';
import { AgentTask } from '../agents/types';

export class RedisClient {
  private client: Redis;
  private readonly taskQueue = 'agent_tasks';
  private static instance: RedisClient;

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async pushTask(task: AgentTask): Promise<void> {
    await this.client.lpush(this.taskQueue, JSON.stringify(task));
  }

  public async popTask(): Promise<AgentTask | null> {
    const task = await this.client.rpop(this.taskQueue);
    return task ? JSON.parse(task) : null;
  }

  public async getQueueLength(): Promise<number> {
    return this.client.llen(this.taskQueue);
  }

  public async setKey(key: string, value: string, expireSeconds?: number): Promise<void> {
    await this.client.set(key, value);
    if (expireSeconds) {
      await this.client.expire(key, expireSeconds);
    }
  }

  public async getKey(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async deleteKey(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async cleanup(): Promise<void> {
    await this.client.quit();
  }
}