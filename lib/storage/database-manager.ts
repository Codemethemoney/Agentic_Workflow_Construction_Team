import { EventEmitter } from 'events';
import { VectorStore } from './vector-store';
import { RedisClient } from './redis-client';

export type DatabaseType = 'vector' | 'redis' | 'mongo';

interface DatabaseConfig {
  type: DatabaseType;
  url?: string;
  options?: Record<string, any>;
}

export class DatabaseManager extends EventEmitter {
  private static instance: DatabaseManager;
  private activeConnections: Map<DatabaseType, any>;
  private config: Record<DatabaseType, DatabaseConfig>;

  private constructor() {
    super();
    this.activeConnections = new Map();
    this.config = {
      vector: { type: 'vector' },
      redis: { type: 'redis', url: process.env.REDIS_URL },
      mongo: { type: 'mongo', url: process.env.MONGODB_URL },
    };
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getConnection(type: DatabaseType): Promise<any> {
    if (!this.activeConnections.has(type)) {
      await this.initializeConnection(type);
    }
    return this.activeConnections.get(type);
  }

  private async initializeConnection(type: DatabaseType): Promise<void> {
    const config = this.config[type];
    if (!config) {
      throw new Error(`Unsupported database type: ${type}`);
    }

    try {
      let connection;
      switch (type) {
        case 'vector':
          connection = await VectorStore.getInstance();
          break;
        case 'redis':
          connection = RedisClient.getInstance();
          break;
        case 'mongo':
          // MongoDB initialization would go here
          break;
      }

      this.activeConnections.set(type, connection);
      this.emit('connectionEstablished', { type });
    } catch (error) {
      this.emit('connectionError', { type, error });
      throw error;
    }
  }

  public async updateConfig(type: DatabaseType, config: Partial<DatabaseConfig>): Promise<void> {
    this.config[type] = { ...this.config[type], ...config };
    
    // Reinitialize connection if it exists
    if (this.activeConnections.has(type)) {
      await this.closeConnection(type);
      await this.initializeConnection(type);
    }
  }

  private async closeConnection(type: DatabaseType): Promise<void> {
    const connection = this.activeConnections.get(type);
    if (connection) {
      if (typeof connection.cleanup === 'function') {
        await connection.cleanup();
      }
      this.activeConnections.delete(type);
    }
  }

  public async cleanup(): Promise<void> {
    for (const type of this.activeConnections.keys()) {
      await this.closeConnection(type);
    }
    this.removeAllListeners();
  }
}