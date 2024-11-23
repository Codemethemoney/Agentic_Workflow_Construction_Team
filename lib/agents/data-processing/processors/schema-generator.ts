import { z } from 'zod';
import { SchemaOptions } from './types';

export class SchemaGenerator {
  async inferSchema(data: any, options: SchemaOptions = {}): Promise<z.ZodSchema> {
    const schemaType = this.inferType(data);
    return this.generateZodSchema(schemaType, options);
  }

  private inferType(value: any): SchemaType {
    if (Array.isArray(value)) {
      const elementTypes = value.map(item => this.inferType(item));
      return {
        type: 'array',
        elementType: this.mergeTypes(elementTypes),
      };
    }

    if (value === null) {
      return { type: 'null' };
    }

    if (typeof value === 'object') {
      const properties: Record<string, SchemaType> = {};
      for (const [key, val] of Object.entries(value)) {
        properties[key] = this.inferType(val);
      }
      return {
        type: 'object',
        properties,
      };
    }

    return {
      type: typeof value as 'string' | 'number' | 'boolean',
      format: this.inferFormat(value),
    };
  }

  private inferFormat(value: any): string | undefined {
    if (typeof value === 'string') {
      if (isDate(value)) return 'date';
      if (isEmail(value)) return 'email';
      if (isURL(value)) return 'url';
      if (isPhoneNumber(value)) return 'phone';
    }
    return undefined;
  }

  private mergeTypes(types: SchemaType[]): SchemaType {
    if (types.length === 0) return { type: 'any' };
    if (types.length === 1) return types[0];

    const uniqueTypes = new Set(types.map(t => t.type));
    if (uniqueTypes.size === 1) {
      const type = types[0].type;
      if (type === 'object') {
        return {
          type: 'object',
          properties: this.mergeObjectProperties(
            types as Array<{ type: 'object'; properties: Record<string, SchemaType> }>
          ),
        };
      }
      if (type === 'array') {
        return {
          type: 'array',
          elementType: this.mergeTypes(
            types
              .filter(t => t.type === 'array')
              .map(t => (t as { elementType: SchemaType }).elementType)
          ),
        };
      }
    }

    return { type: 'any' };
  }

  private mergeObjectProperties(
    objects: Array<{ type: 'object'; properties: Record<string, SchemaType> }>
  ): Record<string, SchemaType> {
    const allProperties = new Set<string>();
    objects.forEach(obj => {
      Object.keys(obj.properties).forEach(key => allProperties.add(key));
    });

    const mergedProperties: Record<string, SchemaType> = {};
    for (const prop of allProperties) {
      const propertyTypes = objects
        .map(obj => obj.properties[prop])
        .filter(t => t !== undefined);
      mergedProperties[prop] = this.mergeTypes(propertyTypes);
    }

    return mergedProperties;
  }

  private generateZodSchema(type: SchemaType, options: SchemaOptions): z.ZodSchema {
    switch (type.type) {
      case 'string':
        let schema = z.string();
        if (type.format === 'date') schema = schema.datetime();
        if (type.format === 'email') schema = schema.email();
        if (type.format === 'url') schema = schema.url();
        return schema;

      case 'number':
        return z.number();

      case 'boolean':
        return z.boolean();

      case 'array':
        return z.array(this.generateZodSchema(type.elementType, options));

      case 'object':
        const shape: Record<string, z.ZodSchema> = {};
        for (const [key, value] of Object.entries(type.properties)) {
          shape[key] = this.generateZodSchema(value, options);
        }
        return z.object(shape);

      case 'null':
        return z.null();

      default:
        return z.any();
    }
  }
}

interface SchemaType {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'any';
  format?: string;
  elementType?: SchemaType;
  properties?: Record<string, SchemaType>;
}

function isDate(value: string): boolean {
  return !isNaN(Date.parse(value));
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isPhoneNumber(value: string): boolean {
  return /^\+?[\d\s-()]+$/.test(value);</content>