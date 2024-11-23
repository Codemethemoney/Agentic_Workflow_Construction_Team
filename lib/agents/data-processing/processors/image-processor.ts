import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { DocumentType, ProcessingResult } from './types';

export class ImageProcessor {
  private worker: Tesseract.Worker | null = null;
  private languages: Map<string, boolean>;

  constructor() {
    this.languages = new Map([
      ['eng', true], // English is always loaded
      ['fra', false], // French
      ['deu', false], // German
      ['spa', false], // Spanish
      ['chi_sim', false], // Simplified Chinese
      ['jpn', false], // Japanese
    ]);
  }

  async initialize(): Promise<void> {
    this.worker = await Tesseract.createWorker('eng');
  }

  async loadLanguage(lang: string): Promise<void> {
    if (!this.languages.has(lang)) {
      throw new Error(`Unsupported language: ${lang}`);
    }

    if (!this.languages.get(lang)) {
      await this.worker?.loadLanguage(lang);
      await this.worker?.initialize(lang);
      this.languages.set(lang, true);
    }
  }

  async process(
    image: Buffer,
    options: {
      language?: string;
      preprocessing?: {
        resize?: { width?: number; height?: number };
        sharpen?: boolean;
        normalize?: boolean;
        threshold?: boolean;
        deskew?: boolean;
      };
    } = {}
  ): Promise<ProcessingResult> {
    if (!this.worker) {
      throw new Error('Image processor not initialized');
    }

    // Load requested language if needed
    if (options.language && options.language !== 'eng') {
      await this.loadLanguage(options.language);
    }

    // Preprocess image
    const preprocessed = await this.preprocessImage(image, options.preprocessing);

    // Perform OCR
    const { data } = await this.worker.recognize(preprocessed);

    return {
      type: DocumentType.Image,
      content: data.text,
      metadata: {
        confidence: data.confidence / 100,
        language: data.language,
        timestamp: Date.now(),
      },
      extracted: {
        text: data.text,
        fields: await this.extractFields(data),
        tables: await this.extractTables(data),
      },
    };
  }

  private async preprocessImage(
    image: Buffer,
    options: {
      resize?: { width?: number; height?: number };
      sharpen?: boolean;
      normalize?: boolean;
      threshold?: boolean;
      deskew?: boolean;
    } = {}
  ): Promise<Buffer> {
    let pipeline = sharp(image);

    // Apply preprocessing steps
    if (options.resize) {
      pipeline = pipeline.resize(options.resize.width, options.resize.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (options.normalize) {
      pipeline = pipeline.normalize();
    }

    if (options.sharpen) {
      pipeline = pipeline.sharpen();
    }

    if (options.threshold) {
      pipeline = pipeline.threshold();
    }

    // Convert to grayscale for better OCR
    pipeline = pipeline.grayscale();

    if (options.deskew) {
      // Implement deskewing logic here
      // This would involve detecting and correcting image rotation
    }

    return await pipeline.toBuffer();
  }

  private async extractFields(data: Tesseract.RecognizeResult): Promise<Record<string, any>> {
    const fields: Record<string, any> = {};

    // Process words and their positions
    data.words?.forEach(word => {
      // Implement field extraction based on position and context
      const fieldType = this.inferFieldType(word.text, word.confidence);
      if (fieldType) {
        fields[fieldType] = word.text;
      }
    });

    return fields;
  }

  private async extractTables(data: Tesseract.RecognizeResult): Promise<Array<{
    headers: string[];
    rows: any[][];
  }>> {
    const tables: Array<{
      headers: string[];
      rows: any[][];
    }> = [];

    // Implement table detection and extraction
    // This would involve analyzing line positions and word alignments
    // to detect table structures

    return tables;
  }

  private inferFieldType(text: string, confidence: number): string | null {
    // Implement field type inference based on content and context
    if (isDate(text)) return 'date';
    if (isEmail(text)) return 'email';
    if (isPhoneNumber(text)) return 'phone';
    if (isCurrency(text)) return 'amount';
    return null;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

function isDate(text: string): boolean {
  return !isNaN(Date.parse(text));
}

function isEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function isPhoneNumber(text: string): boolean {
  return /^\+?[\d\s-()]+$/.test(text);
}

function isCurrency(text: string): boolean {
  return /^[$€£¥]?\d+([.,]\d{2})?$/.test(text);
}</content>