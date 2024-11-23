"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings, Power, Activity } from "lucide-react";
import { AgentDetailsModal } from "./agent-details-modal";
import { useAgentStore } from "@/lib/stores/agent-store";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    type: string;
    description: string;
    status: "active" | "inactive";
    metrics: {
      tasksCompleted: number;
      successRate: number;
      averageProcessingTime: number;
    };
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const updateAgentStatus = useAgentStore((state) => state.updateAgentStatus);

  const toggleStatus = () => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    updateAgentStatus(agent.id, newStatus);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{agent.name}</CardTitle>
              <CardDescription>{agent.type}</CardDescription>
            </div>
            <Badge
              variant={agent.status === "active" ? "default" : "secondary"}
              className="capitalize"
            >
              {agent.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{agent.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span>{agent.metrics.successRate}%</span>
              </div>
              <Progress value={agent.metrics.successRate} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tasks Completed</span>
                <p className="text-lg font-semibold mt-1">
                  {agent.metrics.tasksCompleted}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg. Processing Time</span>
                <p className="text-lg font-semibold mt-1">
                  {agent.metrics.averageProcessingTime}ms
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
              <Button
                variant={agent.status === "active" ? "destructive" : "default"}
                size="sm"
                onClick={toggleStatus}
              >
                <Power className="h-4 w-4 mr-2" />
                {agent.status === "active" ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AgentDetailsModal
        agent={agent}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
}