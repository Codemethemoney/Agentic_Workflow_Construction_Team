import { CleaningConfig, CleaningStats } from './types';

export class DataCleaner {
  private stats: CleaningStats;

  constructor() {
    this.resetStats();
  }

  async initialize(): Promise<void> {
    // Initialize any required resources
  }

  async clean(data: any, config: CleaningConfig): Promise<any> {
    this.resetStats();
    const startTime = Date.now();

    let cleanedData = data;

    // Handle different data structures
    if (Array.isArray(data)) {
      cleanedData = await this.cleanArray(data, config);
    } else if (typeof data === 'object' && data !== null) {
      cleanedData = await this.cleanObject(data, config);
    }

    this.stats.processingTime = Date.now() - startTime;
    return cleanedData;
  }

  private async cleanArray(data: any[], config: CleaningConfig): Promise<any[]> {
    this.stats.totalRecords = data.length;
    let cleaned = [...data];

    // Remove null/undefined values
    if (config.removeNulls) {
      const originalLength = cleaned.length;
      cleaned = cleaned.filter(item => item != null);
      this.stats.nullsRemoved += originalLength - cleaned.length;
    }

    // Remove duplicates
    if (config.removeDuplicates) {
      const originalLength = cleaned.length;
      cleaned = await this.removeDuplicates(cleaned);
      this.stats.duplicatesRemoved += originalLength - cleaned.length;
    }

    // Clean individual items
    cleaned = await Promise.all(
      cleaned.map(item => this.cleanObject(item, config))
    );

    return cleaned;
  }

  private async cleanObject(data: Record<string, any>, config: CleaningConfig): Promise<Record<string, any>> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip null values if configured
      if (config.removeNulls && value == null) {
        this.stats.nullsRemoved++;
        continue;
      }

      // Standardize formats if configured
      if (config.standardizeFormats) {
        cleaned[key] = await this.standardizeValue(value, key);
        if (cleaned[key] !== value) {
          this.stats.standardizedFields.push(key);
        }
      } else {
        cleaned[key] = value;
      }
    }

    // Apply enrichment if configured
    if (config.enrichment) {
      await this.enrichData(cleaned, config.enrichment);
    }

    return cleaned;
  }

  private async removeDuplicates(data: any[]): Promise<any[]> {
    // Handle complex objects by converting to JSON for comparison
    const seen = new Set();
    return data.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async standardizeValue(value: any, field: string): Promise<any> {
    if (typeof value === 'string') {
      // Standardize dates
      if (isDate(value)) {
        return new Date(value).toISOString();
      }

      // Standardize phone numbers
      if (isPhoneNumber(value)) {
        return standardizePhoneNumber(value);
      }

      // Standardize email addresses
      if (isEmail(value)) {
        return value.toLowerCase().trim();
      }

      // General string cleanup
      return value.trim();
    }

    return value;
  }

  private async enrichData(
    data: Record<string, any>,
    enrichment: NonNullable<CleaningConfig['enrichment']>
  ): Promise<void> {
    if (!enrichment.fields || !enrichment.sources) return;

    for (const field of enrichment.fields) {
      if (data[field]) {
        const enrichedValue = await this.fetchEnrichmentData(
          data[field],
          enrichment.sources
        );
        if (enrichedValue) {
          data[`${field}_enriched`] = enrichedValue;
          this.stats.enrichedFields.push(field);
        }
      }
    }
  }

  private async fetchEnrichmentData(value: any, sources: string[]): Promise<any> {
    // Implementation of data enrichment from external sources
    return null;
  }

  public getStats(): CleaningStats {
    return { ...this.stats };
  }

  private resetStats(): void {
    this.stats = {
      totalRecords: 0,
      nullsRemoved: 0,
      duplicatesRemoved: 0,
      standardizedFields: [],
      enrichedFields: [],
      processingTime: 0,
    };
  }

  async cleanup(): void {
    // Cleanup any resources
  }
}

function isDate(value: string): boolean {
  return !isNaN(Date.parse(value));
}

function isPhoneNumber(value: string): boolean {
  return /^\+?[\d\s-()]+$/.test(value);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function standardizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as international number if it starts with country code
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  // Format as local number
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}</content>