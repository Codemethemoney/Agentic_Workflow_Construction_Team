import { z } from 'zod';

// Base schemas for common task types
export const BaseTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  priority: z.number().min(0).max(10),
  retryPolicy: z.object({
    maxAttempts: z.number().min(1),
    backoffMs: z.number().min(0),
  }).optional(),
});

// System Design task schemas
export const SystemDesignInputSchema = z.object({
  requirements: z.array(z.object({
    type: z.enum(['functional', 'non-functional']),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })),
  constraints: z.array(z.string()).optional(),
  preferences: z.object({
    technology: z.array(z.string()).optional(),
    architecture: z.array(z.string()).optional(),
  }).optional(),
});

export const SystemDesignOutputSchema = z.object({
  architecture: z.object({
    components: z.array(z.string()),
    interactions: z.array(z.object({
      from: z.string(),
      to: z.string(),
      type: z.string(),
    })),
  }),
  techStack: z.object({
    frontend: z.array(z.string()).optional(),
    backend: z.array(z.string()).optional(),
    database: z.array(z.string()).optional(),
  }),
  recommendations: z.array(z.string()),
});

// Code Generation task schemas
export const CodeGenerationInputSchema = z.object({
  language: z.enum(['typescript', 'javascript', 'python']),
  framework: z.string().optional(),
  specifications: z.object({
    components: z.array(z.object({
      name: z.string(),
      type: z.string(),
      props: z.record(z.any()).optional(),
    })),
    apis: z.array(z.object({
      path: z.string(),
      method: z.string(),
      params: z.record(z.any()).optional(),
    })).optional(),
  }),
});

export const CodeGenerationOutputSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })),
  dependencies: z.record(z.string()),
  documentation: z.array(z.object({
    type: z.string(),
    content: z.string(),
  })).optional(),
});

// Data Processing task schemas
export const DataProcessingInputSchema = z.object({
  source: z.object({
    type: z.enum(['pdf', 'image', 'text']),
    content: z.string(),
  }),
  extraction: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean().optional(),
    })),
    format: z.enum(['json', 'csv', 'xml']),
  }),
});

export const DataProcessingOutputSchema = z.object({
  extracted: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()),
});

// Task validation functions
export function validateTaskInput(type: string, data: any): boolean {
  try {
    switch (type) {
      case 'system-design':
        SystemDesignInputSchema.parse(data);
        break;
      case 'code-generation':
        CodeGenerationInputSchema.parse(data);
        break;
      case 'data-processing':
        DataProcessingInputSchema.parse(data);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    return true;
  } catch (error) {
    console.error(`Task validation failed:`, error);
    return false;
  }
}

export function validateTaskOutput(type: string, data: any): boolean {
  try {
    switch (type) {
      case 'system-design':
        SystemDesignOutputSchema.parse(data);
        break;
      case 'code-generation':
        CodeGenerationOutputSchema.parse(data);
        break;
      case 'data-processing':
        DataProcessingOutputSchema.parse(data);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    return true;
  } catch (error) {
    console.error(`Output validation failed:`, error);
    return false;
  }
}