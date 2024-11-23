import { SystemRequirement, TechnologyStack } from '../types';

export async function recommendTechStack(
  requirements: SystemRequirement[]
): Promise<TechnologyStack> {
  const stack: TechnologyStack = {
    frontend: [],
    backend: [],
    database: [],
    infrastructure: [],
    tools: [],
  };

  // Analyze requirements and populate technology recommendations
  requirements.forEach(req => {
    if (req.type === 'functional') {
      addFunctionalRequirementTech(req, stack);
    } else {
      addNonFunctionalRequirementTech(req, stack);
    }
  });

  return stack;
}

function addFunctionalRequirementTech(
  requirement: SystemRequirement,
  stack: TechnologyStack
) {
  const description = requirement.description.toLowerCase();

  // Frontend recommendations
  if (description.includes('ui') || description.includes('interface')) {
    stack.frontend?.push('React', 'Next.js');
    stack.frontend?.push('TailwindCSS');
  }

  // Backend recommendations
  if (description.includes('api') || description.includes('service')) {
    stack.backend?.push('Node.js');
    stack.backend?.push('Express.js');
  }

  // Database recommendations
  if (description.includes('data') || description.includes('store')) {
    stack.database?.push('PostgreSQL');
    if (description.includes('cache')) {
      stack.database?.push('Redis');
    }
  }
}

function addNonFunctionalRequirementTech(
  requirement: SystemRequirement,
  stack: TechnologyStack
) {
  const description = requirement.description.toLowerCase();

  // Infrastructure recommendations
  if (description.includes('scalability')) {
    stack.infrastructure?.push('Docker');
    stack.infrastructure?.push('Kubernetes');
  }

  // Security tools
  if (description.includes('security')) {
    stack.tools?.push('JWT');
    stack.tools?.push('OAuth2.0');
  }

  // Monitoring tools
  if (description.includes('monitoring') || description.includes('performance')) {
    stack.tools?.push('Prometheus');
    stack.tools?.push('Grafana');
  }
}</content>