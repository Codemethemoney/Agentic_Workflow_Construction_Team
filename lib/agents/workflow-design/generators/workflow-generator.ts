import { v4 as uuidv4 } from 'uuid';
import { WorkflowDesign, SystemComponent } from '../types';

interface RequirementAnalysis {
  functional: string[];
  nonFunctional: string[];
  technical: string[];
  business: string[];
  priority: Map<string, number>;
}

export async function generateWorkflowDesign(
  analysis: RequirementAnalysis
): Promise<WorkflowDesign> {
  const components = generateComponents(analysis);
  
  const design: WorkflowDesign = {
    id: uuidv4(),
    name: 'Generated Workflow Design',
    description: generateDescription(analysis),
    components,
    integrations: {
      components: components.map(component => ({
        ...component,
        integrations: identifyIntegrationPoints(component),
        dataFlow: analyzeDataFlow(component),
      })),
      recommendations: generateRecommendations(analysis, components),
      risks: identifyRisks(analysis, components),
    },
    costs: {
      implementation: estimateImplementationCost(components),
      operational: estimateOperationalCost(components),
      maintenance: estimateMaintenanceCost(components),
      roi: 0, // Will be calculated later
      recommendations: [],
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0',
    },
  };

  // Calculate ROI
  design.costs.roi = calculateROI(design.costs);
  design.costs.recommendations = generateCostRecommendations(design.costs);

  return design;
}

function generateComponents(analysis: RequirementAnalysis): SystemComponent[] {
  const components: SystemComponent[] = [];

  // API Gateway if there are external integrations
  if (analysis.technical.some(req => req.includes('api') || req.includes('integration'))) {
    components.push(generateAPIGateway());
  }

  // Authentication Service if security is mentioned
  if (analysis.technical.some(req => req.includes('security') || req.includes('auth'))) {
    components.push(generateAuthService());
  }

  // Data Store if data persistence is needed
  if (analysis.technical.some(req => req.includes('data') || req.includes('storage'))) {
    components.push(generateDataStore());
  }

  // Business Logic Services
  analysis.functional.forEach(req => {
    if (shouldCreateServiceComponent(req)) {
      components.push(generateServiceComponent(req));
    }
  });

  return components;
}

function generateAPIGateway(): SystemComponent {
  return {
    id: uuidv4(),
    name: 'API Gateway',
    type: 'integration',
    description: 'Central API Gateway for managing external requests',
    apis: [
      {
        path: '/api/v1/*',
        method: 'ANY',
        description: 'API Gateway proxy endpoint',
      },
    ],
  };
}

function generateAuthService(): SystemComponent {
  return {
    id: uuidv4(),
    name: 'Authentication Service',
    type: 'service',
    description: 'Handles user authentication and authorization',
    apis: [
      {
        path: '/auth/login',
        method: 'POST',
        description: 'User login endpoint',
      },
      {
        path: '/auth/verify',
        method: 'POST',
        description: 'Token verification endpoint',
      },
    ],
    dataStore: {
      type: 'database',
      schema: {
        users: {
          id: 'string',
          username: 'string',
          password: 'string',
          roles: 'string[]',
        },
      },
    },
  };
}

function generateDataStore(): SystemComponent {
  return {
    id: uuidv4(),
    name: 'Data Store',
    type: 'database',
    description: 'Central data storage system',
    dataStore: {
      type: 'postgresql',
      schema: {
        // Schema will be generated based on requirements
      },
    },
  };
}

function generateServiceComponent(requirement: string): SystemComponent {
  return {
    id: uuidv4(),
    name: `${capitalizeFirst(requirement.split(' ')[0])} Service`,
    type: 'service',
    description: `Handles ${requirement}`,
    apis: [
      {
        path: `/api/v1/${requirement.split(' ')[0].toLowerCase()}`,
        method: 'POST',
        description: `Endpoint for ${requirement}`,
      },
    ],
    events: [
      {
        name: `${requirement.split(' ')[0].toLowerCase()}.completed`,
        type: 'event',
        schema: {},
      },
    ],
  };
}

function shouldCreateServiceComponent(requirement: string): boolean {
  const serviceKeywords = ['process', 'handle', 'manage', 'calculate', 'generate'];
  return serviceKeywords.some(keyword => requirement.toLowerCase().includes(keyword));
}

function generateDescription(analysis: RequirementAnalysis): string {
  return `Workflow design generated based on ${analysis.functional.length} functional and ${analysis.nonFunctional.length} non-functional requirements.`;
}

function identifyIntegrationPoints(component: SystemComponent): string[] {
  const points = [];
  
  if (component.apis?.length > 0) {
    points.push('API Gateway');
  }
  
  if (component.events?.length > 0) {
    points.push('Event Bus');
  }
  
  if (component.dataStore) {
    points.push('Data Layer');
  }
  
  return points;
}

function analyzeDataFlow(component: SystemComponent): Record<string, string[]> {
  return {
    inputs: component.apis?.filter(api => api.method !== 'GET').map(api => api.path) || [],
    outputs: component.apis?.filter(api => api.method === 'GET').map(api => api.path) || [],
    events: component.events?.map(event => event.name) || [],
  };
}

function generateRecommendations(
  analysis: RequirementAnalysis,
  components: SystemComponent[]
): string[] {
  const recommendations = [];

  if (components.length > 3) {
    recommendations.push('Consider implementing service discovery');
  }

  if (analysis.technical.some(req => req.includes('scale'))) {
    recommendations.push('Implement horizontal scaling capabilities');
  }

  return recommendations;
}

function identifyRisks(
  analysis: RequirementAnalysis,
  components: SystemComponent[]
): Array<{ risk: string; severity: 'low' | 'medium' | 'high'; mitigation: string }> {
  const risks = [];

  if (components.length > 5) {
    risks.push({
      risk: 'System complexity',
      severity: 'medium',
      mitigation: 'Implement proper service documentation and monitoring',
    });
  }

  if (analysis.technical.some(req => req.includes('security'))) {
    risks.push({
      risk: 'Security vulnerabilities',
      severity: 'high',
      mitigation: 'Regular security audits and penetration testing',
    });
  }

  return risks;
}

function estimateImplementationCost(components: SystemComponent[]): number {
  return components.length * 50000; // Simplified estimation
}

function estimateOperationalCost(components: SystemComponent[]): number {
  return components.length * 2000; // Monthly operational cost
}

function estimateMaintenanceCost(components: SystemComponent[]): number {
  return components.length * 1000; // Monthly maintenance cost
}

function calculateROI(costs: any): number {
  const totalCost = costs.implementation + (costs.operational + costs.maintenance) * 12;
  const estimatedBenefit = totalCost * 1.5; // Simplified benefit calculation
  return ((estimatedBenefit - totalCost) / totalCost) * 100;
}

function generateCostRecommendations(costs: any): string[] {
  const recommendations = [];

  if (costs.operational > costs.implementation * 0.3) {
    recommendations.push('Consider serverless architecture for cost optimization');
  }

  if (costs.maintenance > costs.implementation * 0.2) {
    recommendations.push('Implement automated testing and monitoring');
  }

  return recommendations;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}