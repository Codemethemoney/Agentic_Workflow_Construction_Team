import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from 'react-flow-renderer';
import { WorkflowDefinition, WorkflowTrigger } from '../agents/workflow-automation/types';

interface WorkflowState {
  workflows: WorkflowDefinition[];
  selectedWorkflow: string | null;
  nodes: Node[];
  edges: Edge[];
  triggers: Record<string, WorkflowTrigger[]>;
  schedules: Record<string, string>;
  isEditing: boolean;

  // Workflow Management
  setWorkflows: (workflows: WorkflowDefinition[]) => void;
  selectWorkflow: (id: string | null) => void;
  addWorkflow: (workflow: WorkflowDefinition) => void;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  deleteWorkflow: (id: string) => void;

  // Node/Edge Management
  updateNodes: (nodes: Node[]) => void;
  updateEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: string) => void;

  // Trigger Management
  addTrigger: (workflowId: string, trigger: WorkflowTrigger) => void;
  removeTrigger: (workflowId: string, triggerId: string) => void;
  updateTrigger: (workflowId: string, triggerId: string, updates: Partial<WorkflowTrigger>) => void;

  // Schedule Management
  setSchedule: (workflowId: string, cronExpression: string) => void;
  removeSchedule: (workflowId: string) => void;

  // Import/Export
  importWorkflow: (data: string) => void;
  exportWorkflow: (id: string) => string;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflows: [],
      selectedWorkflow: null,
      nodes: [],
      edges: [],
      triggers: {},
      schedules: {},
      isEditing: false,

      setWorkflows: (workflows) => set({ workflows }),
      
      selectWorkflow: (id) => set({ selectedWorkflow: id }),
      
      addWorkflow: (workflow) => set((state) => ({
        workflows: [...state.workflows, workflow],
      })),

      updateWorkflow: (id, updates) => set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      })),

      deleteWorkflow: (id) => set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        triggers: { ...state.triggers, [id]: undefined },
        schedules: { ...state.schedules, [id]: undefined },
      })),

      updateNodes: (nodes) => set({ nodes }),
      
      updateEdges: (edges) => set({ edges }),
      
      addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node],
      })),
      
      removeNode: (nodeId) => set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
      })),
      
      addEdge: (edge) => set((state) => ({
        edges: [...state.edges, edge],
      })),
      
      removeEdge: (edgeId) => set((state) => ({
        edges: state.edges.filter((edge) => edge.id !== edgeId),
      })),

      addTrigger: (workflowId, trigger) => set((state) => ({
        triggers: {
          ...state.triggers,
          [workflowId]: [...(state.triggers[workflowId] || []), trigger],
        },
      })),

      removeTrigger: (workflowId, triggerId) => set((state) => ({
        triggers: {
          ...state.triggers,
          [workflowId]: state.triggers[workflowId]?.filter(
            (t) => t.id !== triggerId
          ),
        },
      })),

      updateTrigger: (workflowId, triggerId, updates) => set((state) => ({
        triggers: {
          ...state.triggers,
          [workflowId]: state.triggers[workflowId]?.map((t) =>
            t.id === triggerId ? { ...t, ...updates } : t
          ),
        },
      })),

      setSchedule: (workflowId, cronExpression) => set((state) => ({
        schedules: {
          ...state.schedules,
          [workflowId]: cronExpression,
        },
      })),

      removeSchedule: (workflowId) => set((state) => ({
        schedules: {
          ...state.schedules,
          [workflowId]: undefined,
        },
      })),

      importWorkflow: (data) => {
        try {
          const workflow = JSON.parse(data) as WorkflowDefinition;
          const state = get();
          
          // Add workflow
          state.addWorkflow(workflow);
          
          // Import triggers if present
          if (workflow.triggers) {
            workflow.triggers.forEach((trigger) => {
              state.addTrigger(workflow.id, trigger);
            });
          }
          
          // Import schedule if present
          if (workflow.metadata?.schedule) {
            state.setSchedule(workflow.id, workflow.metadata.schedule);
          }
        } catch (error) {
          console.error('Failed to import workflow:', error);
          throw new Error('Invalid workflow data');
        }
      },

      exportWorkflow: (id) => {
        const state = get();
        const workflow = state.workflows.find((w) => w.id === id);
        if (!workflow) throw new Error('Workflow not found');

        const exportData = {
          ...workflow,
          triggers: state.triggers[id] || [],
          metadata: {
            ...workflow.metadata,
            schedule: state.schedules[id],
          },
        };

        return JSON.stringify(exportData, null, 2);
      },
    }),
    {
      name: 'workflow-storage',
      partialize: (state) => ({
        workflows: state.workflows,
        triggers: state.triggers,
        schedules: state.schedules,
      }),
    }
  )
);