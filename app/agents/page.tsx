"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddAgentModal } from "@/components/dashboard/add-agent-modal";
import { AgentCard } from "@/components/agents/agent-card";
import { useAgentStore } from "@/lib/stores/agent-store";

export default function Agents() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage and monitor your AI agents
          </p>
        </div>
        <AddAgentModal />
      </div>

      <div className="grid gap-6">
        <AgentList />
      </div>
    </div>
  );
}

function AgentList() {
  const agents = useAgentStore((state) => state.agents);

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            No agents found. Click the "Add Agent" button to create your first agent.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </>
  );
}