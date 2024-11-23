import { BaseAgent } from '../base-agent';
import { AgentTask, AgentResult } from '../types';
import { VectorStore } from '@/lib/storage/vector-store';
import { WorkflowDefinition } from './types';
import { analyzeWorkflowCosts } from './analyzers/cost-analyzer';
import { generateOptimizations } from './analyzers/optimization-generator';
import { findSimilarWorkflows } from './analyzers/similarity-analyzer';

export class AutomationArchitectAgent extends BaseAgent {
  private vectorStore: VectorStore;
  private workflowCache: Map<string, WorkflowDefinition>;

  constructor(id: string) {
    super(id, 'automation-architect');
    this.workflowCache = new Map();
  }

  async initialize(): Promise<void> {
    this.vectorStore = await VectorStore.getInstance();
  }

  public async processTask(task: AgentTask): Promise<AgentResult> {
    this.status = 'busy';

    try {
      switch (task.data.action) {
        case 'analyze_workflow':
          return await this.analyzeWorkflow(task.data.workflow);
        case 'suggest_optimizations':
          return await this.suggestOptimizations(task.data.workflow);
        case 'find_similar_workflows':
          return await this.findSimilarWorkflows(task.data.workflow);
        case 'estimate_costs':
          return await this.estimateCosts(task.data.workflow);
        default:
          throw new Error(`Unsupported action: ${task.data.action}`);
      }
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failure',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.status = 'idle';
    }
  }

  private async analyzeWorkflow(workflow: WorkflowDefinition): Promise<AgentResult> {
    const analysis = {
      complexity: this.calculateComplexity(workflow),
      costs: await analyzeWorkflowCosts(workflow),
      optimizations: await generateOptimizations(workflow),
      similarWorkflows: await findSimilarWorkflows(workflow, this.vectorStore),
    };

    await this.storeAnalysis(workflow.id, analysis);

    return {
      taskId: workflow.id,
      status: 'success',
      data: analysis,
    };
  }

  private async suggestOptimizations(workflow: WorkflowDefinition): Promise<AgentResult> {
    const optimizations = await generateOptimizations(workflow);
    const similarWorkflows = await findSimilarWorkflows(workflow, this.vectorStore);

    const suggestions = {
      immediate: optimizations.filter(opt => opt.priority === 'high'),
      recommended: optimizations.filter(opt => opt.priority === 'medium'),
      optional: optimizations.filter(opt => opt.priority === 'low'),
      examples: similarWorkflows.map(w => ({
        id: w.id,
        name: w.name,
        relevance: w.similarity,
        improvements: w.improvements,
      })),
    };

    return {
      taskId: workflow.id,
      status: 'success',
      data: suggestions,
    };
  }

  private async findSimilarWorkflows(workflow: WorkflowDefinition): Promise<AgentResult> {
    const similar = await findSimilarWorkflows(workflow, this.vectorStore);
    
    return {
      taskId: workflow.id,
      status: 'success',
      data: similar.map(w => ({
        id: w.id,
        name: w.name,
        similarity: w.similarity,
        learnings: w.improvements,
      })),
    };
  }

  private async estimateCosts(workflow: WorkflowDefinition): Promise<AgentResult> {
    const costs = await analyzeWorkflowCosts(workflow);
    
    return {
      taskId: workflow.id,
      status: 'success',
      data: {
        estimated: costs.estimated,
        breakdown: costs.breakdown,
        recommendations: costs.recommendations,
      },
    };
  }

  private calculateComplexity(workflow: WorkflowDefinition): {
    score: number;
    factors: string[];
  } {
    let score = 0;
    const factors: string[] = [];

    // Analyze steps
    score += workflow.steps.length * 2;
    if (workflow.steps.length > 10) {
      factors.push('High number of steps');
    }

    // Analyze triggers
    score += workflow.triggers.length * 1.5;
    if (workflow.triggers.length > 3) {
      factors.push('Multiple triggers');
    }

    // Analyze error handling
    if (workflow.errorHandling.fallbackActions.length > 0) {
      score += workflow.errorHandling.fallbackActions.length;
      factors.push('Complex error handling');
    }

    // Analyze step dependencies
    const dependencies = new Set<string>();
    workflow.steps.forEach(step => {
      step.next.forEach(nextId => dependencies.add(`${step.id}-${nextId}`));
    });
    score += dependencies.size;
    if (dependencies.size > workflow.steps.length) {
      factors.push('Complex step dependencies');
    }

    return {
      score,
      factors,
    };
  }

  private async storeAnalysis(workflowId: string, analysis: any): Promise<void> {
    await this.vectorStore.addDocument({
      id: `analysis-${workflowId}`,
      content: JSON.stringify(analysis),
      metadata: {
        type: 'workflow-analysis',
        workflowId,
        timestamp: Date.now(),
      },
    });
  }

  public async cleanup(): Promise<void> {
    this.workflowCache.clear();
  }
}