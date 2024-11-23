import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MetricsState {
  metrics: Record<string, any[]>;
  predictions: Array<{
    type: string;
    probability: number;
    confidence: number;
    actions: string[];
    timestamp: number;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: number;
  }>;
  updateMetrics: (metrics: Record<string, any[]>) => void;
  addPrediction: (prediction: any) => void;
  addAlert: (alert: any) => void;
  clearOldData: (maxAge: number) => void;
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set) => ({
      metrics: {},
      predictions: [],
      alerts: [],

      updateMetrics: (metrics) =>
        set((state) => ({
          metrics: {
            ...state.metrics,
            ...metrics,
          },
        })),

      addPrediction: (prediction) =>
        set((state) => ({
          predictions: [
            prediction,
            ...state.predictions.slice(0, 99),
          ],
        })),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            alert,
            ...state.alerts.slice(0, 99),
          ],
        })),

      clearOldData: (maxAge) =>
        set((state) => {
          const now = Date.now();
          return {
            predictions: state.predictions.filter(
              (p) => now - p.timestamp < maxAge
            ),
            alerts: state.alerts.filter(
              (a) => now - a.timestamp < maxAge
            ),
          };
        }),
    }),
    {
      name: 'metrics-storage',
      partialize: (state) => ({
        predictions: state.predictions,
        alerts: state.alerts,
      }),
    }
  )
);