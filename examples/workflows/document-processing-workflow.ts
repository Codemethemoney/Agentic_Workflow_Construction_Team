import { WorkflowDefinition } from '../../lib/agents/workflow-automation/types';

export const documentProcessingWorkflow: WorkflowDefinition = {
  id: 'doc-processing-workflow',
  name: 'Document Processing and Analysis',
  description: 'Extract, analyze, and store information from documents using multiple specialized agents',
  triggers: [
    {
      type: 'event',
      config: {
        eventType: 'NEW_DOCUMENT',
        conditions: [
          {
            field: 'type',
            operator: 'equals',
            value: 'pdf'
          }
        ]
      }
    }
  ],
  steps: [
    {
      id: 'extract-data',
      name: 'Extract Document Data',
      type: 'agent-task',
      config: {
        agentId: 'data-processing-agent',
        taskType: 'extract_data',
        retryPolicy: {
          maxAttempts: 3,
          backoffMs: 1000,
          maxBackoffMs: 5000
        }
      },
      next: ['analyze-content']
    },
    {
      id: 'analyze-content',
      name: 'Analyze Content',
      type: 'agent-task',
      config: {
        agentId: 'system-design-agent',
        taskType: 'analyze_requirements',
      },
      next: ['generate-code']
    },
    {
      id: 'generate-code',
      name: 'Generate Implementation',
      type: 'agent-task',
      config: {
        agentId: 'code-generation-agent',
        taskType: 'generate_workflow'
      },
      next: ['store-knowledge']
    },
    {
      id: 'store-knowledge',
      name: 'Store in Knowledge Base',
      type: 'agent-task',
      config: {
        agentId: 'knowledge-base',
        taskType: 'store_document'
      },
      next: []
    }
  ],
  errorHandling: {
    defaultRetryPolicy: {
      maxAttempts: 3,
      backoffMs: 1000,
      maxBackoffMs: 5000
    },
    notificationChannels: ['slack', 'email'],
    fallbackActions: []
  },
  metadata: {
    version: '1.0.0',
    owner: 'ai-team',
    priority: 'high'
  }
};