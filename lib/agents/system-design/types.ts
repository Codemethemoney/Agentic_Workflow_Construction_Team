export interface SystemRequirement {
  type: 'functional' | 'non-functional';
  description: string;
  priority: 'low' | 'medium' | 'high';
  constraints?: string[];
}

export interface TechnologyStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  infrastructure?: string[];
  tools?: string[];
}

export interface CostBenefitAnalysis {
  implementation: {
    time: string;
    cost: number;
    complexity: 'low' | 'medium' | 'high';
  };
  benefits: {
    description: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  risks: {
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
}

export interface SystemDesign {
  requirements: SystemRequirement[];
  architecture: {
    components: string[];
    interactions: Array<{
      from: string;
      to: string;
      type: string;
    }>;
  };
  techStack: TechnologyStack;
  costBenefit: CostBenefitAnalysis;
}</content>