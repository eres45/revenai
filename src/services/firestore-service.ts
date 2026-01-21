import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

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

// In-memory cache for user data
const userDataCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

// Function to estimate token count from text
function estimateTokenCount(text: string): number {
  // A simple estimation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

// Helper function for adding timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
    
    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
};

// Helper function to get UID for email
async function getUserIdByEmail(email: string) {
  try {
    // Try to get the mapping from the user_emails collection first
    const emailRef = doc(db, "user_emails", email);
    const emailSnap = await getDoc(emailRef);
    
    if (emailSnap.exists() && emailSnap.data().uid) {
      return emailSnap.data().uid;
    }
    
    // If no mapping exists, use the email as the ID
    return email;
  } catch (error) {
    console.error("[Firestore] Error getting user ID:", error);
    return email;
  }
}

// Get user data from Firestore
export async function getUserData(userId: string) {
  try {
    if (!userId) {
      console.error('[Firestore] Invalid userId provided:', userId);
      throw new Error('Invalid userId');
    }

    console.log('[Firestore] Getting user data for ID:', userId);
    console.log('[Firestore] User ID type:', typeof userId);
    console.log('[Firestore] User ID length:', userId.length);
    
    // Check cache first
    const cachedData = userDataCache.get(userId);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log('[Firestore] Returning cached user data for ID:', userId);
      return cachedData.data;
    }
    
    console.log('[Firestore] Creating document reference for users/', userId);
    const userRef = doc(db, "users", userId);
    
    // Add a 3-second timeout to getDoc
    console.log('[Firestore] Attempting to fetch document');
    const userSnap = await withTimeout(
      getDoc(userRef), 
      3000, 
      'Firestore getUserData operation timed out'
    );

    if (userSnap.exists()) {
      console.log('[Firestore] User data found for ID:', userId);
      const userData = userSnap.data();
      
      // Cache the result
      userDataCache.set(userId, {
        data: userData,
        timestamp: Date.now()
      });
      
      return userData;
    } else {
      console.log('[Firestore] No user found with ID:', userId);
      return null;
    }
  } catch (error) {
    console.error("[Firestore] Error fetching user data:", error);
    throw error;
  }
}

// Track a chat request in Firestore
export async function trackChatRequest(
  email: string,
  modelId: string,
  inputText: string,
  outputText: string,
  isSuccessful: boolean
) {
  try {
    console.log('[Firestore] Tracking chat request for:', email, 'model:', modelId);
    
    // Try to look up a real UID, but if we can't, use the authenticated user if available
    // This is to transition from email-based to UID-based storage
    const auth = getAuth();
    let userId = auth.currentUser?.uid || email;
    
    console.log('[Firestore] Using user ID:', userId);
    
    const userRef = doc(db, "users", userId);
    
    // Check if user exists first
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('[Firestore] User does not exist, creating new user with ID:', userId);
      // Create a new user document if it doesn't exist
      await setDoc(userRef, {
        uid: userId,
        email: email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
        plan: 'Free',
        lastPlanChange: new Date().toISOString(),
        totalPayments: 0,
        usageData: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          inputTokens: 0,
          outputTokens: 0,
          imagesGenerated: 0,
          estimatedCost: 0,
          modelUsage: {}
        }
      });
      console.log('[Firestore] New user created successfully');
    }
    
    // Estimate token counts
    const inputTokens = estimateTokenCount(inputText);
    const outputTokens = estimateTokenCount(outputText);
    
    // Get the model's display name
    const modelName = MODEL_NAME_MAPPING[modelId] || modelId;
    
    // Calculate cost
    const modelCost = MODEL_COSTS[modelName] || { input: 0.0001, output: 0.0002 };
    const inputCost = (inputTokens / 1000) * modelCost.input;
    const outputCost = (outputTokens / 1000) * modelCost.output;
    const totalCost = inputCost + outputCost;
    
    console.log('[Firestore] Updating usage data for user ID:', userId, 'tokens:', { input: inputTokens, output: outputTokens });
    
    // Update user data
    try {
      await updateDoc(userRef, {
        [`usageData.totalRequests`]: increment(1),
        [`usageData.${isSuccessful ? 'successfulRequests' : 'failedRequests'}`]: increment(1),
        [`usageData.inputTokens`]: increment(inputTokens),
        [`usageData.outputTokens`]: increment(outputTokens),
        [`usageData.estimatedCost`]: increment(totalCost),
        [`usageData.modelUsage.${modelName}.requests`]: increment(1),
        [`usageData.modelUsage.${modelName}.inputTokens`]: increment(inputTokens),
        [`usageData.modelUsage.${modelName}.outputTokens`]: increment(outputTokens),
        [`usageData.modelUsage.${modelName}.cost`]: increment(totalCost),
        [`usageData.lastUpdated`]: Timestamp.now()
      });
      console.log('[Firestore] Usage data updated successfully');
    } catch (updateError) {
      console.error('[Firestore] Error updating usage data:', updateError);
      // Continue to try logging the chat history
    }
    
    // Also log this interaction in a separate collection for history
    try {
      const chatHistoryRef = collection(db, "users", userId, "chatHistory");
      await setDoc(doc(chatHistoryRef), {
        modelId,
        modelName,
        inputText,
        outputText: isSuccessful ? outputText : "",
        inputTokens,
        outputTokens,
        cost: totalCost,
        isSuccessful,
        timestamp: Timestamp.now()
      });
      console.log('[Firestore] Chat history logged successfully');
    } catch (historyError) {
      console.error("[Firestore] Error logging chat history:", historyError);
      // Continue even if history logging fails
    }
    
    return {
      inputTokens,
      outputTokens,
      totalCost
    };
  } catch (error) {
    console.error("[Firestore] Error tracking chat request:", error);
    // Return default data instead of throwing
    return {
      inputTokens: estimateTokenCount(inputText),
      outputTokens: estimateTokenCount(outputText),
      totalCost: 0
    };
  }
}

