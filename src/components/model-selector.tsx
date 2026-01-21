"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MODELS, MODEL_CONFIGS, ModelId } from "@/config/models";

interface ModelSelectorProps {
  selectedModel: ModelId;
  onModelChange: (modelId: ModelId) => void;
  isFixed?: boolean;
}

export function ModelSelector({ selectedModel = MODELS.GEMINI, onModelChange, isFixed = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedModelConfig = MODEL_CONFIGS[selectedModel] || MODEL_CONFIGS[MODELS.GEMINI];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-colors duration-200 bg-[#4D4D4D] dark:bg-[#3A3A3A] text-white hover:bg-[#3D3D3D] dark:hover:bg-[#434343]"
      >
        <img 
          src={selectedModelConfig.icon}
          alt={selectedModelConfig.name}
          className="w-4 h-4"
        />
        <span className="text-xs font-medium">{selectedModelConfig.name}</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 opacity-70" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-70" />
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute ${
            isFixed ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-0 w-48 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-lg py-1 z-50`}
        >
          {(Object.entries(MODEL_CONFIGS) as [ModelId, typeof MODEL_CONFIGS[keyof typeof MODEL_CONFIGS]][]).map(([id, config]) => (
            <button
              key={id}
              onClick={() => {
                onModelChange(id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                selectedModel === id
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : ""
              }`}
            >
              <img 
                src={config.icon}
                alt={config.name}
                className="w-4 h-4"
              />
              <span className="text-neutral-700 dark:text-neutral-200">
                {config.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
