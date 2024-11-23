import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string(),
  type: z.enum([
    'TASK_UPDATE',
    'KNOWLEDGE_SHARE',
    'STATUS_UPDATE',
    'ERROR_REPORT',
    'WORKFLOW_EVENT',
    'AGENT_DISCOVERY'
  ]),
  sender: z.object({
    id: z.string(),
    type: z.string(),
  }),
  recipient: z.object({
    id: z.string().optional(),
    type: z.string().optional(),
    broadcast: z.boolean().default(false),
  }),
  payload: z.any(),
  metadata: z.object({
    timestamp: z.number(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    correlationId: z.string().optional(),
    ttl: z.number().optional(),
  }),
});

export type Message = z.infer<typeof MessageSchema>;

export interface SubscriptionOptions {
  messageTypes?: string[];
  senderTypes?: string[];
  priority?: 'low' | 'medium' | 'high';
  correlationId?: string;
}

export interface MessageBrokerStats {
  totalMessages: number;
  activeSubscribers: number;
  messageTypeDistribution: Record<string, number>;
  averageLatency: number;
}