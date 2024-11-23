"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAgentStore } from "@/lib/stores/agent-store";

export function AgentOverview() {
  const { activeAgents, totalAgents } = useAgentStore();
  const activePercentage = (activeAgents / totalAgents) * 100;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Agent Status</CardTitle>
        <CardDescription>Real-time agent activity overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Agents</span>
              <span className="text-sm text-muted-foreground">
                {activeAgents}/{totalAgents}
              </span>
            </div>
            <Progress value={activePercentage} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-3xl font-bold">{activeAgents}</span>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-bold">{totalAgents - activeAgents}</span>
              <p className="text-xs text-muted-foreground">Offline</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Agent Distribution</h3>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Design</span>
                <span className="text-sm text-muted-foreground">4 agents</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Processing</span>
                <span className="text-sm text-muted-foreground">3 agents</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Code Generation</span>
                <span className="text-sm text-muted-foreground">2 agents</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}