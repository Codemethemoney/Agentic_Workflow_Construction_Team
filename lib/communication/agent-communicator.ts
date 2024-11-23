import { v4 as uuidv4 } from 'uuid';
import { Message, SubscriptionOptions } from './types';
import { MessageBroker } from './message-broker';
import { VectorStore } from '../storage/vector-store';

export class AgentCommunicator {
  private agentId: string;
  private agentType: string;
  private messageBroker: MessageBroker;
  private vectorStore: VectorStore;
  private subscriptions: Set<() => void>;

  constructor(agentId: string, agentType: string) {
    this.agentId = agentId;
    this.agentType = agentType;
    this.messageBroker = MessageBroker.getInstance();
    this.vectorStore = VectorStore.getInstance();
    this.subscriptions = new Set();
  }

  public async sendMessage(
    message: Omit<Message, 'id' | 'sender' | 'metadata'>
  ): Promise<void> {
    const fullMessage: Message = {
      id: uuidv4(),
      sender: {
        id: this.agentId,
        type: this.agentType,
      },
      ...message,
      metadata: {
        timestamp: Date.now(),
        priority: message.metadata?.priority || 'medium',
        correlationId: message.metadata?.correlationId,
        ttl: message.metadata?.ttl,
      },
    };

    await this.messageBroker.publish(fullMessage);

    // Store important messages in vector store for future reference
    if (this.shouldStoreMessage(fullMessage)) {
      await this.storeMessage(fullMessage);
    }
  }

  public subscribe(
    callback: (message: Message) => void,
    options: SubscriptionOptions = {}
  ): void {
    const unsubscribe = this.messageBroker.subscribe(callback, {
      ...options,
      senderTypes: options.senderTypes || [this.agentType],
    });
    this.subscriptions.add(unsubscribe);
  }

  public async shareKnowledge(
    knowledge: any,
    recipients?: { id?: string; type?: string }[]
  ): Promise<void> {
    await this.sendMessage({
      type: 'KNOWLEDGE_SHARE',
      recipient: {
        broadcast: !recipients,
        ...(recipients?.[0] || {}),
      },
      payload: knowledge,
      metadata: {
        priority: 'medium',
        ttl: 24 * 60 * 60, // 24 hours
      },
    });
  }

  public async reportStatus(status: any): Promise<void> {
    await this.sendMessage({
      type: 'STATUS_UPDATE',
      recipient: { broadcast: true },
      payload: status,
      metadata: {
        priority: 'low',
      },
    });
  }

  public async reportError(error: Error): Promise<void> {
    await this.sendMessage({
      type: 'ERROR_REPORT',
      recipient: { broadcast: true },
      payload: {
        error: error.message,
        stack: error.stack,
      },
      metadata: {
        priority: 'high',
      },
    });
  }

  private shouldStoreMessage(message: Message): boolean {
    return (
      message.type === 'KNOWLEDGE_SHARE' ||
      message.type === 'ERROR_REPORT' ||
      message.metadata.priority === 'high'
    );
  }

  private async storeMessage(message: Message): Promise<void> {
    await this.vectorStore.addDocument({
      id: message.id,
      content: JSON.stringify(message),
      metadata: {
        type: 'agent-message',
        messageType: message.type,
        senderId: message.sender.id,
        senderType: message.sender.type,
        timestamp: message.metadata.timestamp,
      },
    });
  }

  public cleanup(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions.clear();
  }
}