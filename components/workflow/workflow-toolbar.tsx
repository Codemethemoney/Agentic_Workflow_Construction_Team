"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Plus, Save } from 'lucide-react';

interface WorkflowToolbarProps {
  onAddNode: (type: string) => void;
  onSave: () => void;
}

export function WorkflowToolbar({ onAddNode, onSave }: WorkflowToolbarProps) {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Select onValueChange={onAddNode}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Add node" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="task">Task Node</SelectItem>
            <SelectItem value="decision">Decision Node</SelectItem>
            <SelectItem value="action">Action Node</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => onAddNode('task')}>
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </div>
      <Button onClick={onSave}>
        <Save className="h-4 w-4 mr-2" />
        Save Workflow
      </Button>
    </div>
  );
}