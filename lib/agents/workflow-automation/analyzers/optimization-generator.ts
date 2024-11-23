import { WorkflowDefinition, WorkflowStep } from '../types';

interface Optimization {
  type: 'performance' | 'reliability' | 'cost' | 'maintainability';
  description: string;
  impact: string;
  priority: 'low' | 'medium' | 'high';
  implementation: string;
}

export async function generateOptimizations(
  workflow: WorkflowDefinition
): Promise<Optimization[]> {
  const optimizations: Optimization[] = [];

  // Analyze workflow structure
  optimizations.push(...analyzeStructure(workflow));

  // Analyze error handling
  optimizations.push(...analyzeErrorHandling(workflow));

  // Analyze performance
  optimizations.push(...analyzePerformance(workflow));

  // Analyze maintainability
  optimizations.push(...analyzeMaintainability(workflow));

  return optimizations;
}

function analyzeStructure(workflow: WorkflowDefinition): Optimization[] {
  const optimizations: Optimization[] = [];

  // Check for parallel execution opportunities
  const independentSteps = findIndependentSteps(workflow.steps);
  if (independentSteps.length > 1) {
    optimizations.push({
      type: 'performance',
      description: 'Parallelize independent steps',
      impact: `Potential ${independentSteps.length * 20}% performance improvement`,
      priority: 'high',
      implementation: 'Update step configuration to enable parallel execution',
    });
  }

  // Check for redundant steps
  const redundantSteps = findRedundantSteps(workflow.steps);
  if (redundantSteps.length > 0) {
    optimizations.push({
      type: 'maintainability',
      description: 'Consolidate redundant steps',
      impact: 'Improved workflow clarity and reduced maintenance overhead',
      priority: 'medium',
      implementation: 'Merge similar steps using shared configuration',
    });
  }

  return optimizations;
}

function analyzeErrorHandling(workflow: WorkflowDefinition): Optimization[] {
  const optimizations: Optimization[] = [];

  // Check retry policies
  const stepsWithoutRetry = workflow.steps.filter(
    step => !step.config.retryPolicy
  );
  if (stepsWithoutRetry.length > 0) {
    optimizations.push({
      type: 'reliability',
      description: 'Add retry policies for error-prone steps',
      impact: 'Improved workflow reliability and error recovery',
      priority: 'high',
      implementation: 'Configure retry policies with exponential backoff',
    });
  }

  // Check error handling coverage
  const stepsWithoutErrorHandler = workflow.steps.filter(
    step => !step.onError
  );
  if (stepsWithoutErrorHandler.length > 0) {
    optimizations.push({
      type: 'reliability',
      description: 'Add error handlers for all critical steps',
      impact: 'Better error management and recovery options',
      priority: 'medium',
      implementation: 'Define fallback actions for error scenarios',
    });
  }

  return optimizations;
}

function analyzePerformance(workflow: WorkflowDefinition): Optimization[] {
  const optimizations: Optimization[] = [];

  // Check for potential bottlenecks
  const potentialBottlenecks = findBottlenecks(workflow.steps);
  if (potentialBottlenecks.length > 0) {
    optimizations.push({
      type: 'performance',
      description: 'Optimize identified bottleneck steps',
      impact: 'Reduced workflow execution time',
      priority: 'high',
      implementation: 'Implement caching and optimize data processing',
    });
  }

  // Check for resource utilization
  if (workflow.steps.length > 5) {
    optimizations.push({
      type: 'cost',
      description: 'Optimize resource allocation',
      impact: 'Reduced operational costs',
      priority: 'medium',
      implementation: 'Implement dynamic resource scaling',
    });
  }

  return optimizations;
}

function analyzeMaintainability(workflow: WorkflowDefinition): Optimization[] {
  const optimizations: Optimization[] = [];

  // Check workflow complexity
  if (workflow.steps.length > 10) {
    optimizations.push({
      type: 'maintainability',
      description: 'Break down complex workflow into sub-workflows',
      impact: 'Improved maintainability and reusability',
      priority: 'medium',
      implementation: 'Create modular sub-workflows for logical groupings',
    });
  }

  // Check documentation
  if (!workflow.metadata?.documentation) {
    optimizations.push({
      type: 'maintainability',
      description: 'Add comprehensive workflow documentation',
      impact: 'Better workflow understanding and maintenance',
      priority: 'low',
      implementation: 'Document step purposes and dependencies',
    });
  }

  return optimizations;
}

function findIndependentSteps(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.filter(step => 
    !steps.some(otherStep => 
      otherStep.next.includes(step.id)
    )
  );
}

function findRedundantSteps(steps: WorkflowStep[]): WorkflowStep[] {
  const redundant: WorkflowStep[] = [];
  const stepTypes = new Map<string, WorkflowStep[]>();

  steps.forEach(step => {
    const key = `${step.type}-${JSON.stringify(step.config)}`;
    if (!stepTypes.has(key)) {
      stepTypes.set(key, []);
    }
    stepTypes.get(key)!.push(step);
  });

  stepTypes.forEach(similarSteps => {
    if (similarSteps.length > 1) {
      redundant.push(...similarSteps.slice(1));
    }
  });

  return redundant;
}

function findBottlenecks(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.filter(step => {
    // Check if step has many incoming connections
    const incomingCount = steps.filter(s => 
      s.next.includes(step.id)
    ).length;

    // Check if step has complex processing
    const isComplex = step.type === 'agent-task' || 
      (step.config.transformation && step.config.transformation.includes('complex'));

    return incomingCount > 2 || isComplex;
  });
}