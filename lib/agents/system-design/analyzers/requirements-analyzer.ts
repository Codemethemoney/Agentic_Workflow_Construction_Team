import { SystemRequirement } from '../types';

export async function analyzeRequirements(
  rawRequirements: any[]
): Promise<SystemRequirement[]> {
  return rawRequirements.map(req => ({
    type: determineRequirementType(req),
    description: req.description,
    priority: calculatePriority(req),
    constraints: extractConstraints(req),
  }));
}

function determineRequirementType(req: any): 'functional' | 'non-functional' {
  const nfKeywords = [
    'performance',
    'security',
    'scalability',
    'reliability',
    'availability',
  ];

  const description = req.description.toLowerCase();
  return nfKeywords.some(keyword => description.includes(keyword))
    ? 'non-functional'
    : 'functional';
}

function calculatePriority(req: any): 'low' | 'medium' | 'high' {
  const priorityScore = calculatePriorityScore(req);
  
  if (priorityScore >= 8) return 'high';
  if (priorityScore >= 5) return 'medium';
  return 'low';
}

function calculatePriorityScore(req: any): number {
  let score = 0;
  const description = req.description.toLowerCase();

  // Business impact keywords
  const businessKeywords = ['revenue', 'critical', 'essential', 'mandatory'];
  businessKeywords.forEach(keyword => {
    if (description.includes(keyword)) score += 2;
  });

  // Technical complexity keywords
  const complexityKeywords = ['real-time', 'async', 'distributed'];
  complexityKeywords.forEach(keyword => {
    if (description.includes(keyword)) score += 1;
  });

  // Security and compliance keywords
  const securityKeywords = ['security', 'compliance', 'privacy'];
  securityKeywords.forEach(keyword => {
    if (description.includes(keyword)) score += 2;
  });

  return score;
}

function extractConstraints(req: any): string[] {
  const constraints: string[] = [];
  const description = req.description.toLowerCase();

  // Technical constraints
  if (description.includes('performance')) {
    constraints.push('Response time must be under 200ms');
  }

  if (description.includes('scalability')) {
    constraints.push('Must support horizontal scaling');
  }

  if (description.includes('security')) {
    constraints.push('Must implement OAuth 2.0');
    constraints.push('Data must be encrypted at rest and in transit');
  }

  return constraints;
}</content>