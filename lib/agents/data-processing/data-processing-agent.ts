import { BaseAgent } from '../base-agent';
import { AgentTask, AgentResult } from '../types';
import {
  DocumentProcessor,
  ImageProcessor,
  SchemaGenerator,
  DataCleaner,
  ProcessingResult,
  DocumentType,
  ExtractionConfig,
  ValidationResult,
  CleaningConfig
} from './processors';
import { VectorStore } from '@/lib/storage/vector-store';
import { WebSocketManager } from '@/lib/websocket/connection-manager';

export class DataProcessingAgent extends BaseAgent {
  private documentProcessor: DocumentProcessor;
  private imageProcessor: ImageProcessor;
  private schemaGenerator: SchemaGenerator;
  private dataCleaner: DataCleaner;
  private vectorStore: VectorStore;
  private wsManager: WebSocketManager;

  constructor(id: string) {
    super(id, 'data-processing');
    this.documentProcessor = new DocumentProcessor();
    this.imageProcessor = new ImageProcessor();
    this.schemaGenerator = new SchemaGenerator();
    this.dataCleaner = new DataCleaner();
    this.wsManager = new WebSocketManager();
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    this.vectorStore = await VectorStore.getInstance();
    await this.loadProcessingModels();
  }

  private async loadProcessingModels(): Promise<void> {
    await Promise.all([
      this.documentProcessor.initialize(),
      this.imageProcessor.initialize(),
      this.dataCleaner.initialize()
    ]);
  }

  private setupEventHandlers(): void {
    this.wsManager.on('message', async ({ message }) => {
      switch (message.type) {
        case 'PROCESSING_STATUS':
          this.broadcastStatus(message.payload.taskId);
          break;
        case 'VALIDATION_RESULT':
          this.handleValidationResult(message.payload);
          break;
      }
    });
  }

  public async processTask(task: AgentTask): Promise<AgentResult> {
    this.status = 'busy';

    try {
      switch (task.data.action) {
        case 'process_document':
          return await this.processDocument(task);
        case 'extract_data':
          return await this.extractData(task);
        case 'generate_schema':
          return await this.generateSchema(task);
        case 'clean_data':
          return await this.cleanData(task);
        default:
          throw new Error(`Unsupported action: ${task.data.action}`);
      }
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failure',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.status = 'idle';
    }
  }

  private async processDocument(task: AgentTask): Promise<AgentResult> {
    const { document, type, language } = task.data;
    
    // Determine document type and processing strategy
    const documentType = this.determineDocumentType(type);
    const processingResult = await this.documentProcessor.process(document, documentType, language);
    
    // Store processing result in vector store for future reference
    await this.storeProcessingResult(task.id, processingResult);

    return {
      taskId: task.id,
      status: 'success',
      data: processingResult,
    };
  }

  private async extractData(task: AgentTask): Promise<AgentResult> {
    const { document, config } = task.data;
    
    // Configure extraction based on document type and requirements
    const extractionConfig = this.createExtractionConfig(config);
    const extractedData = await this.documentProcessor.extract(document, extractionConfig);
    
    // Generate schema for extracted data
    const schema = await this.schemaGenerator.inferSchema(extractedData);
    
    // Validate extracted data against schema
    const validationResult = await this.validateExtractedData(extractedData, schema);
    
    if (!validationResult.valid) {
      return {
        taskId: task.id,
        status: 'failure',
        data: null,
        error: `Data validation failed: ${validationResult.errors.join(', ')}`,
      };
    }

    return {
      taskId: task.id,
      status: 'success',
      data: {
        extracted: extractedData,
        schema,
      },
    };
  }

  private async generateSchema(task: AgentTask): Promise<AgentResult> {
    const { data, options } = task.data;
    
    const schema = await this.schemaGenerator.inferSchema(data, options);
    await this.storeSchema(task.id, schema);

    return {
      taskId: task.id,
      status: 'success',
      data: schema,
    };
  }

  private async cleanData(task: AgentTask): Promise<AgentResult> {
    const { data, config } = task.data;
    
    const cleaningConfig = this.createCleaningConfig(config);
    const cleanedData = await this.dataCleaner.clean(data, cleaningConfig);
    
    // Validate cleaned data
    const schema = await this.schemaGenerator.inferSchema(cleanedData);
    const validationResult = await this.validateExtractedData(cleanedData, schema);
    
    if (!validationResult.valid) {
      return {
        taskId: task.id,
        status: 'failure',
        data: null,
        error: `Data cleaning validation failed: ${validationResult.errors.join(', ')}`,
      };
    }

    return {
      taskId: task.id,
      status: 'success',
      data: {
        cleaned: cleanedData,
        schema,
        stats: await this.dataCleaner.getStats(),
      },
    };
  }

  private determineDocumentType(type: string): DocumentType {
    switch (type.toLowerCase()) {
      case 'pdf':
        return DocumentType.PDF;
      case 'image':
        return DocumentType.Image;
      case 'text':
        return DocumentType.Text;
      default:
        throw new Error(`Unsupported document type: ${type}`);
    }
  }

  private createExtractionConfig(config: any): ExtractionConfig {
    return {
      fields: config.fields || [],
      format: config.format || 'json',
      validation: config.validation || {},
      ocr: config.ocr || false,
      language: config.language || 'eng',
    };
  }

  private createCleaningConfig(config: any): CleaningConfig {
    return {
      removeNulls: config.removeNulls ?? true,
      removeDuplicates: config.removeDuplicates ?? true,
      standardizeFormats: config.standardizeFormats ?? true,
      enrichment: config.enrichment || {},
    };
  }

  private async validateExtractedData(data: any, schema: any): Promise<ValidationResult> {
    try {
      await schema.parseAsync(data);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: error.errors.map(e => e.message),
      };
    }
  }

  private async storeProcessingResult(id: string, result: ProcessingResult): Promise<void> {
    await this.vectorStore.addDocument({
      id,
      content: JSON.stringify(result),
      metadata: {
        type: 'processing-result',
        timestamp: Date.now(),
        documentType: result.type,
      },
    });
  }

  private async storeSchema(id: string, schema: any): Promise<void> {
    await this.vectorStore.addDocument({
      id: `schema-${id}`,
      content: JSON.stringify(schema),
      metadata: {
        type: 'data-schema',
        timestamp: Date.now(),
      },
    });
  }

  private broadcastStatus(taskId: string): void {
    const status = {
      taskId,
      timestamp: Date.now(),
      agent: this.getId(),
      status: this.status,
    };
    this.wsManager.broadcast('PROCESSING_STATUS', status);
  }

  private handleValidationResult(result: ValidationResult): void {
    if (!result.valid) {
      this.emit('error', {
        type: 'validation_error',
        details: result.errors,
      });
    }
  }

  public async cleanup(): void {
    this.wsManager.cleanup();
    await this.documentProcessor.cleanup();
    await this.imageProcessor.cleanup();
    await this.dataCleaner.cleanup();
  }
}