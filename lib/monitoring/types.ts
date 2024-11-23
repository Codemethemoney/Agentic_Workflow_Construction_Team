import { z } from 'zod';

export const MetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  type: z.enum(['counter', 'gauge', 'histogram']),
  labels: z.record(z.string()).optional(),
  timestamp: z.number(),
});

export type Metric = z.infer<typeof MetricSchema>;

export interface AgentMetrics {
  taskCount: number;
  successRate: number;
  averageProcessingTime: number;
  errorRate: number;
  memoryUsage: number;
  lastActive: number;
}

export interface SystemMetrics {
  activeAgents: number;
  totalTasks: number;
  queuedTasks: number;
  systemLoad: number;
  memoryUsage: number;
  errorCount: number;
}

export interface MetricsQuery {
  name?: string;
  type?: string;
  from?: number;
  to?: number;
  labels?: Record<string, string>;
  aggregation?: 'sum' | 'avg' | 'min' | 'max';
  interval?: string;
}

export interface Alert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  status: 'active' | 'resolved';
  triggeredAt: number;
  resolvedAt?: number;
  labels: Record<string, string>;
}