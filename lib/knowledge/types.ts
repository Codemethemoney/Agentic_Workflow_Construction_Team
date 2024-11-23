import { z } from 'zod';

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.enum(['text', 'pdf', 'image', 'code']),
  metadata: z.record(z.any()),
  embedding?: z.array(z.number()),
  chunks?: z.array(z.object({
    id: z.string(),
    content: z.string(),
    embedding: z.array(z.number()),
    metadata: z.record(z.any()),
  })),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Document = z.infer<typeof DocumentSchema>;

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  document: Document;
  score: number;
  relevantChunks?: Array<{
    content: string;
    score: number;
  }>;
}

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  splitBy: 'token' | 'sentence' | 'paragraph';
}

export interface IndexConfig {
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  indexType: 'hnsw' | 'flat';
}</content>