import { NextResponse } from "next/server";
import { LLMService } from "@/lib/services/llm-service";

const llmService = LLMService.getInstance();

export async function POST(req: Request) {
  try {
    const { message, model, systemInstructions } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get API keys from environment variables
    const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      return NextResponse.json(
        { error: "No API keys configured" },
        { status: 500 }
      );
    }

    // Initialize LLM service with API keys
    llmService.initializeClients(openaiKey, anthropicKey);

    // Get response from LLM
    const response = await llmService.query(
      message,
      model || 'gpt-4',
      systemInstructions
    );

    if (!response) {
      throw new Error("No response received from LLM");
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to process request",
        details: error.stack
      },
      { status: 500 }
    );
  }
}