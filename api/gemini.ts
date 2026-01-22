
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { model, contents, config } = body;
    
    // Get API Key from environment variables
    // Support multiple env var names for compatibility
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      console.error('Missing API Key configuration');
      return new Response(JSON.stringify({ 
        error: 'Server Configuration Error: Missing API Key' 
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get Model
    // Use the model requested by client, or fallback
    const modelId = model || 'gemini-2.0-flash-exp';

    // Extract systemInstruction and tools from config, as they belong to model initialization
    // generationConfig should only contain generation parameters (temperature, topP, etc.)
    const { systemInstruction, tools, ...generationConfig } = config || {};

    const aiModel = genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction,
      tools
    });

    // Generate Content
    const result = await aiModel.generateContent({
      contents,
      generationConfig,
    });

    const response = result.response;
    
    // Return the response as JSON
    return new Response(JSON.stringify(response), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' 
      },
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Determine status code
    let status = 500;
    let message = error.message || 'Internal Server Error';

    if (message.includes('429') || message.includes('quota')) {
      status = 429;
    } else if (message.includes('400') || message.includes('INVALID_ARGUMENT')) {
      status = 400;
    }

    return new Response(JSON.stringify({ 
      error: message,
      details: error 
    }), { 
      status, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
