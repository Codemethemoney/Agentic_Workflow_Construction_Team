import { WorkflowEditor } from '@/components/workflow/workflow-editor';
import { WorkflowControls } from '@/components/workflow/workflow-controls';

export default function WorkflowsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground">
          Design and manage AI agent workflows
        </p>
      </div>

      <div className="border rounded-lg bg-background">
        <WorkflowControls
          onStart={() => {}}
          onPause={() => {}}
          onReset={() => {}}
          isRunning={false}
        />
        <WorkflowEditor />
      </div>
    </div>
  );
}