// Track a web search in Firestore
export async function trackWebSearch(
  email: string,
  query: string,
  isSuccessful: boolean
) {
  try {
    // Use the authenticated user's UID if available
    const auth = getAuth();
    let userId = auth.currentUser?.uid || email;
    
    console.log('[Firestore] Tracking web search for user ID:', userId);
    
    const userRef = doc(db, "users", userId);
    
    // Check if user exists first
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create a new user document if it doesn't exist
      await setDoc(userRef, {
        uid: userId,
        email: email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
        plan: 'Free',
        lastPlanChange: new Date().toISOString(),
        totalPayments: 0,
        usageData: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          inputTokens: 0,
          outputTokens: 0,
          imagesGenerated: 0,
          estimatedCost: 0,
          modelUsage: {}
        }
      });
    }
    
    // Update user data
    await updateDoc(userRef, {
      [`usageData.totalRequests`]: increment(1),
      [`usageData.${isSuccessful ? 'successfulRequests' : 'failedRequests'}`]: increment(1),
      [`usageData.lastUpdated`]: Timestamp.now()
    });
    
    // Log this search in a separate collection for history
    try {
      const searchHistoryRef = collection(db, "users", userId, "searchHistory");
      await setDoc(doc(searchHistoryRef), {
        query,
        isSuccessful,
        timestamp: Timestamp.now()
      });
    } catch (historyError) {
      console.error("Error logging search history:", historyError);
      // Continue even if history logging fails
    }
  } catch (error) {
    console.error("Error tracking web search:", error);
    // Don't throw, just log the error
  }
}

