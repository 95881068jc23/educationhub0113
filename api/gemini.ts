
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
    
    // Get API Key
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Server Configuration Error: Missing API Key' 
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Extract systemInstruction and tools from config
    const { systemInstruction, tools, ...generationConfig } = config || {};

    // Construct request body for REST API
    const requestBody: any = {
      contents,
      generationConfig,
    };

    if (systemInstruction) {
      if (typeof systemInstruction === 'string') {
        requestBody.systemInstruction = {
          role: "system",
          parts: [{ text: systemInstruction }]
        };
      } else {
        requestBody.systemInstruction = systemInstruction;
      }
    }
    
    if (tools) {
      requestBody.tools = tools;
    }

    // Use custom base URL: https://api.n1n.ai
    // Use streamGenerateContent with SSE (Server-Sent Events) to avoid Vercel timeouts
    const modelId = model || 'gemini-2.0-flash-exp';
    const endpoint = `https://api.n1n.ai/v1/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    // Directly pipe the stream to the client
    // This allows Vercel Edge Function to start sending data immediately, preventing timeouts
    // Add custom keep-alive headers
    return new Response(response.body, {
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Vercel
      },
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    let status = 500;
    let message = error.message || 'Internal Server Error';

    if (message.includes('429') || message.includes('quota')) {
      status = 429;
    } else if (message.includes('400')) {
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
