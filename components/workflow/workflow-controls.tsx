"use client";

import { useState } from "react";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Download,
  Upload,
  Plus,
} from 'lucide-react';

interface WorkflowControlsProps {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export function WorkflowControls({
  onStart,
  onPause,
  onReset,
  isRunning,
}: WorkflowControlsProps) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [cronExpression, setCronExpression] = useState("");
  const { toast } = useToast();
  const {
    selectedWorkflow,
    setSchedule,
    exportWorkflow,
    importWorkflow,
  } = useWorkflowStore();

  const handleSchedule = () => {
    if (!selectedWorkflow) {
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow to schedule",
        variant: "destructive",
      });
      return;
    }

    setSchedule(selectedWorkflow, cronExpression);
    setShowScheduleDialog(false);
    toast({
      title: "Schedule Set",
      description: "Workflow schedule has been updated",
    });
  };

  const handleExport = () => {
    if (!selectedWorkflow) {
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = exportWorkflow(selectedWorkflow);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${selectedWorkflow}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        importWorkflow(e.target?.result as string);
        toast({
          title: "Workflow Imported",
          description: "The workflow has been imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <div className="flex-1">
        <Select defaultValue="default">
          <SelectTrigger>
            <SelectValue placeholder="Select workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Workflow</SelectItem>
            <SelectItem value="custom">Custom Workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        {isRunning ? (
          <Button variant="outline" onClick={onPause}>
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        ) : (
          <Button variant="default" onClick={onStart}>
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        )}
        
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>

        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Workflow</DialogTitle>
              <DialogDescription>
                Set a cron expression to schedule this workflow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="*/5 * * * *"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
              />
              <div className="text-sm text-muted-foreground">
                <p>Example expressions:</p>
                <ul className="list-disc list-inside">
                  <li>*/5 * * * * (every 5 minutes)</li>
                  <li>0 * * * * (every hour)</li>
                  <li>0 0 * * * (every day at midnight)</li>
                </ul>
              </div>
              <Button onClick={handleSchedule}>Set Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <Button variant="outline" onClick={() => document.getElementById('import-workflow')?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <input
          id="import-workflow"
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </div>
  );
}