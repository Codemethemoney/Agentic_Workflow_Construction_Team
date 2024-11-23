import { EventEmitter } from 'events';
import {
  DeploymentConfig,
  DeploymentConfigSchema,
  BuildConfig,
  TestConfig,
  DeploymentResult
} from './types';
import { ContainerBuilder } from './builders/container-builder';
import { TestRunner } from './testing/test-runner';
import { KubernetesDeployer } from './deployers/kubernetes-deployer';
import { CloudDeployer } from './deployers/cloud-deployer';
import { MonitoringManager } from './monitoring/monitoring-manager';
import { WebSocketManager } from '../websocket/connection-manager';

export class DeploymentManager extends EventEmitter {
  private containerBuilder: ContainerBuilder;
  private testRunner: TestRunner;
  private k8sDeployer: KubernetesDeployer;
  private cloudDeployer: CloudDeployer;
  private monitoringManager: MonitoringManager;
  private wsManager: WebSocketManager;
  private static instance: DeploymentManager;

  private constructor() {
    super();
    this.containerBuilder = new ContainerBuilder();
    this.testRunner = new TestRunner();
    this.k8sDeployer = new KubernetesDeployer();
    this.cloudDeployer = new CloudDeployer();
    this.monitoringManager = new MonitoringManager();
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  public static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      switch (message.type) {
        case 'DEPLOYMENT_STATUS':
          await this.handleStatusRequest(message.payload);
          break;
        case 'DEPLOYMENT_LOGS':
          await this.handleLogRequest(message.payload);
          break;
      }
    });
  }

  public async deploy(
    config: DeploymentConfig,
    buildConfig: BuildConfig,
    testConfig: TestConfig
  ): Promise<DeploymentResult> {
    try {
      // Validate deployment configuration
      this.validateConfig(config);

      // Start deployment process
      const startTime = Date.now();
      this.broadcastStatus('starting', config.environment);

      // Run tests
      const testResults = await this.runTests(testConfig);
      if (!testResults.success) {
        throw new Error('Tests failed');
      }

      // Build container
      const imageTag = await this.buildContainer(buildConfig);

      // Deploy based on platform
      const deployResult = await this.deployToTarget(config, imageTag);

      // Setup monitoring
      await this.setupMonitoring(config);

      const endTime = Date.now();
      const result: DeploymentResult = {
        status: 'success',
        environment: config.environment,
        version: config.version,
        timestamp: endTime,
        endpoints: deployResult.endpoints,
        metrics: {
          buildTime: deployResult.buildTime,
          deployTime: endTime - startTime,
          testResults: testConfig,
        },
      };

      this.broadcastStatus('completed', config.environment, result);
      return result;

    } catch (error) {
      const failureResult: DeploymentResult = {
        status: 'failure',
        environment: config.environment,
        version: config.version,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.broadcastStatus('failed', config.environment, failureResult);
      throw error;
    }
  }

  private validateConfig(config: DeploymentConfig): void {
    try {
      DeploymentConfigSchema.parse(config);
    } catch (error) {
      throw new Error(`Invalid deployment configuration: ${error.message}`);
    }
  }

  private async runTests(config: TestConfig): Promise<{ success: boolean }> {
    this.broadcastStatus('testing', 'all');
    return await this.testRunner.runTests(config);
  }

  private async buildContainer(config: BuildConfig): Promise<string> {
    this.broadcastStatus('building', 'all');
    return await this.containerBuilder.build(config);
  }

  private async deployToTarget(
    config: DeploymentConfig,
    imageTag: string
  ): Promise<{ endpoints: string[]; buildTime: number }> {
    this.broadcastStatus('deploying', config.environment);

    switch (config.platform) {
      case 'kubernetes':
        return await this.k8sDeployer.deploy(config, imageTag);
      case 'aws':
      case 'gcp':
      case 'azure':
        return await this.cloudDeployer.deploy(config, imageTag);
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  private async setupMonitoring(config: DeploymentConfig): Promise<void> {
    if (config.monitoring) {
      await this.monitoringManager.setup({
        environment: config.environment,
        metrics: config.monitoring.metrics,
        logging: config.monitoring.logging,
        tracing: config.monitoring.tracing,
        alerts: config.monitoring.alerts,
      });
    }
  }

  private broadcastStatus(
    status: string,
    environment: string,
    result?: DeploymentResult
  ): void {
    this.wsManager.broadcast('DEPLOYMENT_STATUS', {
      status,
      environment,
      timestamp: Date.now(),
      result,
    });
  }

  private async handleStatusRequest(payload: any): Promise<void> {
    // Handle status request implementation
  }

  private async handleLogRequest(payload: any): Promise<void> {
    // Handle log request implementation
  }

  public async cleanup(): Promise<void> {
    this.wsManager.cleanup();
    await this.monitoringManager.cleanup();
  }
}