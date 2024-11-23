import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChartConfig {
  id: string;
  type: 'line' | 'area' | 'bar';
  title: string;
  metric: string;
  timeRange: '1h' | '24h' | '7d';
}

interface DashboardState {
  charts: ChartConfig[];
  addChart: (chart: ChartConfig) => void;
  removeChart: (id: string) => void;
  updateChart: (id: string, updates: Partial<ChartConfig>) => void;
  updateLayout: (charts: ChartConfig[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      charts: [
        {
          id: 'task-count',
          type: 'line',
          title: 'Task Count',
          metric: 'agent_task_count',
          timeRange: '24h',
        },
        {
          id: 'system-load',
          type: 'area',
          title: 'System Load',
          metric: 'system_load',
          timeRange: '1h',
        },
        {
          id: 'memory-usage',
          type: 'bar',
          title: 'Memory Usage',
          metric: 'memory_usage_bytes',
          timeRange: '24h',
        },
      ],

      addChart: (chart) =>
        set((state) => ({
          charts: [...state.charts, chart],
        })),

      removeChart: (id) =>
        set((state) => ({
          charts: state.charts.filter((c) => c.id !== id),
        })),

      updateChart: (id, updates) =>
        set((state) => ({
          charts: state.charts.map((chart) =>
            chart.id === id ? { ...chart, ...updates } : chart
          ),
        })),

      updateLayout: (charts) =>
        set({
          charts,
        }),
    }),
    {
      name: 'dashboard-storage',
    }
  )
);