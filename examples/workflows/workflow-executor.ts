import { WorkflowManager } from '../../lib/orchestrator/workflow-manager';
import { DataProcessingAgent } from '../../lib/agents/data-processing/data-processing-agent';
import { SystemDesignAgent } from '../../lib/agents/system-design/system-design-agent';
import { CodeGenerationAgent } from '../../lib/agents/code-generation/code-generation-agent';
import { KnowledgeBase } from '../../lib/knowledge/knowledge-base';
import { documentProcessingWorkflow } from './document-processing-workflow';

export async function executeWorkflowExample() {
  // Initialize workflow manager
  const workflowManager = WorkflowManager.getInstance();

  // Initialize and register agents
  const dataProcessor = new DataProcessingAgent('data-processing-agent');
  const systemDesigner = new SystemDesignAgent('system-design-agent');
  const codeGenerator = new CodeGenerationAgent('code-generation-agent');
  const knowledgeBase = await KnowledgeBase.getInstance();

  workflowManager.registerAgent(dataProcessor);
  workflowManager.registerAgent(systemDesigner);
  workflowManager.registerAgent(codeGenerator);

  // Example document input
  const sampleDocument = {
    id: 'doc123',
    content: `
      System Requirements:
      1. Real-time data processing pipeline
      2. Scalable microservices architecture
      3. Event-driven communication
      4. High availability and fault tolerance
    `,
    type: 'pdf',
    metadata: {
      author: 'AI Team',
      date: new Date().toISOString()
    }
  };

  // Trigger workflow execution
  const task = {
    id: 'task123',
    type: 'workflow_execution',
    data: {
      workflowId: documentProcessingWorkflow.id,
      document: sampleDocument
    }
  };

  try {
    // Schedule the workflow task
    await workflowManager.scheduleTask(task);
    console.log('Workflow execution started');
  } catch (error) {
    console.error('Workflow execution failed:', error);
  }
}