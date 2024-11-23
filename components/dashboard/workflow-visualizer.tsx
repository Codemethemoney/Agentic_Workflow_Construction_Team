"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Clock, XCircle } from "lucide-react";

const workflows = [
  {
    id: 1,
    name: "Data Processing",
    status: "completed",
    time: "2m ago",
    progress: 100,
  },
  {
    id: 2,
    name: "Customer Support",
    status: "in-progress",
    time: "5m ago",
    progress: 45,
  },
  {
    id: 3,
    name: "Content Generation",
    status: "failed",
    time: "10m ago",
    progress: 80,
  },
];

const statusIcons = {
  completed: <Check className="h-4 w-4 text-green-500" />,
  "in-progress": <Clock className="h-4 w-4 text-blue-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

export function WorkflowVisualizer() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Active Workflows</CardTitle>
        <CardDescription>Current workflow status</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex flex-col space-y-2 p-4 rounded-lg border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {statusIcons[workflow.status as keyof typeof statusIcons]}
                    <span className="font-medium">{workflow.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {workflow.time}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${
                      workflow.status === "completed"
                        ? "bg-green-500"
                        : workflow.status === "in-progress"
                        ? "bg-blue-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${workflow.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}