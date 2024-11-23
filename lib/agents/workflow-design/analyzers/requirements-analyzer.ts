import { DesignRequest } from '../types';

interface RequirementAnalysis {
  functional: string[];
  nonFunctional: string[];
  technical: string[];
  business: string[];
  priority: Map<string, number>;
}

export async function analyzeRequirements(request: DesignRequest): Promise<RequirementAnalysis> {
  const analysis: RequirementAnalysis = {
    functional: [],
    nonFunctional: [],
    technical: [],
    business: [],
    priority: new Map(),
  };

  // Categorize requirements
  request.requirements.forEach(req => {
    const requirement = req.toLowerCase();
    const priority = calculatePriority(requirement, request.constraints);
    
    analysis.priority.set(req, priority);

    if (isFunctionalRequirement(requirement)) {
      analysis.functional.push(req);
    } else {
      analysis.nonFunctional.push(req);
    }

    if (isTechnicalRequirement(requirement)) {
      analysis.technical.push(req);
    }

    if (isBusinessRequirement(requirement)) {
      analysis.business.push(req);
    }
  });

  return analysis;
}

function calculatePriority(requirement: string, constraints?: string[]): number {
  let priority = 1;

  // Business impact keywords
  const businessKeywords = ['revenue', 'cost', 'customer', 'critical', 'essential'];
  businessKeywords.forEach(keyword => {
    if (requirement.includes(keyword)) priority += 2;
  });

  // Technical complexity keywords
  const complexityKeywords = ['integration', 'automation', 'real-time', 'scale'];
  complexityKeywords.forEach(keyword => {
    if (requirement.includes(keyword)) priority += 1;
  });

  // Constraint alignment
  if (constraints) {
    constraints.forEach(constraint => {
      if (requirement.includes(constraint.toLowerCase())) {
        priority += 2;
      }
    });
  }

  return Math.min(priority, 10); // Cap priority at 10
}

function isFunctionalRequirement(requirement: string): boolean {
  const functionalKeywords = [
    'must',
    'should',
    'shall',
    'will',
    'process',
    'handle',
    'manage',
    'support',
  ];

  return functionalKeywords.some(keyword => requirement.includes(keyword));
}

function isTechnicalRequirement(requirement: string): boolean {
  const technicalKeywords = [
    'api',
    'database',
    'performance',
    'security',
    'scalability',
    'integration',
    'authentication',
    'protocol',
  ];

  return technicalKeywords.some(keyword => requirement.includes(keyword));
}

function isBusinessRequirement(requirement: string): boolean {
  const businessKeywords = [
    'user',
    'customer',
    'revenue',
    'cost',
    'compliance',
    'regulation',
    'policy',
    'stakeholder',
  ];

  return businessKeywords.some(keyword => requirement.includes(keyword));
}