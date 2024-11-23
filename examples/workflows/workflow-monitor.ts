import { WebSocketManager } from '../../lib/websocket/connection-manager';

export class WorkflowMonitor {
  private wsManager: WebSocketManager;

  constructor() {
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', ({ message }) => {
      switch (message.type) {
        case 'STEP_COMPLETED':
          this.logStepCompletion(message.payload);
          break;
        case 'STEP_FAILED':
          this.logStepFailure(message.payload);
          break;
        case 'WORKFLOW_COMPLETED':
          this.logWorkflowCompletion(message.payload);
          break;
      }
    });
  }

  private logStepCompletion(payload: any): void {
    console.log(`Step ${payload.stepId} completed successfully`);
    console.log('Output:', payload.output);
    console.log('Duration:', payload.duration, 'ms');
  }

  private logStepFailure(payload: any): void {
    console.error(`Step ${payload.stepId} failed`);
    console.error('Error:', payload.error);
    console.error('Attempt:', payload.attempt);
  }

  private logWorkflowCompletion(payload: any): void {
    console.log('Workflow execution completed');
    console.log('Total duration:', payload.duration, 'ms');
    console.log('Steps completed:', payload.stepsCompleted);
    console.log('Final output:', payload.output);
  }

  public cleanup(): void {
    this.wsManager.cleanup();
  }
}