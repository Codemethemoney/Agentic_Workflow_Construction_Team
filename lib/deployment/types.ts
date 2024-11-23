import { z } from 'zod';

export const DeploymentConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  platform: z.enum(['kubernetes', 'aws', 'gcp', 'azure']),
  version: z.string(),
  resources: z.object({
    cpu: z.string(),
    memory: z.string(),
    storage: z.string().optional(),
  }),
  scaling: z.object({
    minReplicas: z.number(),
    maxReplicas: z.number(),
    targetCPUUtilization: z.number(),
  }),
  networking: z.object({
    ingress: z.boolean(),
    ports: z.array(z.number()),
    ssl: z.boolean(),
  }),
  monitoring: z.object({
    logging: z.boolean(),
    metrics: z.boolean(),
    tracing: z.boolean(),
    alerts: z.array(z.object({
      metric: z.string(),
      threshold: z.number(),
      condition: z.string(),
    })).optional(),
  }),
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

export interface BuildConfig {
  dockerfile: string;
  context: string;
  args?: Record<string, string>;
  target?: string;
}

export interface TestConfig {
  unit: boolean;
  integration: boolean;
  e2e: boolean;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

export interface DeploymentResult {
  status: 'success' | 'failure';
  environment: string;
  version: string;
  timestamp: number;
  endpoints?: string[];
  metrics?: {
    buildTime: number;
    deployTime: number;
    testResults?: TestConfig;
  };
  error?: string;
}