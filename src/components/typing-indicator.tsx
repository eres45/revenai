"use client";

interface TypingIndicatorProps {
  modelName?: string;
}

export function TypingIndicator({ modelName = "AI" }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start px-4">
      <div className="bg-[#000000] dark:bg-[#000000] rounded-2xl px-4 py-2 mr-4 flex items-end">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-300 ml-2 mb-0.5">{modelName} is thinking...</span>
      </div>
    </div>
  );
}
