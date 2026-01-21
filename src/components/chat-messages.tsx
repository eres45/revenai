"use client";

import React, { useState, useEffect, useRef } from 'react';
import { TypingIndicator } from './typing-indicator';
import { CodeBlock } from './code-block';
import { ThinkingBox } from './thinking-box';
import { WebSearchBox } from './web-search-box';
import { TypewriterText } from './typewriter-text';
import { MODELS, MODEL_CONFIGS, ModelId } from "@/config/models";
import { User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  animationComplete?: boolean;
  modelId?: ModelId;
}

interface ChatMessagesProps {
  messages: Message[];
  isAiTyping?: boolean;
  isThinking?: boolean;
  modelName?: string;
  modelId?: ModelId;
  currentThinking?: string;
  currentSearchResults?: SearchResult[];
  currentSearchQuery?: string;
  isSearching?: boolean;
  onThinkingComplete?: () => void;
  waitingForResponse?: boolean;
}

const detectLanguage = (code: string): string => {
  if (code.includes('function') || code.includes('const') || code.includes('let')) return 'javascript';
  if (code.includes('import') && code.includes('from')) return 'typescript';
  if (code.includes('def ') || code.includes('print(')) return 'python';
  if (code.startsWith('{') || code.startsWith('[')) return 'json';
  if (code.includes('<')) return 'jsx';
  return 'plaintext';
};

const ChatMessageContent = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-neutral-200" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-neutral-200" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-neutral-200" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-4 space-y-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-4 space-y-2" {...props} />,
        li: ({ node, ...props }) => <li className="text-neutral-300" {...props} />,
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const code = String(children).replace(/\n$/, '');
          const language = match ? match[1] : detectLanguage(code);

          if (!inline && match) {
            return <CodeBlock code={code} language={language} />;
          }

          return (
            <code className="px-1 py-0.5 rounded bg-neutral-800 text-emerald-400 text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-neutral-700 pl-4 py-2 my-4 italic text-neutral-400" {...props} />,
        hr: ({ node, ...props }) => <hr className="my-4 border-neutral-700" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-neutral-100" {...props} />,
        a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
      }}
      className="text-neutral-300 leading-relaxed"
    >
      {content}
    </ReactMarkdown>
  );
};

