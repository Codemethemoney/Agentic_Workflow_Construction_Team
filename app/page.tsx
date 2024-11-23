import { DashboardHeader } from '@/components/dashboard/header';
import { AgentOverview } from '@/components/dashboard/agent-overview';
import { PerformanceMetrics } from '@/components/dashboard/performance-metrics';
import { WorkflowVisualizer } from '@/components/dashboard/workflow-visualizer';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function Home() {
  return (
    <div className="space-y-8">
      <DashboardHeader />
      
      {/* Top row with Agent Overview and Workflow Visualizer */}
      <div className="grid grid-cols-2 gap-6">
        <AgentOverview />
        <WorkflowVisualizer />
      </div>

      {/* Full-width Performance Metrics */}
      <PerformanceMetrics />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}