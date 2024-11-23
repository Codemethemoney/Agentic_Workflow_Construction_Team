export interface DesignRequest {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  constraints?: string[];
  preferences?: {
    technology?: string[];
    architecture?: string[];
    deployment?: string[];
  };
}

export interface SystemComponent {
  id: string;
  name: string;
  type: 'service' | 'database' | 'integration' | 'ui';
  description: string;
  apis?: Array<{
    path: string;
    method: string;
    description: string;
  }>;
  events?: Array<{
    name: string;
    type: string;
    schema: Record<string, any>;
  }>;
  dataStore?: {
    type: string;
    schema: Record<string, any>;
  };
}

export interface IntegrationPlan {
  components: Array<SystemComponent & {
    integrations: string[];
    dataFlow: Record<string, string[]>;
  }>;
  recommendations: string[];
  risks: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
}

export interface CostAnalysis {
  implementation: number;
  operational: number;
  maintenance: number;
  roi: number;
  recommendations: string[];
}

export interface WorkflowDesign {
  id: string;
  name: string;
  description: string;
  components: SystemComponent[];
  integrations: IntegrationPlan;
  costs: CostAnalysis;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}