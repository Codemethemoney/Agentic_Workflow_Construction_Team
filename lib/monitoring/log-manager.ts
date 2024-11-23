import { EventEmitter } from 'events';
import { RedisClient } from '../storage/redis-client';
import { WebSocketManager } from '../websocket/connection-manager';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

export class LogManager extends EventEmitter {
  private redis: RedisClient;
  private wsManager: WebSocketManager;
  private static instance: LogManager;

  private constructor() {
    super();
    this.redis = RedisClient.getInstance();
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      if (message.type === 'LOG_QUERY') {
        const logs = await this.queryLogs(message.payload);
        this.wsManager.broadcast('LOG_RESULTS', logs);
      }
    });
  }

  public async log(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      ...entry,
    };

    await this.storeLog(logEntry);
    this.wsManager.broadcast('NEW_LOG', logEntry);
    this.emit('newLog', logEntry);
  }

  private async storeLog(entry: LogEntry): Promise<void> {
    const key = `logs:${entry.timestamp}:${entry.id}`;
    await this.redis.setKey(key, JSON.stringify(entry));

    // Store in time-based index
    await this.redis.pushTask({
      id: entry.id,
      type: 'log_index',
      data: {
        timestamp: entry.timestamp,
        level: entry.level,
        source: entry.source,
      },
    });
  }

  public async queryLogs(query: {
    from?: number;
    to?: number;
    level?: string;
    source?: string;
    limit?: number;
  }): Promise<LogEntry[]> {
    const pattern = this.buildQueryPattern(query);
    const keys = await this.redis.keys(pattern);
    const logs: LogEntry[] = [];

    for (const key of keys) {
      const log = await this.redis.getKey(key);
      if (log) {
        logs.push(JSON.parse(log));
      }
    }

    return this.filterAndSortLogs(logs, query);
  }

  private buildQueryPattern(query: any): string {
    if (query.source) {
      return `logs:*:${query.source}:*`;
    }
    return 'logs:*';
  }

  private filterAndSortLogs(logs: LogEntry[], query: any): LogEntry[] {
    return logs
      .filter(log => {
        if (query.from && log.timestamp < query.from) return false;
        if (query.to && log.timestamp > query.to) return false;
        if (query.level && log.level !== query.level) return false;
        if (query.source && log.source !== query.source) return false;
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, query.limit || 100);
  }

  public async cleanup(): void {
    this.wsManager.cleanup();
    this.removeAllListeners();
  }
}