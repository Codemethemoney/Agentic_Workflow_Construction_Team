export interface CodeGenerationConfig {
  language: 'typescript' | 'javascript' | 'python';
  framework?: string;
  testing?: boolean;
  linting?: boolean;
  documentation?: boolean;
  optimization?: {
    minify?: boolean;
    treeshaking?: boolean;
    bundling?: boolean;
  };
}

export interface APIIntegration {
  name: string;
  type: 'rest' | 'graphql' | 'grpc';
  config: {
    baseUrl?: string;
    authentication?: {
      type: 'bearer' | 'apiKey' | 'oauth2';
      config: Record<string, string>;
    };
    endpoints?: Array<{
      path: string;
      method: string;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    }>;
  };
}

export interface WorkflowStep {
  id: string;
  name?: string;
  type: 'api' | 'transformation' | 'condition' | 'loop' | 'database' | 'authentication';
  config: Record<string, any>;
  next?: string[];
  error?: string[];
  retry?: {
    maxAttempts: number;
    backoff: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface GeneratedCode {
  language: string;
  framework?: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  dependencies: Record<string, string>;
  scripts?: Record<string, string>;
  documentation?: Array<{
    type: string;
    content: string;
  }>;
}

export interface TestResult {
  passed: boolean;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  failures?: Array<{
    file: string;
    message: string;
    line?: number;
  }>;
  duration: number;
  timestamp: number;
}

export interface DeploymentConfig {
  platform: 'aws' | 'gcp' | 'azure' | 'kubernetes';
  environment: 'development' | 'staging' | 'production';
  resources: {
    cpu?: string;
    memory?: string;
    storage?: string;
  };
  scaling?: {
    min: number;
    max: number;
    targetCpu?: number;
  };
  networking?: {
    ingress?: boolean;
    ports?: number[];
    ssl?: boolean;
  };
  monitoring?: {
    logging: boolean;
    metrics: boolean;
    alerts?: Array<{
      metric: string;
      threshold: number;
      condition: string;
    }>;
  };
}