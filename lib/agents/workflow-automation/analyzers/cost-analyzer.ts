import { WorkflowDefinition, WorkflowStep } from '../types';

interface CostBreakdown {
  compute: number;
  storage: number;
  network: number;
  external: number;
}

interface CostAnalysis {
  estimated: {
    monthly: number;
    yearly: number;
  };
  breakdown: CostBreakdown;
  recommendations: Array<{
    description: string;
    impact: number;
    difficulty: 'low' | 'medium' | 'high';
  }>;
}

export async function analyzeWorkflowCosts(workflow: WorkflowDefinition): Promise<CostAnalysis> {
  const breakdown = calculateCostBreakdown(workflow);
  const monthly = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    estimated: {
      monthly,
      yearly: monthly * 12,
    },
    breakdown,
    recommendations: generateCostRecommendations(workflow, breakdown),
  };
}

function calculateCostBreakdown(workflow: WorkflowDefinition): CostBreakdown {
  const breakdown: CostBreakdown = {
    compute: 0,
    storage: 0,
    network: 0,
    external: 0,
  };

  workflow.steps.forEach(step => {
    const stepCosts = estimateStepCosts(step);
    Object.keys(breakdown).forEach(key => {
      breakdown[key] += stepCosts[key];
    });
  });

  return breakdown;
}

function estimateStepCosts(step: WorkflowStep): CostBreakdown {
  const costs: CostBreakdown = {
    compute: 0,
    storage: 0,
    network: 0,
    external: 0,
  };

  switch (step.type) {
    case 'agent-task':
      costs.compute = 10; // Base compute cost
      costs.storage = 5; // Storage for task results
      break;
    case 'transformation':
      costs.compute = 5;
      break;
    case 'condition':
      costs.compute = 2;
      break;
  }

  // Add network costs for steps with external communication
  if (step.config.agentId) {
    costs.network += 5;
  }

  // Add external costs for API calls or third-party services
  if (step.type === 'agent-task' && step.config.external) {
    costs.external += 20;
  }

  return costs;
}

function generateCostRecommendations(
  workflow: WorkflowDefinition,
  costs: CostBreakdown
): Array<{ description: string; impact: number; difficulty: 'low' | 'medium' | 'high' }> {
  const recommendations = [];

  // Analyze compute costs
  if (costs.compute > 100) {
    recommendations.push({
      description: 'Implement task batching to reduce compute costs',
      impact: 30,
      difficulty: 'medium',
    });
  }

  // Analyze network costs
  if (costs.network > 50) {
    recommendations.push({
      description: 'Optimize data transfer between steps',
      impact: 20,
      difficulty: 'low',
    });
  }

  // Analyze external service usage
  if (costs.external > 200) {
    recommendations.push({
      description: 'Consider implementing local alternatives for external services',
      impact: 50,
      difficulty: 'high',
    });
  }

  // Analyze workflow structure
  if (workflow.steps.length > 10) {
    recommendations.push({
      description: 'Consolidate similar steps to reduce overhead',
      impact: 15,
      difficulty: 'medium',
    });
  }

  return recommendations;
}