"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, Search, MessageCircle, Globe, BookOpen, Trash2 } from "lucide-react";
import { ChatMessages } from "./chat-messages";
import { DateTime } from "./date-time";
import { ModelSelector } from "./model-selector";
import { MODELS, MODEL_CONFIGS, ModelId } from "@/config/models";
import { ThinkingBox } from "./thinking-box";
import React from "react";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  source: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  thinking?: string;
  searchResults?: SearchResult[];
  searchQuery?: string;
  modelId?: ModelId;
}

interface SearchBoxProps {
  onConversationStart?: () => void;
  initialQuery?: string;
}

export function SearchBox({ onConversationStart, initialQuery = "" }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [currentThinking, setCurrentThinking] = useState("");
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(MODELS.MISTRAL);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchType, setSearchType] = useState<"normal" | "web" | "research">("normal");
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const pendingMessageRef = useRef<{ content: string, id: string } | null>(null);
  // Load messages from localStorage on mount
  React.useEffect(() => {
    const savedMessages = localStorage.getItem("revenai_messages");
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
  }, []);

  // Save messages to localStorage when they change
  React.useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("revenai_messages", JSON.stringify(messages));
    }
  }, [messages]);

  const clearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
      localStorage.removeItem("revenai_messages");
    }
  };

  const hasStartedChat = messages.length > 0;

  // Get the model name from the selected model ID
  const selectedModelName = MODEL_CONFIGS[selectedModel]?.name || "AI";

  const toggleMode = () => {
    setIsSearchMode(!isSearchMode);
    setQuery("");
  };

  // Close search dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchButtonRef.current?.contains(event.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search option selection
  const handleSearchOptionClick = (option: string) => {
    if (option === 'chat') {
      // Switch to chat mode
      setIsSearchMode(false);
      setSearchType("normal");
      // No change to thinking mode in chat mode
    } else if (option === 'web') {
      // Switch to web search mode
      setIsSearchMode(true);
      setSearchType("web");
      // Disable thinking mode in web search
      setIsThinkingEnabled(false);
    } else if (option === 'research') {
      // Switch to research mode
      setIsSearchMode(true);
      setSearchType("research");
      // Disable thinking mode in research
      setIsThinkingEnabled(false);
    }
    setQuery("");
    setIsSearchDropdownOpen(false);
    // Focus on input after selection
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) inputElement.focus();
  };

  // This function will be called when thinking is complete
  const sendFinalResponse = async () => {
    if (!pendingMessageRef.current) return;

    console.log("SearchBox: Sending final response");
    setWaitingForResponse(true);
    const userQueryContent = pendingMessageRef.current.content;
    const userMessageId = pendingMessageRef.current.id;

    try {
      // Extract search type from content if present
      let systemInstructions = "";
      let useSearchResults = false;
      let searchResultsText = "";

      // Format search results as text to include in the prompt
      if (currentSearchResults && currentSearchResults.length > 0) {
        searchResultsText = `\n<search_results>\n${currentSearchResults.map((result, index) =>
          `RESULT ${index + 1}:\nTitle: ${result.title}\nURL: ${result.link}\nSource: ${result.source}\nSnippet: ${result.snippet}\n`
        ).join('\n')}\n</search_results>\n`;
      }

      if (userQueryContent.startsWith("Web search:")) {
        // For web searches, include the search results in the prompt
        systemInstructions = `
<instructions>
You are being provided with search results for the query: "${currentSearchQuery || userQueryContent.substring("Web search:".length).trim()}"

${searchResultsText}

Based on ONLY the search results above:
1. Synthesize a comprehensive summary that captures the key information
2. Structure your response with clear headings and organized content
3. Include specific facts, figures, and quotes from the search results
4. Cite sources using [Source: example.com] format when referencing specific information
5. If the search results don't fully answer the query, acknowledge the limitations
6. Format your response in an easy-to-read style with paragraphs, bullet points, or lists as appropriate

Respond in a helpful, informative manner that directly addresses the user's query.
DO NOT make up information or include details not found in the search results.
DO NOT include phrases like "Based on the search results" or "According to the provided information".
</instructions>
`;
        useSearchResults = true;
      } else if (userQueryContent.startsWith("Research:")) {
        systemInstructions = `
<instructions>
This is a research query. Please provide an in-depth analysis with:
- Comprehensive investigation of the topic
- Multiple perspectives and schools of thought
- Historical context and development
- Current state of research/knowledge
- Limitations and gaps in current understanding
- Citations to notable research or authorities where appropriate
- Structure your response as an academic research summary
</instructions>
`;
      }

      const finalPrompt = `
${systemInstructions}
<response>
Respond directly to the query: "${userQueryContent.replace(/^Web search: /, '')}"

Your response should be well-structured, informative, and conversational.
</response>`;

      console.log("Sending prompt to model with", currentSearchResults?.length || 0, "search results");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => m.id !== userMessageId),
            {
              content: userQueryContent,
              isUser: true,
            },
            ...(useSearchResults ? [{
              content: searchResultsText,
              isUser: false
            }] : []),
            {
              content: finalPrompt,
              isUser: false
            }
          ].map(m => ({
            content: m.content,
            isUser: m.isUser,
          })),
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Clean up the response to remove any response tags
      let cleanedResponse = data.text
        .replace(/<response>|<\/response>/g, '')
        .replace(/^Based on the search results,?\s*/i, '')
        .replace(/^According to the (provided|search|given) (information|results),?\s*/i, '')
        .trim();

      // Create the AI response message with search results if applicable
      const aiMessage: Message = {
        id: Math.random().toString(),
        content: cleanedResponse,
        isUser: false,
        timestamp: new Date(),
        thinking: currentThinking,
        searchResults: useSearchResults ? currentSearchResults : undefined,
        searchQuery: useSearchResults ? currentSearchQuery : undefined,
        modelId: selectedModel
      };

      console.log("AI Message with search data:",
        useSearchResults ? `${currentSearchResults?.length || 0} results for "${currentSearchQuery}"` : "No search results");

      // Add the AI response without removing the user message
      setMessages((prev) => [...prev, aiMessage]);

      // Clear pending message but DON'T clear search results
      pendingMessageRef.current = null;

      // Now clear the current state except search results
      setCurrentThinking("");
      setIsThinking(false);
      setIsSearching(false);

      // Keep search results available for display
      // Don't clear them anymore as it causes the search box to disappear
      // setTimeout(() => {
      //   setCurrentSearchResults([]);
      //   setCurrentSearchQuery("");
      // }, 500);

    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Math.random().toString(),
        content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsThinking(false);
      setIsSearching(false);
      setCurrentSearchResults([]);
      setCurrentSearchQuery("");
    } finally {
      setWaitingForResponse(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    // Process query based on search type
    let processedQuery = query;
    let actualSearchType = searchType;

    // Detect if the user has manually typed "web search:" or "research:"
    if (query.toLowerCase().startsWith("web search:")) {
      actualSearchType = "web";
      processedQuery = query.substring("web search:".length).trim();
      setSearchType("web");
      setIsSearchMode(true);
      setIsThinkingEnabled(false);
    } else if (query.toLowerCase().startsWith("research:")) {
      actualSearchType = "research";
      processedQuery = query.substring("research:".length).trim();
      setSearchType("research");
      setIsSearchMode(true);
      setIsThinkingEnabled(false);
    }

    // Format the message content based on the search type
    let messageContent = query;

    if (actualSearchType === "web") {
      messageContent = `Web search: ${processedQuery}`;
    } else if (actualSearchType === "research") {
      messageContent = `Research: ${processedQuery}`;
    }

    if (onConversationStart && !hasStartedChat) {
      onConversationStart();
    }

    setIsLoading(true);
    setQuery("");

    // Create and add the user message to the chat
    const userMessage: Message = {
      id: Math.random().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Store the pending user message for later
    pendingMessageRef.current = {
      content: messageContent,
      id: userMessage.id
    };

    // For web search queries, call the web search API first
    if (actualSearchType === "web") {
      setIsSearching(true);
      setCurrentSearchQuery(processedQuery);

      try {
        const searchResponse = await fetch("/api/web-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: processedQuery,
          }),
        });

        const searchData = await searchResponse.json();

        if (!searchResponse.ok) {
          throw new Error(searchData.error || "Failed to get search results");
        }

        setCurrentSearchResults(searchData.organic_results || []);

        // After getting search results, then proceed to final response
        setTimeout(() => {
          sendFinalResponse();
        }, 1000); // Short delay to show search results before response
      } catch (error) {
        console.error("Web search error:", error);
        setCurrentSearchResults([]);
        setIsSearching(false);
        // On search error, still try to get a response
        sendFinalResponse();
      }

      return;
    }

    // Proceed directly with getting the response
    try {
      // Extract search type from messageContent if present
      let promptPrefix = "";
      if (messageContent.startsWith("Web search:")) {
        promptPrefix = `
<instructions>
This is a web search query. Please provide search results as if you are a search engine,
focusing on finding relevant online information. Include key facts, recent information, and 
cite any sources you would expect to find. Format your response like search results with
clear headlines and brief summaries.
</instructions>
`;
      } else if (messageContent.startsWith("Research:")) {
        promptPrefix = `
<instructions>
This is a research query. Please provide an in-depth analysis with:
- Comprehensive investigation of the topic
- Multiple perspectives and schools of thought
- Historical context and development
- Current state of research/knowledge
- Limitations and gaps in current understanding
- Citations to notable research or authorities where appropriate
- Structure your response as an academic research summary
</instructions>
`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            userMessage,
            ...(promptPrefix ? [{
              content: promptPrefix,
              isUser: false
            }] : [])
          ].map(m => ({
            content: m.content,
            isUser: m.isUser,
          })),
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const aiMessage: Message = {
        id: Math.random().toString(),
        content: data.text,
        isUser: false,
        timestamp: new Date(data.timestamp),
        modelId: selectedModel
      };

      setMessages((prev) => [...prev, aiMessage]);
      pendingMessageRef.current = null;
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Math.random().toString(),
        content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle thinking complete event
  const handleThinkingComplete = () => {
    console.log("SearchBox: Handling thinking complete, pending message:", !!pendingMessageRef.current, "waiting:", waitingForResponse);
    if (pendingMessageRef.current && !waitingForResponse) {
      console.log("SearchBox: Conditions met, calling sendFinalResponse");
      // Small timeout to ensure we're not in a race condition
      setTimeout(() => {
        sendFinalResponse();
      }, 100);
    } else {
      console.log("SearchBox: Not sending response due to conditions");
    }
  };

  return (
    <div className={`flex flex-col w-full max-w-4xl mx-auto transition-all duration-700 ease-in-out`}>
      <div className={`flex-1 overflow-y-auto mb-4 transition-all duration-700 ${hasStartedChat ? 'h-[calc(100vh-180px)]' : 'h-0'
        } pb-20`}>
        <ChatMessages
          messages={messages}
          isAiTyping={isLoading && !isThinking && !isSearching && !waitingForResponse}
          modelName={selectedModelName}
          modelId={selectedModel}
          isThinking={isThinking}
          currentThinking={currentThinking}
          isSearching={isSearching}
          currentSearchResults={currentSearchResults}
          currentSearchQuery={currentSearchQuery}
          onThinkingComplete={handleThinkingComplete}
          waitingForResponse={waitingForResponse}
        />
      </div>

      <div className={`transition-all duration-700 ease-in-out ${hasStartedChat ? 'fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm pb-6 pt-2' : ''
        }`}>
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full flex justify-center">
              <div className="relative rounded-lg bg-neutral-100 dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 w-full max-w-xl">
                <div className="flex items-center gap-2 p-2">
                  {/* Search dropdown button */}
                  <div className="relative">
                    <button
                      ref={searchButtonRef}
                      type="button"
                      onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-colors duration-200 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                      title={!isSearchMode ? "Chat Mode" : searchType === "web" ? "Web Search Mode" : "Research Mode"}
                    >
                      {!isSearchMode ? (
                        <MessageCircle className="w-4 h-4" />
                      ) : searchType === "web" ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </button>

                    {isSearchDropdownOpen && (
                      <div
                        ref={searchDropdownRef}
                        className="absolute bottom-full mb-2 left-0 w-36 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-lg py-1 z-50"
                      >
                        <button
                          type="button"
                          onClick={() => handleSearchOptionClick('chat')}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${!isSearchMode ? "bg-neutral-100 dark:bg-neutral-800" : ""
                            }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-neutral-700 dark:text-neutral-200">Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSearchOptionClick('web')}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isSearchMode && searchType === "web" ? "bg-neutral-100 dark:bg-neutral-800" : ""
                            }`}
                        >
                          <Globe className="w-4 h-4" />
                          <span className="text-neutral-700 dark:text-neutral-200">Web Search</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSearchOptionClick('research')}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isSearchMode && searchType === "research" ? "bg-neutral-100 dark:bg-neutral-800" : ""
                            }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span className="text-neutral-700 dark:text-neutral-200">Research</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    isFixed={true}
                  />
                  {hasStartedChat && (
                    <button
                      type="button"
                      onClick={clearChat}
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors duration-200 bg-white dark:bg-neutral-800 text-neutral-500"
                      title="Clear Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-base placeholder:text-neutral-500 min-w-0 p-1"
                    placeholder={!isSearchMode ? "Ask a question..." : searchType === "web" ? "Search the web..." : "Research a topic..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isLoading}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${isLoading
                      ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : query.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      } transition-colors duration-200`}
                    aria-label="Submit"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>
          {hasStartedChat && <DateTime />}
        </div>
      </div>
    </div>
  );
}