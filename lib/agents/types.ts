export interface AgentMessage {
  id: string;
  type: 'task' | 'response' | 'error';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: number;
  data: any;
  deadline?: number;
}

export interface AgentResult {
  taskId: string;
  status: 'success' | 'failure';
  data: any;
  error?: string;
}