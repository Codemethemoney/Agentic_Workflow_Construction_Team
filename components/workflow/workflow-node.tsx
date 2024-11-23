"use client";

import { memo } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

export const WorkflowNode = memo(({ data }: any) => {
  return (
    <Card className="min-w-[200px]">
      <Handle type="target" position={Position.Top} />
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{data.label}</h3>
          <Badge variant="outline">{data.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
      </CardContent>
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
});