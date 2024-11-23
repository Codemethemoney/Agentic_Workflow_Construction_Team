"use client";

import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  addEdge,
  Panel,
} from 'react-flow-renderer';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { nodeTypes } from './workflow-nodes';
import { Button } from '../ui/button';
import { Plus, Save, Play, Pause } from 'lucide-react';
import { WorkflowToolbar } from './workflow-toolbar';
import { useToast } from '@/hooks/use-toast';

const defaultNodes: Node[] = [
  {
    id: 'trigger',
    type: 'trigger',
    position: { x: 250, y: 0 },
    data: { label: 'Start', triggerType: 'manual' },
  },
];

export function WorkflowEditor() {
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { toast } = useToast();

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
  }, []);

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node_${nodes.length + 1}`,
      type,
      position: { x: 250, y: nodes.length * 100 + 100 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
        type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveWorkflow = () => {
    // Save workflow logic here
    toast({
      title: "Workflow Saved",
      description: "Your workflow has been saved successfully.",
    });
  };

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      <WorkflowToolbar onAddNode={addNode} onSave={saveWorkflow} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="bg-background p-2 rounded-lg shadow">
          <div className="space-x-2">
            <Button size="sm" variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button size="sm" variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}