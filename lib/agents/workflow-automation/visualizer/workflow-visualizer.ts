import { WorkflowDefinition, WorkflowState, WorkflowStep } from '../types';

export interface VisualizationNode {
  id: string;
  label: string;
  type: string;
  status?: string;
  metrics?: {
    executionTime?: number;
    failureRate?: number;
  };
}

export interface VisualizationEdge {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export class WorkflowVisualizer {
  generateVisualization(
    workflow: WorkflowDefinition,
    state?: WorkflowState
  ): { nodes: VisualizationNode[]; edges: VisualizationEdge[] } {
    const nodes = this.generateNodes(workflow, state);
    const edges = this.generateEdges(workflow);

    return { nodes, edges };
  }

  private generateNodes(
    workflow: WorkflowDefinition,
    state?: WorkflowState
  ): VisualizationNode[] {
    return workflow.steps.map(step => ({
      id: step.id,
      label: step.name,
      type: step.type,
      status: state?.steps[step.id]?.status,
      metrics: state?.steps[step.id] ? {
        executionTime: 
          state.steps[step.id].endTime! - state.steps[step.id].startTime!,
        failureRate: state.steps[step.id].attempts > 1 ? 
          (state.steps[step.id].attempts - 1) / state.steps[step.id].attempts : 0
      } : undefined
    }));
  }

  private generateEdges(workflow: WorkflowDefinition): VisualizationEdge[] {
    const edges: VisualizationEdge[] = [];

    workflow.steps.forEach(step => {
      if (step.type === 'condition') {
        // Add true/false branches for conditions
        edges.push(
          {
            from: step.id,
            to: step.next[0],
            label: 'True',
            condition: step.config.condition
          },
          {
            from: step.id,
            to: step.next[1],
            label: 'False'
          }
        );
      } else {
        // Add normal flow edges
        step.next.forEach(nextId => {
          edges.push({
            from: step.id,
            to: nextId
          });
        });
      }

      // Add error handling edges
      if (step.onError) {
        edges.push({
          from: step.id,
          to: step.onError,
          label: 'Error'
        });
      }
    });

    return edges;
  }
}