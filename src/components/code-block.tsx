"use client";

import { useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
}

const languageColors: Record<string, { bg: string, text: string, dot: string }> = {
  javascript: { bg: '#000000', text: '#ffd700', dot: '#ffd700' },  // Brighter yellow
  typescript: { bg: '#000000', text: '#3178c6', dot: '#3178c6' },
  python: { bg: '#000000', text: '#4584b6', dot: '#ffde57' },
  jsx: { bg: '#000000', text: '#61dafb', dot: '#61dafb' },
  json: { bg: '#000000', text: '#8dc149', dot: '#8dc149' },
  plaintext: { bg: '#000000', text: '#cccccc', dot: '#cccccc' },
};

const syntaxHighlight = (code: string, language: string): string => {
  let highlighted = code
    // Import/export keywords (bright pink)
    .replace(/\b(import|export|from|default)\b/g, '<span class="text-[#FF79C6]">$1</span>')
    
    // Curly braces and brackets (white)
    .replace(/([{}[\]])/g, '<span class="text-white">$1</span>')
    
    // Import names and variables (bright cyan)
    .replace(/\b(useEffect|useRef|useState|useCallback|useMemo|animated|useSpring)\b(?!\()/g, 
      '<span class="text-[#00ffff]">$1</span>')
    
    // String literals (bright yellow)
    .replace(/(['"])(.*?)\1/g, '<span class="text-[#ffff00]">$1$2$1</span>')
    
    // Numbers and units (bright purple)
    .replace(/\b(\d+\.?\d*)(px|ms|s|rem|em|vh|vw|%|deg)?\b/g, 
      '<span class="text-[#ff00ff]">$1$2</span>')
    
    // Function calls (bright green)
    .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\(/g, '<span class="text-[#00ff00]">$1</span>(')
    
    // Object properties (bright orange)
    .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,}\n]+)/g, (match, prop, value) => {
      return `<span class="text-[#ffa500]">${prop}</span>: ${value}`;
    })
    
    // Constants and variables (bright pink)
    .replace(/\b(const|let|var)\b/g, '<span class="text-[#ff1493]">$1</span>')
    
    // Operators (bright pink)
    .replace(/([=+\->])/g, '<span class="text-[#ff1493]">$1</span>')
    
    // Function parameters (bright blue)
    .replace(/\((.*?)\)/g, (match, params) => {
      return '(' + params.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, 
        '<span class="text-[#00bfff]">$1</span>') + ')';
    })
    
    // Property access (bright orange)
    .replace(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '.<span class="text-[#ffa500]">$1</span>')
    
    // Built-in methods (bright green)
    .replace(/\b(map|filter|reduce|forEach|split|join|slice|push|pop|shift|unshift)\b(?=\()/g,
      '<span class="text-[#00ff00]">$1</span>')
    
    // Comments (gray - keeping this muted for readability)
    .replace(/(\/\/.*$)/gm, '<span class="text-[#6272A4]">$1</span>');

  return highlighted;
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const colorScheme = languageColors[language.toLowerCase()] || languageColors.plaintext;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden bg-[#000000] my-2">
      <div 
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: '#000000', borderBottom: '1px solid #333333' }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colorScheme.dot }}
          />
          <span 
            className="text-xs font-medium"
            style={{ color: colorScheme.text }}
          >
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-neutral-400 hover:text-white p-1 rounded transition-colors duration-200"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-[#000000]">
        <code 
          className="text-sm font-mono"
          dangerouslySetInnerHTML={{ 
            __html: syntaxHighlight(code, language)
          }}
        />
      </pre>
    </div>
  );
}
