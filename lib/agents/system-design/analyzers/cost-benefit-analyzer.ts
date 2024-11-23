import { SystemRequirement, TechnologyStack, CostBenefitAnalysis } from '../types';

export async function analyzeCostBenefit(
  requirements: SystemRequirement[],
  techStack: TechnologyStack
): Promise<CostBenefitAnalysis> {
  const implementation = calculateImplementation(requirements, techStack);
  const benefits = identifyBenefits(requirements);
  const risks = assessRisks(requirements, techStack);

  return {
    implementation,
    benefits,
    risks,
  };
}

function calculateImplementation(
  requirements: SystemRequirement[],
  techStack: TechnologyStack
): CostBenefitAnalysis['implementation'] {
  let complexity: 'low' | 'medium' | 'high' = 'low';
  let timeInWeeks = 0;
  let costPerWeek = 10000; // Base cost per week per developer

  // Calculate complexity
  const complexityScore = calculateComplexityScore(requirements, techStack);
  if (complexityScore > 7) complexity = 'high';
  else if (complexityScore > 4) complexity = 'medium';

  // Calculate time
  timeInWeeks = Math.ceil(complexityScore * 2); // 2 weeks per complexity point

  return {
    time: `${timeInWeeks} weeks`,
    cost: timeInWeeks * costPerWeek,
    complexity,
  };
}

function calculateComplexityScore(
  requirements: SystemRequirement[],
  techStack: TechnologyStack
): number {
  let score = 0;

  // Add points for each requirement based on priority
  requirements.forEach(req => {
    if (req.priority === 'high') score += 2;
    else if (req.priority === 'medium') score += 1;
  });

  // Add points for tech stack complexity
  const techCount = Object.values(techStack).flat().length;
  score += Math.ceil(techCount / 4); // 1 point per 4 technologies

  return score;
}

function identifyBenefits(
  requirements: SystemRequirement[]
): CostBenefitAnalysis['benefits'] {
  const benefits: CostBenefitAnalysis['benefits'] = [];

  requirements.forEach(req => {
    const benefit = deriveBenefitFromRequirement(req);
    if (benefit) {
      benefits.push(benefit);
    }
  });

  return benefits;
}

function deriveBenefitFromRequirement(
  requirement: SystemRequirement
): { description: string; impact: 'low' | 'medium' | 'high' } | null {
  const description = requirement.description.toLowerCase();

  if (description.includes('performance')) {
    return {
      description: 'Improved system performance and user experience',
      impact: requirement.priority,
    };
  }

  if (description.includes('security')) {
    return {
      description: 'Enhanced security and data protection',
      impact: 'high',
    };
  }

  if (description.includes('scalability')) {
    return {
      description: 'Better system scalability and resource utilization',
      impact: requirement.priority,
    };
  }

  return null;
}

function assessRisks(
  requirements: SystemRequirement[],
  techStack: TechnologyStack
): CostBenefitAnalysis['risks'] {
  const risks: CostBenefitAnalysis['risks'] = [];

  // Assess technical risks
  if (techStack.frontend?.length || techStack.backend?.length) {
    risks.push({
      description: 'Technical complexity and integration challenges',
      severity: 'medium',
      mitigation: 'Implement proper testing and CI/CD pipeline',
    });
  }

  // Assess security risks
  if (requirements.some(req => req.description.toLowerCase().includes('security'))) {
    risks.push({
      description: 'Security vulnerabilities and data breaches',
      severity: 'high',
      mitigation: 'Regular security audits and penetration testing',
    });
  }

  // Assess scalability risks
  if (requirements.some(req => req.description.toLowerCase().includes('scalability'))) {
    risks.push({
      description: 'Scalability and performance bottlenecks',
      severity: 'medium',
      mitigation: 'Load testing and performance monitoring',
    });
  }

  return risks;
}</content>