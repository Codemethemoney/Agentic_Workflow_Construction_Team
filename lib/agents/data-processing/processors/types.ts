import { z } from 'zod';

export enum DocumentType {
  PDF = 'pdf',
  Image = 'image',
  Text = 'text',
}

export interface ProcessingResult {
  type: DocumentType;
  content: string;
  metadata: {
    pageCount?: number;
    language?: string;
    confidence?: number;
    timestamp: number;
  };
  extracted?: {
    text: string;
    fields: Record<string, any>;
    tables?: Array<{
      headers: string[];
      rows: any[][];
    }>;
  };
}

export interface ExtractionConfig {
  fields: Array<{
    name: string;
    type: string;
    required?: boolean;
    format?: string;
    validation?: Record<string, any>;
  }>;
  format: 'json' | 'csv' | 'xml';
  validation?: {
    schema?: Record<string, any>;
    rules?: Array<{
      field: string;
      condition: string;
      value: any;
    }>;
  };
  ocr?: boolean;
  language?: string;
}

export interface CleaningConfig {
  removeNulls: boolean;
  removeDuplicates: boolean;
  standardizeFormats: boolean;
  enrichment?: {
    sources?: string[];
    fields?: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface SchemaOptions {
  strictness?: 'strict' | 'loose';
  includeDescriptions?: boolean;
  includeExamples?: boolean;
  format?: 'zod' | 'json-schema' | 'typescript';
}

export interface CleaningStats {
  totalRecords: number;
  nullsRemoved: number;
  duplicatesRemoved: number;
  standardizedFields: string[];
  enrichedFields: string[];
  processingTime: number;
}</content>