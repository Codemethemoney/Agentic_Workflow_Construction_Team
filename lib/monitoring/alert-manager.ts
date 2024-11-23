import { EventEmitter } from 'events';
import { Alert, Metric } from './types';
import { RedisClient } from '../storage/redis-client';
import { WebSocketManager } from '../websocket/connection-manager';

export class AlertManager extends EventEmitter {
  private redis: RedisClient;
  private wsManager: WebSocketManager;
  private static instance: AlertManager;
  private activeAlerts: Map<string, Alert>;

  private constructor() {
    super();
    this.redis = RedisClient.getInstance();
    this.wsManager = new WebSocketManager();
    this.activeAlerts = new Map();
    this.setupEventHandlers();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      if (message.type === 'ALERT_STATUS_REQUEST') {
        const alerts = await this.getActiveAlerts();
        this.wsManager.broadcast('ALERT_STATUS_UPDATE', alerts);
      }
    });
  }

  public async checkMetric(metric: Metric): Promise<void> {
    const alerts = await this.getAlertDefinitions(metric.name);
    
    for (const alert of alerts) {
      const isTriggered = this.evaluateCondition(metric, alert.condition, alert.threshold);
      
      if (isTriggered && !this.activeAlerts.has(alert.id)) {
        await this.triggerAlert(alert, metric);
      } else if (!isTriggered && this.activeAlerts.has(alert.id)) {
        await this.resolveAlert(alert.id);
      }
    }
  }

  private async getAlertDefinitions(metricName: string): Promise<Alert[]> {
    const alertsJson = await this.redis.getKey(`alerts:${metricName}`);
    return alertsJson ? JSON.parse(alertsJson) : [];
  }

  private evaluateCondition(
    metric: Metric,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case '>':
        return metric.value > threshold;
      case '<':
        return metric.value < threshold;
      case '>=':
        return metric.value >= threshold;
      case '<=':
        return metric.value <= threshold;
      case '==':
        return metric.value === threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(alert: Alert, metric: Metric): Promise<void> {
    const triggeredAlert: Alert = {
      ...alert,
      status: 'active',
      triggeredAt: Date.now(),
      labels: {
        ...alert.labels,
        value: metric.value.toString(),
      },
    };

    this.activeAlerts.set(alert.id, triggeredAlert);
    await this.redis.setKey(
      `active_alerts:${alert.id}`,
      JSON.stringify(triggeredAlert)
    );

    this.wsManager.broadcast('ALERT_TRIGGERED', triggeredAlert);
    this.emit('alertTriggered', triggeredAlert);
  }

  private async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();

    this.activeAlerts.delete(alertId);
    await this.redis.deleteKey(`active_alerts:${alertId}`);

    this.wsManager.broadcast('ALERT_RESOLVED', alert);
    this.emit('alertResolved', alert);
  }

  public async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values());
  }

  public async cleanup(): void {
    this.wsManager.cleanup();
    this.activeAlerts.clear();
    this.removeAllListeners();
  }
}