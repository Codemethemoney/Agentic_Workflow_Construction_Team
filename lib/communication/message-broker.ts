import { EventEmitter } from 'events';
import { RedisClient } from '../storage/redis-client';
import { Message, MessageSchema, SubscriptionOptions, MessageBrokerStats } from './types';
import { WebSocketManager } from '../websocket/connection-manager';

export class MessageBroker extends EventEmitter {
  private redis: RedisClient;
  private wsManager: WebSocketManager;
  private subscribers: Map<string, Set<(message: Message) => void>>;
  private stats: MessageBrokerStats;
  private static instance: MessageBroker;

  private constructor() {
    super();
    this.redis = RedisClient.getInstance();
    this.wsManager = new WebSocketManager();
    this.subscribers = new Map();
    this.stats = {
      totalMessages: 0,
      activeSubscribers: 0,
      messageTypeDistribution: {},
      averageLatency: 0,
    };
    this.setupEventHandlers();
  }

  public static getInstance(): MessageBroker {
    if (!MessageBroker.instance) {
      MessageBroker.instance = new MessageBroker();
    }
    return MessageBroker.instance;
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      if (message.type === 'STATS_REQUEST') {
        this.broadcastStats();
      }
    });
  }

  public async publish(message: Message): Promise<void> {
    try {
      // Validate message format
      MessageSchema.parse(message);

      const startTime = Date.now();

      // Store message in Redis for persistence
      await this.redis.setKey(
        `message:${message.id}`,
        JSON.stringify(message),
        message.metadata.ttl
      );

      // Handle broadcast messages
      if (message.recipient.broadcast) {
        await this.broadcast(message);
      } else {
        await this.deliverToRecipient(message);
      }

      // Update stats
      this.updateStats(message, startTime);

    } catch (error) {
      this.emit('error', {
        type: 'PUBLISH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        messageId: message.id,
      });
      throw error;
    }
  }

  public subscribe(
    callback: (message: Message) => void,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscriberId = Math.random().toString(36).substring(7);
    
    const subscription = (message: Message) => {
      if (this.matchesSubscriptionCriteria(message, options)) {
        callback(message);
      }
    };

    if (!this.subscribers.has(subscriberId)) {
      this.subscribers.set(subscriberId, new Set());
    }
    this.subscribers.get(subscriberId)!.add(subscription);
    
    this.stats.activeSubscribers++;

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(subscriberId);
      if (subs) {
        subs.delete(subscription);
        if (subs.size === 0) {
          this.subscribers.delete(subscriberId);
        }
        this.stats.activeSubscribers--;
      }
    };
  }

  private async broadcast(message: Message): Promise<void> {
    // Broadcast via WebSocket
    this.wsManager.broadcast(message.type, message);

    // Notify all matching subscribers
    for (const [_, subscriptions] of this.subscribers) {
      for (const subscription of subscriptions) {
        subscription(message);
      }
    }

    // Persist broadcast message
    await this.redis.setKey(
      `broadcast:${message.id}`,
      JSON.stringify(message),
      message.metadata.ttl
    );
  }

  private async deliverToRecipient(message: Message): Promise<void> {
    if (!message.recipient.id) {
      throw new Error('Recipient ID is required for direct messages');
    }

    // Send via WebSocket if recipient is connected
    this.wsManager.sendTo(message.recipient.id, message.type, message);

    // Notify matching subscribers
    const recipientSubs = this.subscribers.get(message.recipient.id);
    if (recipientSubs) {
      for (const subscription of recipientSubs) {
        subscription(message);
      }
    }
  }

  private matchesSubscriptionCriteria(
    message: Message,
    options: SubscriptionOptions
  ): boolean {
    if (options.messageTypes && 
        !options.messageTypes.includes(message.type)) {
      return false;
    }

    if (options.senderTypes && 
        !options.senderTypes.includes(message.sender.type)) {
      return false;
    }

    if (options.priority && 
        message.metadata.priority !== options.priority) {
      return false;
    }

    if (options.correlationId && 
        message.metadata.correlationId !== options.correlationId) {
      return false;
    }

    return true;
  }

  private updateStats(message: Message, startTime: number): void {
    this.stats.totalMessages++;
    
    this.stats.messageTypeDistribution[message.type] = 
      (this.stats.messageTypeDistribution[message.type] || 0) + 1;
    
    const latency = Date.now() - startTime;
    this.stats.averageLatency = 
      (this.stats.averageLatency * (this.stats.totalMessages - 1) + latency) / 
      this.stats.totalMessages;
  }

  private broadcastStats(): void {
    this.wsManager.broadcast('STATS_UPDATE', this.stats);
  }

  public getStats(): MessageBrokerStats {
    return { ...this.stats };
  }

  public async cleanup(): Promise<void> {
    this.wsManager.cleanup();
    this.subscribers.clear();
  }
}