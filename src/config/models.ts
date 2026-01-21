export const MODELS = {
  LLAMA_70B: "llama-3.3-70b-versatile",
  GPT41: "openai-large",
  GPT41_NANO: "openai-fast",
  DEEPSEEK_R1: "deepseek-reasoning",
  O3_REASONING: "openai-reasoning",
  QWEN_CODER: "qwen-coder",
  MISTRAL: "mistral",
} as const;

export type ModelId = typeof MODELS[keyof typeof MODELS];

export const MODEL_CONFIGS = {
  [MODELS.LLAMA_70B]: {
    name: "LLaMA-3 70B",
    icon: "/models/llama.svg",
    maxTokens: 4096,
    temperature: 0.7,
  },
  [MODELS.GPT41]: {
    name: "OpenAI GPT-4.1 (Full Version)",
    icon: "/openai-chatgpt-logo-icon-free-png.webp",
    maxTokens: 32768,
    temperature: 0.7,
    alias: "gpt-4.1",
  },
  [MODELS.GPT41_NANO]: {
    name: "OpenAI GPT-4.1 Nano",
    icon: "/openai-chatgpt-logo-icon-free-png.webp",
    maxTokens: 32768,
    temperature: 0.7,
    alias: "gpt-4.1-nano",
  },
  [MODELS.DEEPSEEK_R1]: {
    name: "DeepSeek Reasoning R1",
    icon: "/deepseek_logo_icon-logo_brandlogos.net_s5bgc.png",
    maxTokens: 16384,
    temperature: 0.7,
    alias: "deepseek-r1-0528",
  },
  [MODELS.O3_REASONING]: {
    name: "OpenAI O3 Reasoning (via chatwithmono.xyz)",
    icon: "/openai-chatgpt-logo-icon-free-png.webp",
    maxTokens: 32768,
    temperature: 0.7,
    alias: "o3",
  },
  [MODELS.QWEN_CODER]: {
    name: "Qwen 2.5 Coder 32B",
    icon: "/qwen.webp",
    maxTokens: 32768,
    temperature: 0.7,
    alias: "qwen2.5-coder-32b-instruct",
  },
  [MODELS.MISTRAL]: {
    name: "Mistral Small 3.1 24B",
    icon: "/Mistral_AI_logo_(2025–).svg.png",
    maxTokens: 16384,
    temperature: 0.7,
    alias: "mistral-small-3.1-24b-instruct",
  },
} as const;
