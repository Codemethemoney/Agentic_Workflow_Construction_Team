import {
  CodeGenerationConfig,
  WorkflowStep,
  APIIntegration,
  GeneratedCode,
} from '../types';

export async function generateWorkflowCode(
  config: CodeGenerationConfig,
  steps: WorkflowStep[],
  integrations: APIIntegration[]
): Promise<GeneratedCode> {
  const files: GeneratedCode['files'] = [];
  const dependencies: Record<string, string> = {};

  // Add core dependencies based on language
  addCoreDependencies(config, dependencies);

  // Generate main workflow file
  files.push({
    path: getMainFilePath(config),
    content: generateMainFile(config, steps),
  });

  // Generate integration files
  integrations.forEach(integration => {
    const { path, content } = generateIntegrationFile(config, integration);
    files.push({ path, content });
    addIntegrationDependencies(integration, dependencies);
  });

  // Generate type definitions if TypeScript
  if (config.language === 'typescript') {
    files.push({
      path: 'types/workflow.ts',
      content: generateTypeDefinitions(steps, integrations),
    });
  }

  // Generate test files if testing is enabled
  if (config.testing) {
    files.push(...generateTestFiles(config, steps));
  }

  return {
    files,
    dependencies,
    scripts: generateScripts(config),
  };
}

function addCoreDependencies(
  config: CodeGenerationConfig,
  dependencies: Record<string, string>
): void {
  switch (config.language) {
    case 'typescript':
      dependencies['typescript'] = '^5.0.0';
      dependencies['@types/node'] = '^18.0.0';
      break;
    case 'javascript':
      dependencies['eslint'] = '^8.0.0';
      break;
    case 'python':
      dependencies['pytest'] = '^7.0.0';
      break;
  }

  if (config.testing) {
    dependencies['jest'] = '^29.0.0';
    dependencies['@types/jest'] = '^29.0.0';
  }
}

function getMainFilePath(config: CodeGenerationConfig): string {
  const ext = config.language === 'typescript' ? 'ts' : 'js';
  return `src/workflow/index.${ext}`;
}

function generateMainFile(
  config: CodeGenerationConfig,
  steps: WorkflowStep[]
): string {
  const imports = generateImports(steps);
  const workflowClass = generateWorkflowClass(steps);
  
  return `${imports}

${workflowClass}

export default new Workflow();`;
}

function generateImports(steps: WorkflowStep[]): string {
  const imports = new Set<string>();
  
  steps.forEach(step => {
    switch (step.type) {
      case 'api':
        imports.add('import { APIClient } from "../integrations/api-client";');
        break;
      case 'transformation':
        imports.add('import { Transform } from "../utils/transform";');
        break;
      // Add more imports based on step types
    }
  });

  return Array.from(imports).join('\n');
}

function generateWorkflowClass(steps: WorkflowStep[]): string {
  return `class Workflow {
  private steps: Map<string, WorkflowStep>;

  constructor() {
    this.steps = new Map();
    this.initializeSteps();
  }

  private initializeSteps(): void {
    ${steps.map(step => `this.steps.set("${step.id}", ${generateStepImplementation(step)});`).join('\n    ')}
  }

  async execute(input: any): Promise<any> {
    let currentStep = this.steps.get("${steps[0].id}");
    let result = input;

    while (currentStep) {
      result = await currentStep.execute(result);
      currentStep = this.getNextStep(currentStep, result);
    }

    return result;
  }

  private getNextStep(currentStep: WorkflowStep, result: any): WorkflowStep | null {
    // Implementation of step transition logic
    return null;
  }
}`;
}

function generateStepImplementation(step: WorkflowStep): string {
  switch (step.type) {
    case 'api':
      return `{
      type: "${step.type}",
      async execute(input: any) {
        const client = new APIClient(${JSON.stringify(step.config)});
        return await client.request(input);
      }
    }`;
    case 'transformation':
      return `{
      type: "${step.type}",
      execute(input: any) {
        return Transform.apply(input, ${JSON.stringify(step.config)});
      }
    }`;
    default:
      return `{
      type: "${step.type}",
      execute(input: any) {
        // Default implementation
        return input;
      }
    }`;
  }
}

function generateIntegrationFile(
  config: CodeGenerationConfig,
  integration: APIIntegration
): { path: string; content: string } {
  const ext = config.language === 'typescript' ? 'ts' : 'js';
  
  return {
    path: `src/integrations/${integration.name}.${ext}`,
    content: generateIntegrationCode(integration, config),
  };
}

function generateIntegrationCode(
  integration: APIIntegration,
  config: CodeGenerationConfig
): string {
  // Implementation of integration code generation
  return '';
}

function addIntegrationDependencies(
  integration: APIIntegration,
  dependencies: Record<string, string>
): void {
  switch (integration.type) {
    case 'rest':
      dependencies['axios'] = '^1.0.0';
      break;
    case 'graphql':
      dependencies['graphql'] = '^16.0.0';
      dependencies['graphql-request'] = '^5.0.0';
      break;
    case 'grpc':
      dependencies['@grpc/grpc-js'] = '^1.0.0';
      dependencies['@grpc/proto-loader'] = '^0.7.0';
      break;
  }
}

function generateTypeDefinitions(
  steps: WorkflowStep[],
  integrations: APIIntegration[]
): string {
  // Implementation of type definitions generation
  return '';
}

function generateTestFiles(
  config: CodeGenerationConfig,
  steps: WorkflowStep[]
): Array<{ path: string; content: string }> {
  // Implementation of test file generation
  return [];
}

function generateScripts(config: CodeGenerationConfig): Record<string, string> {
  const scripts: Record<string, string> = {
    build: config.language === 'typescript' ? 'tsc' : 'babel src -d dist',
    start: 'node dist/index.js',
  };

  if (config.testing) {
    scripts.test = 'jest';
    scripts['test:watch'] = 'jest --watch';
  }

  if (config.linting) {
    scripts.lint = 'eslint src --ext .ts,.js';
    scripts['lint:fix'] = 'eslint src --ext .ts,.js --fix';
  }

  return scripts;
}