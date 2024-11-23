import { Button } from "@/components/ui/button";
import { AddAgentModal } from "./add-agent-modal";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your AI agent teams
        </p>
      </div>
      <AddAgentModal />
    </div>
  );
}