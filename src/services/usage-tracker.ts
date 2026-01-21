// Create a singleton for usage tracking that persists between requests
// but doesn't rely on the global object
class UsageTracker {
  private static instance: UsageTracker;
  private usageData: Record<string, any> = {};

  private constructor() {}

  public static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  public getData(userId: string): any {
    return this.usageData[userId];
  }

  public setData(userId: string, data: any): void {
    this.usageData[userId] = data;
  }

  public getAllData(): Record<string, any> {
    return this.usageData;
  }
}

// Model cost per 1000 tokens (these would be actual rates in production)
const MODEL_COSTS = {
  "Mistral Small 3.1 24B": { input: 0.0002, output: 0.0006 },
  "LLaMA-3 70B": { input: 0.0003, output: 0.0009 },
  "OpenAI GPT-4.1": { input: 0.001, output: 0.003 },
  "DeepSeek Reasoning R1": { input: 0.0004, output: 0.0012 },
  "OpenAI O3 Reasoning": { input: 0.0015, output: 0.0045 },
  "Qwen 2.5 Coder 32B": { input: 0.0003, output: 0.0009 },
};

// Default model name mapping
const MODEL_NAME_MAPPING: Record<string, string> = {
  "mistral-small-3.1-24b-instruct": "Mistral Small 3.1 24B",
  "llama-3.3-70b-versatile": "LLaMA-3 70B",
  "gpt-4.1": "OpenAI GPT-4.1",
  "gpt-4.1-nano": "OpenAI GPT-4.1",
  "deepseek-r1-0528": "DeepSeek Reasoning R1",
  "o3": "OpenAI O3 Reasoning",
  "qwen2.5-coder-32b-instruct": "Qwen 2.5 Coder 32B",
};

// Function to estimate token count from text
function estimateTokenCount(text: string): number {
  // A simple estimation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

// Initialize user data if it doesn't exist
function initializeUserData(userId: string) {
  const tracker = UsageTracker.getInstance();
  
  if (!tracker.getData(userId)) {
    tracker.setData(userId, {
      email: 'user@example.com',
      name: 'user',
      memberSince: new Date().toISOString(),
      plan: 'Free',
      lastPlanChange: 'Free',
      totalPayments: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      estimatedCost: 0,
      modelUsage: {}
    });
  }
}

// Track a chat request
export function trackChatRequest(
  userId: string,
  modelId: string,
  inputText: string,
  outputText: string,
  isSuccessful: boolean
) {
  // Initialize user data if needed
  initializeUserData(userId);
  
  const tracker = UsageTracker.getInstance();
  
  // Get the user's data
  const userData = tracker.getData(userId);
  
  // Estimate token counts
  const inputTokens = estimateTokenCount(inputText);
  const outputTokens = estimateTokenCount(outputText);
  
  // Get the model's display name
  const modelName = MODEL_NAME_MAPPING[modelId] || modelId;
  
  // Initialize model usage if needed
  if (!userData.modelUsage[modelName]) {
    userData.modelUsage[modelName] = {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0
    };
  }
  
  // Calculate cost
  const modelCost = MODEL_COSTS[modelName] || { input: 0.0001, output: 0.0002 };
  const inputCost = (inputTokens / 1000) * modelCost.input;
  const outputCost = (outputTokens / 1000) * modelCost.output;
  const totalCost = inputCost + outputCost;
  
  // Update user data
  userData.totalRequests += 1;
  
  if (isSuccessful) {
    userData.successfulRequests += 1;
  } else {
    userData.failedRequests += 1;
  }
  
  userData.inputTokens += inputTokens;
  userData.outputTokens += outputTokens;
  userData.estimatedCost += totalCost;
  
  // Update model usage
  userData.modelUsage[modelName].requests += 1;
  userData.modelUsage[modelName].inputTokens += inputTokens;
  userData.modelUsage[modelName].outputTokens += outputTokens;
  userData.modelUsage[modelName].cost += totalCost;
  
  // Save the updated data
  tracker.setData(userId, userData);
  
  return {
    inputTokens,
    outputTokens,
    totalCost
  };
}

// Track an image generation
export function trackImageGeneration(
  userId: string,
  prompt: string,
  isSuccessful: boolean
) {
  // Initialize user data if needed
  initializeUserData(userId);
  
  const tracker = UsageTracker.getInstance();
  
  // Get the user's data
  const userData = tracker.getData(userId);
  
  // Update user data
  userData.totalRequests += 1;
  userData.imagesGenerated += isSuccessful ? 1 : 0;
  
  if (isSuccessful) {
    userData.successfulRequests += 1;
  } else {
    userData.failedRequests += 1;
  }
  
  // Estimate cost (approximately $0.02 per image)
  const imageCost = 0.02;
  userData.estimatedCost += isSuccessful ? imageCost : 0;
  
  // Save the updated data
  tracker.setData(userId, userData);
  
  return {
    cost: isSuccessful ? imageCost : 0
  };
}

// Track a web search
export function trackWebSearch(
  userId: string,
  query: string,
  isSuccessful: boolean
) {
  // Initialize user data if needed
  initializeUserData(userId);
  
  const tracker = UsageTracker.getInstance();
  
  // Get the user's data
  const userData = tracker.getData(userId);
  
  // Update user data
  userData.totalRequests += 1;
  
  if (isSuccessful) {
    userData.successfulRequests += 1;
  } else {
    userData.failedRequests += 1;
  }
  
  // Web searches are free in our model
  
  // Save the updated data
  tracker.setData(userId, userData);
}

// Get user usage data
export function getUserUsageData(userId: string) {
  // Initialize user data if needed
  initializeUserData(userId);
  
  const tracker = UsageTracker.getInstance();
  
  // Return a copy of the user's data
  return { ...tracker.getData(userId) };
}

// For testing purposes - add some sample data
export function addSampleData() {
  const tracker = UsageTracker.getInstance();
  const userId = 'anonymous';
  
  // Initialize if needed
  initializeUserData(userId);
  
  // Get current data
  const userData = tracker.getData(userId);
  
  // Add sample usage
  userData.totalRequests = 15;
  userData.successfulRequests = 14;
  userData.failedRequests = 1;
  userData.inputTokens = 1250;
  userData.outputTokens = 3800;
  userData.estimatedCost = 0.32;
  
  // Add model usage
  userData.modelUsage = {
    "Mistral Small 3.1 24B": {
      requests: 8,
      inputTokens: 750,
      outputTokens: 2200,
      cost: 0.18
    },
    "LLaMA-3 70B": {
      requests: 5,
      inputTokens: 350,
      outputTokens: 1100,
      cost: 0.10
    },
    "OpenAI GPT-4.1": {
      requests: 2,
      inputTokens: 150,
      outputTokens: 500,
      cost: 0.04
    }
  };
  
  // Save the updated data
  tracker.setData(userId, userData);
} 