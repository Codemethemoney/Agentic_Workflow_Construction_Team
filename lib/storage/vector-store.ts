import { VectorDB } from 'vectordb';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export class VectorStore {
  private db: VectorDB;
  private embeddings: OpenAIEmbeddings;
  private static instance: VectorStore;

  private constructor() {
    this.db = new VectorDB({
      dimensions: 1536, // OpenAI embedding dimensions
      metric: 'cosine',
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static async getInstance(): Promise<VectorStore> {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  public async addDocument(doc: VectorDocument): Promise<void> {
    if (!doc.embedding) {
      const [embedding] = await this.embeddings.embedDocuments([doc.content]);
      doc.embedding = embedding;
    }

    await this.db.insert({
      id: doc.id,
      vector: doc.embedding,
      metadata: {
        content: doc.content,
        ...doc.metadata,
      },
    });
  }

  public async addDocuments(docs: VectorDocument[]): Promise<void> {
    const contents = docs.filter(doc => !doc.embedding).map(doc => doc.content);
    const embeddings = contents.length > 0 ? 
      await this.embeddings.embedDocuments(contents) : [];

    let embeddingIndex = 0;
    const vectors = docs.map(doc => ({
      id: doc.id,
      vector: doc.embedding || embeddings[embeddingIndex++],
      metadata: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    await this.db.insertMany(vectors);
  }

  public async similaritySearch(
    query: string,
    k: number = 5
  ): Promise<VectorDocument[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const results = await this.db.search({
      vector: queryEmbedding,
      k,
    });

    return results.map(result => ({
      id: result.id,
      content: result.metadata.content,
      metadata: { ...result.metadata, score: result.score },
      embedding: result.vector,
    }));
  }

  public async deleteDocument(id: string): Promise<void> {
    await this.db.delete(id);
  }

  public async updateDocument(doc: VectorDocument): Promise<void> {
    await this.deleteDocument(doc.id);
    await this.addDocument(doc);
  }
}