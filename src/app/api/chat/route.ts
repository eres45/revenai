import { NextRequest, NextResponse } from 'next/server';
import Groq from "groq-sdk";
import { MODELS, MODEL_CONFIGS } from "@/config/models";
import { trackChatRequest } from '@/services/firestore-service';
import { cookies } from 'next/headers';

// Add a configuration to ensure this route is dynamic
export const dynamic = 'force-dynamic';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ""
});

export async function POST(req: NextRequest) {
  // Default to anonymous user
  let userEmail = 'anonymous@fortecai.com';
  
  // Get the cookie directly from the request headers to avoid Next.js cookie API issues
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const userEmailCookie = cookies.find(cookie => cookie.trim().startsWith('userEmail='));
    if (userEmailCookie) {
      userEmail = userEmailCookie.split('=')[1].trim();
    }
  }
  
  let userInput = '';
  let model = MODELS.MISTRAL;
  
  try {
    const body = await req.json();
    // Fix the parameter handling - use "model" directly from the request body
    const { messages, model: modelFromRequest = MODELS.MISTRAL } = body;
    
    // Set the model and user input for tracking in case of errors
    model = modelFromRequest;
    userInput = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Server-side model validation
    if (!Object.values(MODELS).includes(model)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }
    
    // Get the user's input message
    userInput = messages[messages.length - 1].content;

    const modelConfig = MODEL_CONFIGS[model];
    let responseText = "";
    let isSuccessful = false;

    if (model === MODELS.GEMINI) {
      // Use Gemini 2 Flash API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const geminiResponse = await fetch(`${modelConfig.apiUrl}?key=${modelConfig.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: messages[messages.length - 1].content }]
            }],
            generationConfig: {
              temperature: modelConfig.temperature,
              maxOutputTokens: modelConfig.maxTokens,
            },
          }),
          signal: controller.signal
        });

        if (!geminiResponse.ok) {
          const error = await geminiResponse.json().catch(() => ({}));
          const statusCode = geminiResponse.status;
          throw new Error(`Gemini API request failed: Status ${statusCode} - ${error.error?.message || 'No error details available'}`);
        }

        const data = await geminiResponse.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";
        isSuccessful = true;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Gemini API request timed out after 30 seconds');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    } else if (model === MODELS.LLAMA_70B || model === MODELS.QWEN_CODER) {
      try {
        // Use Groq API for LLaMA and Qwen models
        const completion = await groq.chat.completions.create({
          messages: messages.map(m => ({
            role: m.isUser ? "user" : "assistant",
            content: m.content,
          })),
          model: model,
          temperature: modelConfig.temperature,
          max_tokens: modelConfig.maxTokens,
        });

        responseText = completion.choices[0]?.message?.content || "No response from model";
        isSuccessful = true;
      } catch (groqError: any) {
        console.error("Groq API error:", groqError);
        throw new Error(groqError.message || "Failed to get response from Groq API");
      }
    } else {
      // Use pollinations.ai Text Generation API for all the new models
      const userPrompt = messages[messages.length - 1].content;
      const modelAlias = modelConfig.alias || model;
      const modelName = modelConfig.name;
      
      console.log(`Using model: ${modelName}, alias: ${modelAlias}`);
      
      // Create a prompt with accurate model identification instructions
      const enhancedPrompt = `You are an advanced AI assistant. You are ${modelName} created by the company that developed the ${modelAlias} model. Please provide a detailed, comprehensive, and helpful response to the following query.

IMPORTANT: Do not identify yourself in every response. Only identify yourself when explicitly asked about your identity or model. Never claim to be based on GPT-4 or any other model architecture you're not based on. Be accurate about your true identity.

User query: ${userPrompt}`;
      
      // Using pollinations.ai Text Generation API with proper URL encoding
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const encodedModel = encodeURIComponent(modelAlias);
      const textGenUrl = `https://text.pollinations.ai/${encodedPrompt}?model=${encodedModel}`;
      
      console.log(`Calling pollinations.ai with URL: ${textGenUrl.substring(0, 100)}...`);
      
      // Add timeout and retry mechanism for reliability
      const MAX_RETRIES = 2;
      let retries = 0;
      let lastError: Error | null = null;
      
      while (retries <= MAX_RETRIES) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          console.log(`Attempt ${retries + 1}/${MAX_RETRIES + 1} for model ${modelAlias}`);
          const textGenResponse = await fetch(textGenUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'text/plain',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
        
          if (!textGenResponse.ok) {
            const statusCode = textGenResponse.status;
            const errorText = await textGenResponse.text().catch(() => 'No error details available');
            throw new Error(`Text generation API request failed: Status ${statusCode} - ${errorText}`);
          }

          responseText = await textGenResponse.text();
          console.log(`Got response from pollinations.ai: ${responseText.substring(0, 100)}...`);
          isSuccessful = true;
          break; // Success, exit the retry loop
        } catch (error: any) {
          lastError = error;
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            console.log(`Attempt ${retries + 1} timed out for model ${modelAlias}`);
          } else {
            console.log(`Attempt ${retries + 1} failed for model ${modelAlias}: ${error.message}`);
          }
          
          // If we've reached max retries, throw error
           if (retries === MAX_RETRIES) {
             if (error.name === 'AbortError') {
               throw new Error(`Text generation API request timed out after ${MAX_RETRIES + 1} attempts`);
             }
             throw error;
           }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } finally {
          clearTimeout(timeoutId);
      }
    }
    }

    // Track the chat request in Firestore
    if (userEmail !== 'anonymous@fortecai.com') {
      try {
        console.log('[Chat API] Tracking chat request for:', userEmail, 'with model:', model);
        await trackChatRequest(
          userEmail,
          model,
          userInput,
          responseText,
          isSuccessful
        );
        console.log('[Chat API] Chat request tracked successfully');
      } catch (error) {
        console.error("[Chat API] Failed to track chat request:", error);
        // Continue even if tracking fails
      }
    } else {
      console.log('[Chat API] Skipping tracking for anonymous user');
    }

    // Set a cookie for the user email if it doesn't exist
    const response = NextResponse.json({ 
      text: responseText,
      model: model,
      timestamp: new Date().toISOString()
    });
    
    // Set the cookie in the response
    if (userEmail === 'anonymous@fortecai.com' && req.cookies.get('userEmail') === undefined) {
      response.cookies.set({
        name: 'userEmail',
        value: userEmail,
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;

  } catch (error: any) {
    console.error("Chat error:", error);
    
    // Track the failed request if we have enough info and a valid user
    if (userInput && userEmail !== 'anonymous@fortecai.com') {
      try {
        await trackChatRequest(
          userEmail,
          model,
          userInput,
          '',
          false
        );
      } catch (trackError) {
        console.error("Failed to track error:", trackError);
      }
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
