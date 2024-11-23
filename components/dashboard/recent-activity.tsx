"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAgentStore } from "@/lib/stores/agent-store";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  agentId: string;
  type: 'task_completed' | 'status_change' | 'error';
  description: string;
  timestamp: number;
}

// Generate sample activities for demonstration
const generateRecentActivities = (agents: any[]): Activity[] => {
  const activities: Activity[] = [];
  const now = Date.now();

  agents.forEach(agent => {
    // Task completion activity
    if (agent.metrics.tasksCompleted > 0) {
      activities.push({
        id: `task-${agent.id}`,
        agentId: agent.id,
        type: 'task_completed',
        description: `Completed ${agent.metrics.tasksCompleted} tasks with ${agent.metrics.successRate}% success rate`,
        timestamp: now - Math.random() * 3600000,
      });
    }

    // Status change activity
    activities.push({
      id: `status-${agent.id}`,
      agentId: agent.id,
      type: 'status_change',
      description: `Agent status changed to ${agent.status}`,
      timestamp: now - Math.random() * 7200000,
    });
  });

  return activities.sort((a, b) => b.timestamp - a.timestamp);
};

export function RecentActivity() {
  const agents = useAgentStore((state) => state.agents);
  const activities = generateRecentActivities(agents);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'task_completed':
        return 'bg-green-500';
      case 'status_change':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions from your AI agents</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No recent activity. Add and activate agents to get started.
              </div>
            ) : (
              activities.map((activity) => {
                const agent = agents.find(a => a.id === activity.agentId);
                if (!agent) return null;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 border-b pb-4 last:border-0"
                  >
                    <Avatar>
                      <AvatarFallback className={getActivityIcon(activity.type)}>
                        {agent.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}