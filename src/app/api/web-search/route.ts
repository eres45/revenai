import { NextRequest, NextResponse } from 'next/server';
import { trackWebSearch } from '@/services/firestore-service';
import { cookies } from 'next/headers';

// Add a configuration to ensure this route is dynamic
export const dynamic = 'force-dynamic';

const MAX_RETRIES = 2;
const TIMEOUT_MS = 8000;

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
  
  let query = '';
  
  try {
    const body = await req.json();
    query = body.query || '';
    
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`Web search request: "${query}"`);

    let retryCount = 0;
    let lastError: Error | null = null;
    let isSuccessful = false;

    // Try with retries
    while (retryCount <= MAX_RETRIES) {
      try {
        // Create an AbortController to manage the timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        // Call the snapzion search API
        const response = await fetch('https://search.snapzion.com/get-snippets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
          signal: controller.signal
        });

        // Clear the timeout
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Search API error (attempt ${retryCount + 1}): Status ${response.status}, Response: ${errorText}`);
          throw new Error(`Search API error: ${response.status} - ${errorText}`);
        }

        const searchData = await response.json();
        console.log(`Search successful: Retrieved ${searchData.organic_results?.length || 0} results`);
        
        isSuccessful = true;
        
        // Track this web search in Firestore
        if (userEmail !== 'anonymous@fortecai.com') {
          try {
            console.log('[Web Search API] Tracking web search for:', userEmail);
            await trackWebSearch(
              userEmail,
              query,
              true // Assume successful since we got here
            );
            console.log('[Web Search API] Web search tracked successfully');
          } catch (error) {
            console.error('[Web Search API] Failed to track web search:', error);
            // Continue even if tracking fails
          }
        } else {
          console.log('[Web Search API] Skipping tracking for anonymous user');
        }
        
        // Return the search results
        return NextResponse.json({
          organic_results: searchData.organic_results || [],
          search_metadata: searchData.search_metadata || {},
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        lastError = error;
        
        // If the error is an abort error (timeout), log it specifically
        if (error.name === 'AbortError') {
          console.error(`Search request timed out after ${TIMEOUT_MS}ms (attempt ${retryCount + 1})`);
        } else {
          console.error(`Search error (attempt ${retryCount + 1}):`, error);
        }
        
        retryCount++;
        
        if (retryCount <= MAX_RETRIES) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, retryCount), 4000);
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If we get here, all retries failed
    console.error("All search attempts failed");
    
    // Track the failed search in Firestore
    if (userEmail !== 'anonymous@fortecai.com') {
      try {
        await trackWebSearch(userEmail, query, false);
      } catch (trackError) {
        console.error("Failed to track search error:", trackError);
      }
    }
    
    // Return error without mock data
    return NextResponse.json(
      { 
        error: lastError?.message || "Failed to fetch search results after multiple attempts",
        organic_results: [],
        search_metadata: {
          status: "Error",
          processed_at: new Date().toISOString(),
          error_message: lastError?.message || "Unknown error"
        }
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("Web search processing error:", error);
    
    // Track the failed search if possible
    if (query && userEmail !== 'anonymous@fortecai.com') {
      try {
        await trackWebSearch(userEmail, query, false);
      } catch (trackError) {
        console.error("Failed to track search error:", trackError);
      }
    }
    
    // Return error without mock data
    return NextResponse.json(
      { 
        error: error.message || "Failed to process search request",
        organic_results: [],
        search_metadata: {
          status: "Error",
          processed_at: new Date().toISOString(),
          error_message: error.message
        }
      },
      { status: 500 }
    );
  }
} 