// Get dashboard data for a user
export async function getDashboardData(userId: string) {
  try {
    if (!userId) {
      console.error('[Firestore] Invalid userId provided for dashboard data');
      throw new Error('Invalid userId');
    }
    
    console.log('[Firestore] Getting dashboard data for user ID:', userId);
    
    // Add timeout to getUserData call
    const userData = await withTimeout(
      getUserData(userId),
      5000,
      'Firestore getDashboardData operation timed out'
    );
    
    if (!userData) {
      console.log('[Firestore] User data not found for ID:', userId);
      throw new Error("User data not found");
    }
    
    console.log('[Firestore] User data retrieved:', JSON.stringify({
      uid: userData.uid || userId,
      email: userData.email || 'unknown',
      name: userData.name || 'User',
      plan: userData.plan || 'Free',
      hasUsageData: !!userData.usageData
    }));
    
    // Ensure usageData exists with default values
    const usageData = userData.usageData || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      estimatedCost: 0,
      modelUsage: {},
      lastUpdated: null
    };
    
    // Calculate success rate
    const successRate = usageData.totalRequests > 0 
      ? Math.round((usageData.successfulRequests / usageData.totalRequests) * 100) 
      : 100;
    
    // Format model usage data
    const modelUsage = usageData.modelUsage || {};
    console.log('[Firestore] Model usage data:', JSON.stringify(modelUsage));
    
    const modelUsageArray = Object.entries(modelUsage).map(([name, data]: [string, any]) => {
      return {
        name,
        requests: data?.requests || 0,
        inputTokens: data?.inputTokens || 0,
        outputTokens: data?.outputTokens || 0,
        totalTokens: (data?.inputTokens || 0) + (data?.outputTokens || 0),
        cost: (data?.cost || 0).toFixed(2),
        percentage: 0 // Will calculate below
      };
    });
    
    // Calculate percentages
    const totalModelRequests = modelUsageArray.reduce((sum, model) => sum + model.requests, 0);
    modelUsageArray.forEach(model => {
      model.percentage = totalModelRequests > 0 
        ? Math.round((model.requests / totalModelRequests) * 100) 
        : 0;
    });
    
    // Sort by usage (highest first)
    modelUsageArray.sort((a, b) => b.requests - a.requests);
    
    console.log('[Firestore] Model usage data prepared:', JSON.stringify(modelUsageArray.slice(0, 3)));
    
    // Get the last activity timestamp
    const lastUpdated = usageData.lastUpdated 
      ? (usageData.lastUpdated instanceof Timestamp 
          ? usageData.lastUpdated.toDate().toISOString() 
          : usageData.lastUpdated)
      : new Date().toISOString();
    
    // Format the response
    const dashboardData = {
      user: {
        uid: userData.uid || userId,
        email: userData.email || 'unknown',
        name: userData.name || 'User',
        memberSince: userData.createdAt || new Date().toISOString(),
        plan: userData.plan || 'Free',
        lastPlanChange: userData.lastPlanChange || new Date().toISOString(),
        totalPayments: userData.totalPayments || 0
      },
      usage: {
        totalRequests: usageData.totalRequests || 0,
        imagesGenerated: usageData.imagesGenerated || 0,
        inputTokens: usageData.inputTokens || 0,
        outputTokens: usageData.outputTokens || 0,
        totalTokens: (usageData.inputTokens || 0) + (usageData.outputTokens || 0),
        successRate,
        estimatedCost: (usageData.estimatedCost || 0).toFixed(2),
        lastUpdated: lastUpdated
      },
      modelUsage: modelUsageArray.length > 0 ? modelUsageArray : [
        { name: "Mistral Small 3.1 24B", requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: "0.00", percentage: 0 },
        { name: "LLaMA-3 70B", requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: "0.00", percentage: 0 },
        { name: "OpenAI GPT-4.1", requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: "0.00", percentage: 0 }
      ]
    };
    
    console.log('[Firestore] Dashboard data prepared successfully');
    return dashboardData;
  } catch (error) {
    console.error("[Firestore] Error getting dashboard data:", error);
    // Instead of throwing, return default data
    return {
      user: {
        uid: userId,
        email: 'unknown',
        name: 'User',
        memberSince: new Date().toISOString(),
        plan: 'Free',
        lastPlanChange: new Date().toISOString(),
        totalPayments: 0
      },
      usage: {
        totalRequests: 0,
        imagesGenerated: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        successRate: 100,
        estimatedCost: "0.00",
        lastUpdated: new Date().toISOString()
      },
      modelUsage: [
        { name: "Mistral Small 3.1 24B", requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: "0.00", percentage: 0 },
        { name: "LLaMA-3 70B", requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: "0.00", percentage: 0 },
        { name: "OpenAI GPT-4.1", requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: "0.00", percentage: 0 }
      ]
    };
  }
} 