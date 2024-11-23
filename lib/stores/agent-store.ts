import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LLMModel } from './llm-store';

export interface AgentTool {
  id: string;
  name: string;
  type: 'langchain' | 'rag' | 'ocr' | 'vector-store' | 'code-interpreter';
  config?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive';
  model: LLMModel;
  tools: AgentTool[];
  metrics: {
    tasksCompleted: number;
    successRate: number;
    averageProcessingTime: number;
  };
}

interface AgentStore {
  agents: Agent[];
  activeAgents: number;
  totalAgents: number;
  addAgent: (agent: Omit<Agent, 'id' | 'status' | 'metrics' | 'model' | 'tools'>) => void;
  removeAgent: (id: string) => void;
  updateAgentStatus: (id: string, status: 'active' | 'inactive') => void;
  updateAgentModel: (id: string, model: LLMModel) => void;
  addAgentTool: (agentId: string, tool: Omit<AgentTool, 'id'>) => void;
  removeAgentTool: (agentId: string, toolId: string) => void;
  updateAgentMetrics: (id: string, metrics: Agent['metrics']) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      agents: [],
      activeAgents: 0,
      totalAgents: 0,
      
      addAgent: (newAgent) => set((state) => {
        const agent: Agent = {
          id: Math.random().toString(36).substring(7),
          status: 'inactive',
          model: 'gpt-4', // Default model
          tools: [], // Start with no tools
          metrics: {
            tasksCompleted: 0,
            successRate: 100,
            averageProcessingTime: 0,
          },
          ...newAgent,
        };
        
        return {
          agents: [...state.agents, agent],
          totalAgents: state.totalAgents + 1,
        };
      }),
      
      removeAgent: (id) => set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== id),
        totalAgents: state.totalAgents - 1,
        activeAgents: state.agents.find((agent) => agent.id === id)?.status === 'active'
          ? state.activeAgents - 1
          : state.activeAgents,
      })),
      
      updateAgentStatus: (id, status) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === id ? { ...agent, status } : agent
        ),
        activeAgents: status === 'active'
          ? state.activeAgents + 1
          : state.activeAgents - 1,
      })),

      updateAgentModel: (id, model) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === id ? { ...agent, model } : agent
        ),
      })),

      addAgentTool: (agentId, tool) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId
            ? {
                ...agent,
                tools: [
                  ...agent.tools,
                  { ...tool, id: Math.random().toString(36).substring(7) },
                ],
              }
            : agent
        ),
      })),

      removeAgentTool: (agentId, toolId) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId
            ? {
                ...agent,
                tools: agent.tools.filter((tool) => tool.id !== toolId),
              }
            : agent
        ),
      })),
      
      updateAgentMetrics: (id, metrics) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === id ? { ...agent, metrics } : agent
        ),
      })),
    }),
    {
      name: 'agent-storage', // Storage key for persistence
      partialize: (state) => ({
        agents: state.agents,
        activeAgents: state.activeAgents,
        totalAgents: state.totalAgents,
      }),
    }
  )
);