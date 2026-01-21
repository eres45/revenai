"use client";

import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  keepScrolling?: boolean;
}

export function TypewriterText({ 
  text, 
  speed = 5, 
  delay = 0, 
  className = "", 
  onComplete,
  keepScrolling = false
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completedOnceRef = useRef(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIsComplete(false);
    completedOnceRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const startAnimation = () => {
      let currentIndex = 0;
      
      const typeNextChar = () => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.substring(0, currentIndex));
          currentIndex++;
          
          // Calculate dynamic speed, slightly randomized for natural effect
          const dynamicSpeed = speed * (0.8 + Math.random() * 0.4);
          const isPunctuation = currentIndex > 0 && ".,:;!?".includes(text[currentIndex - 1]);
          const pauseMultiplier = isPunctuation ? 8 : 1;
          
          timeoutRef.current = setTimeout(typeNextChar, dynamicSpeed * pauseMultiplier);
        } else {
          setIsComplete(true);
          if (!completedOnceRef.current && onComplete) {
            completedOnceRef.current = true;
            console.log("TypewriterText: Animation complete, calling onComplete");
            onComplete();
          }
        }
      };
      
      timeoutRef.current = setTimeout(typeNextChar, delay);
    };

    startAnimation();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, onComplete]);

  // Scroll parent container when text updates
  useEffect(() => {
    if (textRef.current && (keepScrolling || !isComplete)) {
      // Find scrollable parent
      let scrollableParent = textRef.current.parentElement;
      while (scrollableParent) {
        if (scrollableParent.scrollHeight > scrollableParent.clientHeight) {
          scrollableParent.scrollTop = scrollableParent.scrollHeight;
          break;
        }
        scrollableParent = scrollableParent.parentElement;
      }
    }
  }, [displayedText, isComplete, keepScrolling]);

  return (
    <div ref={textRef} className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▌</span>}
    </div>
  );
} 