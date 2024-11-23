import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketMessage {
  type: string;
  payload: any;
  id: string;
}

export class WebSocketManager extends EventEmitter {
  private connections: Map<string, WebSocket>;
  private heartbeatInterval: NodeJS.Timeout | null;

  constructor() {
    super();
    this.connections = new Map();
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  public addConnection(ws: WebSocket): string {
    const connectionId = uuidv4();
    this.connections.set(connectionId, ws);

    ws.on('message', (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);
        this.emit('message', { connectionId, message });
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    ws.on('close', () => {
      this.connections.delete(connectionId);
      this.emit('disconnection', connectionId);
    });

    return connectionId;
  }

  public broadcast(type: string, payload: any): void {
    const message = JSON.stringify({ type, payload, id: uuidv4() });
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  public sendTo(connectionId: string, type: string, payload: any): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload, id: uuidv4() });
      ws.send(message);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((ws, connectionId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          this.connections.delete(connectionId);
        }
      });
    }, 30000);
  }

  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.connections.forEach((ws) => {
      ws.close();
    });
    this.connections.clear();
  }
}