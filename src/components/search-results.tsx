"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function SearchResults({ query }: { query: string }) {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const fetchResponse = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get response');
        }

        // Extract the response text from Gemini's response format
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
        setResponse(text);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to get response');
      } finally {
        setLoading(false);
      }
    };

    fetchResponse();
  }, [query]);

  if (!query) {
    return (
      <div className="mt-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Please enter a search query to see results.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0 flex items-center justify-center text-xs">
            G
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Processing search for: "{query}"</p>
            <div className="space-y-2">
              <p className="text-sm">Retrieving information...</p>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                <div className="bg-green-500 h-1 animate-pulse" style={{ width: "60%" }} />
              </div>
              <p className="text-xs text-neutral-500">Generating response with Gemini...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-neutral-900">
        <h2 className="text-lg font-medium mb-2 text-red-600">Error</h2>
        <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900">
        <h2 className="text-lg font-medium mb-4">Response from Gemini</h2>
        <div className="prose dark:prose-invert max-w-none">
          {response.split('\n').map((paragraph, index) => (
            <p key={index} className="text-neutral-600 dark:text-neutral-400 mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
