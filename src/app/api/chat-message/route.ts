import { NextResponse } from 'next/server';

// Add a configuration to ensure this route is dynamic
export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = 'AIzaSyBa6bak7Z_RlKZvVE7C5pSRmPVGxUQxzL8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: message }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data); // For debugging

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    return NextResponse.json({
      response: data.candidates[0].content.parts[0].text
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
