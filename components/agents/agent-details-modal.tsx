"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Agent, AgentTool, useAgentStore } from "@/lib/stores/agent-store";
import { useLLMStore } from "@/lib/stores/llm-store";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Wrench,
  Plus,
  X,
  Settings,
  Activity,
  Database,
  FileSearch,
  Image,
  Code,
} from "lucide-react";

const tools = [
  { id: "langchain", name: "LangChain", icon: Brain },
  { id: "rag", name: "RAG", icon: Database },
  { id: "ocr", name: "OCR", icon: Image },
  { id: "vector-store", name: "Vector Store", icon: FileSearch },
  { id: "code-interpreter", name: "Code Interpreter", icon: Code },
] as const;

interface AgentDetailsModalProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailsModal({
  agent,
  open,
  onOpenChange,
}: AgentDetailsModalProps) {
  const { updateAgentModel, addAgentTool, removeAgentTool } = useAgentStore();
  const { activeModels } = useLLMStore();
  const { toast } = useToast();

  const handleModelChange = (model: string) => {
    updateAgentModel(agent.id, model as any);
    toast({
      title: "Model Updated",
      description: `Agent now uses ${model} for processing.`,
    });
  };

  const handleAddTool = (toolId: string) => {
    const tool = tools.find((t) => t.id === toolId);
    if (tool) {
      addAgentTool(agent.id, {
        name: tool.name,
        type: toolId as any,
      });
      toast({
        title: "Tool Added",
        description: `${tool.name} has been added to the agent's capabilities.`,
      });
    }
  };

  const handleRemoveTool = (toolId: string) => {
    removeAgentTool(agent.id, toolId);
    toast({
      title: "Tool Removed",
      description: "Tool has been removed from the agent's capabilities.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{agent.name} - Configuration</DialogTitle>
          <DialogDescription>
            Configure agent model and tools
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="model">
          <TabsList>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Language Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Model</Label>
                  <Select
                    value={agent.model}
                    onValueChange={handleModelChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Available Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Tools</Label>
                  <div className="flex flex-wrap gap-2">
                    {agent.tools.map((tool) => (
                      <Badge
                        key={tool.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tool.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveTool(tool.id)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Add Tool</Label>
                  <Select onValueChange={handleAddTool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tool to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {tools.map((tool) => {
                        const isActive = agent.tools.some(
                          (t) => t.type === tool.id
                        );
                        return (
                          <SelectItem
                            key={tool.id}
                            value={tool.id}
                            disabled={isActive}
                          >
                            <div className="flex items-center gap-2">
                              <tool.icon className="h-4 w-4" />
                              {tool.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard
                    title="Tasks Completed"
                    value={agent.metrics.tasksCompleted}
                  />
                  <MetricCard
                    title="Success Rate"
                    value={`${agent.metrics.successRate}%`}
                  />
                  <MetricCard
                    title="Avg. Processing Time"
                    value={`${agent.metrics.averageProcessingTime}ms`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}