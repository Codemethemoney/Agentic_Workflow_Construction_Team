import { ChunkingConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ChunkManager {
  async createChunks(
    content: string,
    config: ChunkingConfig
  ): Promise<Array<{
    id: string;
    content: string;
    embedding?: number[];
    metadata: Record<string, any>;
  }>> {
    const rawChunks = await this.splitContent(content, config);
    
    return rawChunks.map(chunk => ({
      id: uuidv4(),
      content: chunk,
      metadata: {
        chunkSize: chunk.length,
        createdAt: Date.now(),
      },
    }));
  }

  private async splitContent(
    content: string,
    config: ChunkingConfig
  ): Promise<string[]> {
    switch (config.splitBy) {
      case 'token':
        return this.splitByTokens(content, config);
      case 'sentence':
        return this.splitBySentences(content, config);
      case 'paragraph':
        return this.splitByParagraphs(content, config);
      default:
        throw new Error(`Unsupported split method: ${config.splitBy}`);
    }
  }

  private splitByTokens(content: string, config: ChunkingConfig): string[] {
    const tokens = content.split(/\s+/);
    return this.createOverlappingChunks(tokens, config)
      .map(chunk => chunk.join(' '));
  }

  private splitBySentences(content: string, config: ChunkingConfig): string[] {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    return this.createOverlappingChunks(sentences, config)
      .map(chunk => chunk.join(' '));
  }

  private splitByParagraphs(content: string, config: ChunkingConfig): string[] {
    const paragraphs = content.split(/\n\s*\n/);
    return this.createOverlappingChunks(paragraphs, config)
      .map(chunk => chunk.join('\n\n'));
  }

  private createOverlappingChunks(
    items: string[],
    config: ChunkingConfig
  ): string[][] {
    const chunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentSize = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      currentChunk.push(item);
      currentSize += item.length;

      if (currentSize >= config.chunkSize) {
        chunks.push([...currentChunk]);
        
        // Move back by overlap amount
        while (currentSize > config.chunkOverlap && currentChunk.length > 0) {
          const removed = currentChunk.shift()!;
          currentSize -= removed.length;
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}</content>