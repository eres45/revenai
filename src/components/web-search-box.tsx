"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { TypewriterText } from "./typewriter-text";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  source: string;
}

interface WebSearchBoxProps {
  searchResults: SearchResult[];
  isLoading?: boolean;
  searchQuery?: string;
  isActive?: boolean;
}

export function WebSearchBox({ 
  searchResults,
  isLoading = false,
  searchQuery = "",
  isActive = true
}: WebSearchBoxProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll the content as it updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [searchResults]);

  // Set expanded state when isActive prop changes
  useEffect(() => {
    if (isActive && searchResults?.length > 0) {
      setIsExpanded(true);
    }
  }, [isActive, searchResults]);

  if ((!searchResults || searchResults.length === 0) && !isLoading) return null;

  // Function to create a citation tag from a source
  const getCitationTag = (source: string | undefined) => {
    // Handle undefined or null sources
    if (!source) return "source";
    
    // Extract domain from URL if it's a full URL
    if (source.startsWith('http')) {
      try {
        const url = new URL(source);
        return url.hostname;
      } catch {
        return source;
      }
    }
    return source;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-4">
      <div 
        className="relative rounded-lg bg-[#000000] border border-neutral-700 shadow-lg overflow-hidden backdrop-blur-sm"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(60, 60, 60, 0.1) 0%, rgba(20, 20, 20, 0.8) 100%)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2), 0 0 15px rgba(0, 128, 128, 0.2) inset"
        }}
      >
        <div className="flex justify-between items-center px-4 py-2 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Web Search: {searchQuery ? `"${searchQuery}"` : ""}
            <span className="ml-2 text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
              {searchResults?.length || 0} results
            </span>
          </h3>
          <div className="flex items-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Content box - always visible but with different heights based on expanded state */}
        <div
          ref={contentRef}
          className={`transition-all duration-300 overflow-hidden overflow-y-auto ${
            isExpanded ? 'h-[280px]' : 'h-24'
          }`}
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="p-4 text-neutral-300 text-sm">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                <span className="ml-2 text-blue-400">Searching the web...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div key={index} className="border-b border-neutral-800 pb-3 last:border-0">
                    <a 
                      href={result.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center"
                    >
                      {result.title}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    <div className="flex items-center text-xs mt-1">
                      <span className="text-blue-300/70 bg-blue-950/30 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        [{getCitationTag(result.source)}]
                      </span>
                      <span className="ml-2 text-neutral-500">{result.source || "Unknown source"}</span>
                    </div>
                    <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">{result.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-4 py-1 text-xs text-neutral-500 italic border-t border-neutral-800 bg-neutral-900/40">
          {isExpanded ? "Click to collapse" : "Click to expand"} search results • Citations appear as [example.com] in response
        </div>
      </div>
    </div>
  );
} 