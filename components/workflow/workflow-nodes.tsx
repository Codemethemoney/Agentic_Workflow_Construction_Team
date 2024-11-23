"use client";

import { memo } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Settings2, AlertCircle, Database, Code, Bot } from 'lucide-react';

export const nodeTypes = {
  task: TaskNode,
  decision: DecisionNode,
  trigger: TriggerNode,
  action: ActionNode,
};

const TaskNode = memo(({ data }: any) => (
  <Card className="min-w-[200px]">
    <Handle type="target" position={Position.Top} />
    <CardHeader className="p-4">
      <div className="flex items-center space-x-2">
        <Bot className="h-4 w-4" />
        <h3 className="text-sm font-medium">{data.label}</h3>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <Badge variant="outline">{data.type}</Badge>
    </CardContent>
    <Handle type="source" position={Position.Bottom} />
  </Card>
));

const DecisionNode = memo(({ data }: any) => (
  <Card className="min-w-[200px] border-primary">
    <Handle type="target" position={Position.Top} />
    <CardHeader className="p-4">
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-4 w-4" />
        <h3 className="text-sm font-medium">{data.label}</h3>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <p className="text-xs text-muted-foreground">{data.condition}</p>
    </CardContent>
    <Handle type="source" position={Position.Bottom} id="true" />
    <Handle type="source" position={Position.Right} id="false" />
  </Card>
));

const TriggerNode = memo(({ data }: any) => (
  <Card className="min-w-[200px] border-secondary">
    <CardHeader className="p-4">
      <div className="flex items-center space-x-2">
        <Settings2 className="h-4 w-4" />
        <h3 className="text-sm font-medium">{data.label}</h3>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <Badge>{data.triggerType}</Badge>
    </CardContent>
    <Handle type="source" position={Position.Bottom} />
  </Card>
));

const ActionNode = memo(({ data }: any) => (
  <Card className="min-w-[200px] border-destructive">
    <Handle type="target" position={Position.Top} />
    <CardHeader className="p-4">
      <div className="flex items-center space-x-2">
        <Code className="h-4 w-4" />
        <h3 className="text-sm font-medium">{data.label}</h3>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <Badge variant="outline">{data.actionType}</Badge>
    </CardContent>
  </Card>
));