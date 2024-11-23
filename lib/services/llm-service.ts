import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export class LLMService {
  private static instance: LLMService;
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  private constructor() {
    // Initialize clients with environment variables if available
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
  }

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  public initializeClients(openaiKey?: string, anthropicKey?: string): void {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
  }

  public async query(
    message: string,
    model: string = 'gpt-4',
    systemInstructions?: string
  ): Promise<string> {
    try {
      if (model.startsWith('gpt')) {
        if (!this.openai) {
          throw new Error('OpenAI client not initialized');
        }
        return this.queryOpenAI(message, model, systemInstructions);
      } else if (model.startsWith('claude')) {
        if (!this.anthropic) {
          throw new Error('Anthropic client not initialized');
        }
        return this.queryAnthropic(message, model, systemInstructions);
      }
      throw new Error(`Unsupported model: ${model}`);
    } catch (error) {
      console.error('LLM query error:', error);
      throw error;
    }
  }

  private async queryOpenAI(
    message: string,
    model: string,
    systemInstructions?: string
  ): Promise<string> {
    try {
      const response = await this.openai!.chat.completions.create({
        model,
        messages: [
          ...(systemInstructions ? [{ role: 'system', content: systemInstructions }] : []),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  private async queryAnthropic(
    message: string,
    model: string,
    systemInstructions?: string
  ): Promise<string> {
    try {
      const response = await this.anthropic!.messages.create({
        model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: message }],
        system: systemInstructions,
      });

      return response.content[0]?.text || '';
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }
}