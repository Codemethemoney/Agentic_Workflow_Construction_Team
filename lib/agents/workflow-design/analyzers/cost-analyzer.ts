import { WorkflowDesign, CostAnalysis } from '../types';

export async function calculateCosts(design: WorkflowDesign): Promise<CostAnalysis> {
  const implementation = calculateImplementationCosts(design);
  const operational = calculateOperationalCosts(design);
  const maintenance = calculateMaintenanceCosts(design);
  
  const analysis: CostAnalysis = {
    implementation,
    operational,
    maintenance,
    roi: calculateROI(implementation, operational, maintenance),
    recommendations: generateRecommendations(implementation, operational, maintenance),
  };

  return analysis;
}

function calculateImplementationCosts(design: WorkflowDesign): number {
  let total = 0;
  
  // Base cost per component
  design.components.forEach(component => {
    switch (component.type) {
      case 'service':
        total += 50000; // Base service cost
        if (component.apis?.length) {
          total += component.apis.length * 5000; // API development cost
        }
        break;
      case 'database':
        total += 30000; // Base database cost
        break;
      case 'integration':
        total += 40000; // Base integration cost
        break;
      case 'ui':
        total += 45000; // Base UI cost
        break;
    }
  });

  // Integration complexity costs
  total += design.integrations.components.length * 10000;

  // Risk mitigation costs
  total += design.integrations.risks.reduce((acc, risk) => {
    switch (risk.severity) {
      case 'high':
        return acc + 20000;
      case 'medium':
        return acc + 10000;
      case 'low':
        return acc + 5000;
    }
  }, 0);

  return total;
}

function calculateOperationalCosts(design: WorkflowDesign): number {
  let monthlyTotal = 0;

  // Infrastructure costs
  design.components.forEach(component => {
    switch (component.type) {
      case 'service':
        monthlyTotal += 500; // Base service hosting
        break;
      case 'database':
        monthlyTotal += 200; // Base database hosting
        break;
      case 'integration':
        monthlyTotal += 300; // Integration platform costs
        break;
      case 'ui':
        monthlyTotal += 100; // UI hosting
        break;
    }
  });

  // Monitoring and logging costs
  monthlyTotal += design.components.length * 50;

  // Support and maintenance staff
  monthlyTotal += Math.ceil(design.components.length / 4) * 8000;

  return monthlyTotal;
}

function calculateMaintenanceCosts(design: WorkflowDesign): number {
  let monthlyTotal = 0;

  // Regular updates and patches
  design.components.forEach(component => {
    switch (component.type) {
      case 'service':
        monthlyTotal += 300; // Service maintenance
        break;
      case 'database':
        monthlyTotal += 200; // Database maintenance
        break;
      case 'integration':
        monthlyTotal += 250; // Integration maintenance
        break;
      case 'ui':
        monthlyTotal += 150; // UI maintenance
        break;
    }
  });

  // Technical debt management
  monthlyTotal += design.components.length * 100;

  // Documentation and training
  monthlyTotal += Math.ceil(design.components.length / 5) * 1000;

  return monthlyTotal;
}

function calculateROI(
  implementation: number,
  operational: number,
  maintenance: number
): number {
  const annualCost = implementation + (operational + maintenance) * 12;
  const estimatedAnnualBenefit = calculateEstimatedBenefit(annualCost);
  return ((estimatedAnnualBenefit - annualCost) / annualCost) * 100;
}

function calculateEstimatedBenefit(totalCost: number): number {
  // Simplified benefit calculation
  // Assumes ROI of 50% over total cost
  return totalCost * 1.5;
}

function generateRecommendations(
  implementation: number,
  operational: number,
  maintenance: number
): string[] {
  const recommendations: string[] = [];

  // Implementation cost optimizations
  if (implementation > 500000) {
    recommendations.push('Consider phased implementation approach');
    recommendations.push('Evaluate build vs. buy decisions for components');
  }

  // Operational cost optimizations
  if (operational > implementation * 0.02) {
    recommendations.push('Investigate serverless architecture options');
    recommendations.push('Optimize resource allocation and scaling policies');
  }

  // Maintenance cost optimizations
  if (maintenance > implementation * 0.01) {
    recommendations.push('Implement comprehensive automated testing');
    recommendations.push('Establish proactive monitoring and alerting');
  }

  return recommendations;
}