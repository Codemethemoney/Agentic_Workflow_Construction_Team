import { EventEmitter } from 'events';
import { VectorStore } from '../storage/vector-store';
import { RedisClient } from '../storage/redis-client';
import { Document, SearchQuery, SearchResult, ChunkingConfig } from './types';
import { DocumentProcessor } from './processors/document-processor';
import { EmbeddingGenerator } from './processors/embedding-generator';
import { ChunkManager } from './processors/chunk-manager';

export class KnowledgeManager extends EventEmitter {
  private vectorStore: VectorStore;
  private redis: RedisClient;
  private documentProcessor: DocumentProcessor;
  private embeddingGenerator: EmbeddingGenerator;
  private chunkManager: ChunkManager;
  private static instance: KnowledgeManager;

  private constructor() {
    super();
    this.vectorStore = VectorStore.getInstance();
    this.redis = RedisClient.getInstance();
    this.documentProcessor = new DocumentProcessor();
    this.embeddingGenerator = new EmbeddingGenerator();
    this.chunkManager = new ChunkManager();
  }

  public static async getInstance(): Promise<KnowledgeManager> {
    if (!KnowledgeManager.instance) {
      KnowledgeManager.instance = new KnowledgeManager();
      await KnowledgeManager.instance.initialize();
    }
    return KnowledgeManager.instance;
  }

  private async initialize(): Promise<void> {
    await Promise.all([
      this.documentProcessor.initialize(),
      this.embeddingGenerator.initialize(),
    ]);
  }

  public async addDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    try {
      // Process document
      const processedDoc = await this.documentProcessor.process(document);

      // Generate chunks if needed
      if (this.shouldChunkDocument(processedDoc)) {
        processedDoc.chunks = await this.chunkManager.createChunks(
          processedDoc.content,
          this.getChunkingConfig(processedDoc.type)
        );

        // Generate embeddings for chunks
        for (const chunk of processedDoc.chunks) {
          chunk.embedding = await this.embeddingGenerator.generateEmbedding(chunk.content);
        }
      }

      // Generate embedding for full document
      processedDoc.embedding = await this.embeddingGenerator.generateEmbedding(processedDoc.content);

      // Store document
      await this.vectorStore.addDocument(processedDoc);
      await this.storeMetadata(processedDoc);

      this.emit('documentAdded', { id: processedDoc.id });
      return processedDoc;
    } catch (error) {
      this.emit('error', { error, document });
      throw error;
    }
  }

  public async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const document = await this.vectorStore.getDocument(id);
    if (!document) {
      throw new Error(`Document not found: ${id}`);
    }

    const updatedDoc = {
      ...document,
      ...updates,
      updatedAt: Date.now(),
    };

    // Regenerate embeddings if content changed
    if (updates.content) {
      updatedDoc.embedding = await this.embeddingGenerator.generateEmbedding(updates.content);
      
      if (this.shouldChunkDocument(updatedDoc)) {
        updatedDoc.chunks = await this.chunkManager.createChunks(
          updates.content,
          this.getChunkingConfig(updatedDoc.type)
        );

        for (const chunk of updatedDoc.chunks) {
          chunk.embedding = await this.embeddingGenerator.generateEmbedding(chunk.content);
        }
      }
    }

    await this.vectorStore.updateDocument(id, updatedDoc);
    await this.updateMetadata(id, updatedDoc);

    this.emit('documentUpdated', { id });
    return updatedDoc;
  }

  public async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingGenerator.generateEmbedding(query.query);

      // Perform vector search
      const results = await this.vectorStore.search({
        embedding: queryEmbedding,
        filters: query.filters,
        limit: query.limit || 5,
        threshold: query.threshold || 0.7,
      });

      // Enhance results with chunk information if available
      return await Promise.all(results.map(async result => {
        const document = result.document as Document;
        if (document.chunks) {
          const relevantChunks = await this.findRelevantChunks(
            queryEmbedding,
            document.chunks
          );
          return {
            document,
            score: result.score,
            relevantChunks,
          };
        }
        return { document, score: result.score };
      }));
    } catch (error) {
      this.emit('error', { error, query });
      throw error;
    }
  }

  public async deleteDocument(id: string): Promise<void> {
    await this.vectorStore.deleteDocument(id);
    await this.deleteMetadata(id);
    this.emit('documentDeleted', { id });
  }

  private shouldChunkDocument(document: Document): boolean {
    return document.type === 'text' || document.type === 'pdf';
  }

  private getChunkingConfig(documentType: Document['type']): ChunkingConfig {
    switch (documentType) {
      case 'text':
        return {
          chunkSize: 1000,
          chunkOverlap: 200,
          splitBy: 'sentence',
        };
      case 'pdf':
        return {
          chunkSize: 1500,
          chunkOverlap: 300,
          splitBy: 'paragraph',
        };
      default:
        return {
          chunkSize: 500,
          chunkOverlap: 100,
          splitBy: 'token',
        };
    }
  }

  private async findRelevantChunks(
    queryEmbedding: number[],
    chunks: Document['chunks']
  ): Promise<Array<{ content: string; score: number }>> {
    const results = await this.vectorStore.searchChunks({
      embedding: queryEmbedding,
      chunks: chunks!,
      limit: 3,
      threshold: 0.6,
    });

    return results.map(result => ({
      content: result.chunk.content,
      score: result.score,
    }));
  }

  private async storeMetadata(document: Document): Promise<void> {
    const key = `doc:${document.id}:metadata`;
    await this.redis.setKey(key, JSON.stringify({
      title: document.title,
      type: document.type,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    }));
  }

  private async updateMetadata(id: string, document: Document): Promise<void> {
    const key = `doc:${id}:metadata`;
    await this.redis.setKey(key, JSON.stringify({
      title: document.title,
      type: document.type,
      metadata: document.metadata,
      updatedAt: document.updatedAt,
    }));
  }

  private async deleteMetadata(id: string): Promise<void> {
    const key = `doc:${id}:metadata`;
    await this.redis.deleteKey(key);
  }

  public async cleanup(): Promise<void> {
    await Promise.all([
      this.documentProcessor.cleanup(),
      this.embeddingGenerator.cleanup(),
    ]);
  }
}