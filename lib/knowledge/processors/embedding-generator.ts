import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

export class EmbeddingGenerator {
  private embeddings: OpenAIEmbeddings;
  private cache: Map<string, number[]>;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.cache = new Map();
  }

  async initialize(): Promise<void> {
    // Verify API key and connection
    await this.embeddings.embedQuery('test');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.generateCacheKey(text);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const embedding = await this.embeddings.embedQuery(text);
    this.cache.set(cacheKey, embedding);
    
    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await this.embeddings.embedDocuments(texts);
    
    texts.forEach((text, index) => {
      const cacheKey = this.generateCacheKey(text);
      this.cache.set(cacheKey, embeddings[index]);
    });

    return embeddings;
  }

  private generateCacheKey(text: string): string {
    // Generate a cache key based on text content
    return Buffer.from(text).toString('base64');
  }

  async cleanup(): Promise<void> {
    this.cache.clear();
  }
}</content>