import { z } from 'zod';

export const LanguageConfigSchema = z.object({
  version: z.string(),
  framework: z.string().optional(),
  dependencies: z.record(z.string()),
  devDependencies: z.record(z.string()).optional(),
  formatting: z.object({
    indentSize: z.number(),
    useTabs: z.boolean(),
    lineWidth: z.number(),
  }).optional(),
  linting: z.object({
    rules: z.record(z.union([z.string(), z.number()])),
  }).optional(),
});

export const DeploymentConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  docker: z.object({
    baseImage: z.string(),
    expose: z.array(z.number()),
    env: z.record(z.string()),
  }),
  resources: z.object({
    cpu: z.string(),
    memory: z.string(),
    storage: z.string().optional(),
  }),
  scaling: z.object({
    minReplicas: z.number(),
    maxReplicas: z.number(),
    targetCPUUtilization: z.number(),
  }).optional(),
});

export type LanguageConfig = z.infer<typeof LanguageConfigSchema>;
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

export interface CodeGenerationResult {
  id: string;
  language: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  config: LanguageConfig;
  metadata: {
    generatedAt: number;
    framework?: string;
    dependencies: Record<string, string>;
  };
}

export interface DeploymentResult {
  id: string;
  environment: string;
  status: 'success' | 'failure';
  artifacts: {
    dockerfile?: string;
    configFiles: Record<string, string>;
    scripts: Record<string, string>;
  };
  metadata: {
    deployedAt: number;
    version: string;
    resources: Record<string, string>;
  };
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}