export function ChatMessages({
  messages,
  isAiTyping = false,
  isThinking = false,
  modelName = "AI",
  modelId,
  currentThinking = "",
  currentSearchResults = [],
  currentSearchQuery = "",
  isSearching = false,
  onThinkingComplete,
  waitingForResponse = false
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [animatedMessages, setAnimatedMessages] = useState<Record<string, boolean>>({});
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const [isThinkingAnimationComplete, setIsThinkingAnimationComplete] = useState(false);
  const lastThinkingRef = useRef<string>("");
  const activeThinkingRef = useRef<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Reset the animation state when the thinking content changes
  useEffect(() => {
    if (currentThinking && currentThinking !== lastThinkingRef.current) {
      console.log("ChatMessages: New thinking content");
      setIsThinkingAnimationComplete(false);
      lastThinkingRef.current = currentThinking;
      activeThinkingRef.current = true;
    }
  }, [currentThinking]);

  // Update thinking active state when thinking status changes
  useEffect(() => {
    if (!isThinking && activeThinkingRef.current) {
      // When thinking ends, mark it as no longer active
      activeThinkingRef.current = false;
    }
  }, [isThinking]);

  // Reset the animation state cache when messages array changes length
  useEffect(() => {
    // Check if we have new messages that haven't been processed yet
    messages.forEach(msg => {
      if (!msg.isUser && !processedMessagesRef.current.has(msg.id)) {
        processedMessagesRef.current.add(msg.id);
      }
    });

    scrollToBottom();
  }, [messages.length]);

  // Handle scrolling when animation state changes
  useEffect(() => {
    scrollToBottom();
  }, [animatedMessages, isAiTyping, isThinking, waitingForResponse]);

  // When thinking animation completes, trigger the callback
  useEffect(() => {
    if (isThinkingAnimationComplete && onThinkingComplete && currentThinking && activeThinkingRef.current) {
      console.log("ChatMessages: Thinking animation complete, calling onThinkingComplete");
      onThinkingComplete();
    }
  }, [isThinkingAnimationComplete, onThinkingComplete, currentThinking]);

  // Mark a message as having completed its animation
  const handleAnimationComplete = (messageId: string) => {
    setAnimatedMessages(prev => ({
      ...prev,
      [messageId]: true
    }));
    processedMessagesRef.current.add(messageId);
  };

  // Handle thinking animation completion
  const handleThinkingAnimationComplete = () => {
    console.log("ChatMessages: Setting thinking animation complete");
    setIsThinkingAnimationComplete(true);
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 px-4">
      {/* Process the messages to properly order user message, search results, and AI responses */}
      {messages.map((message, index) => {
        const isAnimated = !message.isUser &&
          !animatedMessages[message.id] &&
          !processedMessagesRef.current.has(message.id);

        // Get the next message (if any)
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

        // Check if this is a user message followed by an AI response with search results
        const isUserMessageWithSearchResults = message.isUser && nextMessage &&
          !nextMessage.isUser &&
          nextMessage.searchResults &&
          Array.isArray(nextMessage.searchResults) &&
          nextMessage.searchResults.length > 0;

        return (
          <React.Fragment key={message.id}>
            {/* The message itself */}
            <div className="flex flex-col">
              <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                {!message.isUser && (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800 flex items-center justify-center mr-2">
                    {message.modelId && MODEL_CONFIGS[message.modelId] ? (
                      <img
                        src={MODEL_CONFIGS[message.modelId].icon}
                        alt={MODEL_CONFIGS[message.modelId].name}
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <div className="h-5 w-5 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${message.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#000000] dark:bg-[#000000]'
                    }`}
                >
                  {message.isUser ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="text-neutral-300 relative group">
                      {isAnimated ? (
                        <TypewriterText
                          text={message.content}
                          speed={2}
                          className="space-y-2 text-neutral-300 leading-relaxed whitespace-pre-wrap"
                          onComplete={() => handleAnimationComplete(message.id)}
                        />
                      ) : (
                        <ChatMessageContent content={message.content} />
                      )}

                      {!isAnimated && (
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="absolute -right-2 -top-2 p-1.5 rounded-md bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                          title="Copy to clipboard"
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                {message.isUser && (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-blue-600 flex items-center justify-center ml-2">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* If this is a user message, show thinking or search indicators */}
            {message.isUser && index === messages.length - 1 && (
              <>
                {isThinking && currentThinking && (
                  <div className="mt-2 mb-2">
                    <ThinkingBox
                      thinkingProcess={currentThinking}
                      isLoading={false}
                      onThinkingComplete={handleThinkingAnimationComplete}
                      isActive={true}
                    />
                  </div>
                )}

                {isThinking && !currentThinking && (
                  <div className="mt-2 mb-2">
                    <ThinkingBox thinkingProcess="" isLoading={true} isActive={true} />
                  </div>
                )}

                {isSearching && (
                  <div className="mt-2 mb-2">
                    <WebSearchBox
                      searchResults={currentSearchResults}
                      isLoading={true}
                      searchQuery={currentSearchQuery}
                      isActive={true}
                    />
                  </div>
                )}

                {!isSearching && currentSearchResults && currentSearchResults.length > 0 && (
                  <div className="mt-2 mb-2">
                    <WebSearchBox
                      searchResults={currentSearchResults}
                      isLoading={false}
                      searchQuery={currentSearchQuery}
                      isActive={true}
                    />
                  </div>
                )}
              </>
            )}

            {/* After a user message, show the search results before the AI response */}
            {isUserMessageWithSearchResults && (
              <div className="mt-2 mb-2">
                <WebSearchBox
                  searchResults={nextMessage!.searchResults!}
                  isLoading={false}
                  searchQuery={nextMessage!.searchQuery}
                  isActive={true}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {waitingForResponse && !isThinking && !isSearching && (
        <TypingIndicator modelName={modelName} />
      )}

      {isAiTyping && !isThinking && !isSearching && !waitingForResponse && (
        <TypingIndicator modelName={modelName} />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
