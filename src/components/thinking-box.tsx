import React, { useEffect } from 'react';
import { TypewriterText } from './typewriter-text';

interface ThinkingBoxProps {
  thinkingProcess?: string;
  isLoading?: boolean;
  onThinkingComplete?: () => void;
  isActive?: boolean;
}

export const ThinkingBox = ({
  thinkingProcess = "",
  isLoading = false,
  onThinkingComplete,
  isActive = false
}: ThinkingBoxProps) => {
  if (!isActive) return null;

  return (
    <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4 my-2 font-mono text-sm">
      <div className="flex items-center gap-2 mb-2 text-neutral-400 border-b border-neutral-700/50 pb-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="uppercase tracking-wider text-[10px] font-bold">Thinking Process</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-neutral-500 italic">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce delay-75" />
            <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce delay-150" />
          </div>
          <span>Analyzing request...</span>
        </div>
      ) : (
        <TypewriterText
          text={thinkingProcess}
          speed={1}
          className="text-neutral-400 leading-relaxed whitespace-pre-wrap"
          onComplete={onThinkingComplete}
        />
      )}
    </div>
  );
};

export default ThinkingBox;
