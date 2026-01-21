import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/services/firestore-service';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, checkFirestoreConnection, auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

// Firebase config - needed for token verification
const FIREBASE_API_KEY = "AIzaSyBU9jkOPyYoehS5Qxg_ubBf7GG5hbd-HNQ";

// Add a configuration to ensure this route is dynamic
export const dynamic = 'force-dynamic';

// Local cache for dashboard data with 1-minute expiry
const DASHBOARD_CACHE = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

// Helper function to verify Firebase ID token and get uid
async function verifyIdToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No Firebase ID token was passed');
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Check if we're on the custom domain
    const isCustomDomain = typeof window !== 'undefined' && 
      (window.location.hostname === 'fortecofficial.site' || 
       window.location.hostname === 'www.fortecofficial.site');
    
    // Use Firebase Auth REST API to verify the token
    const tokenResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': isCustomDomain ? 'https://fortecofficial.site' : undefined
      },
      body: JSON.stringify({
        idToken
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[Dashboard API] Token verification failed:', errorData);
      throw new Error('Invalid token verification response');
    }
    
    const data = await tokenResponse.json();
    
    if (!data.users || !data.users[0]) {
      throw new Error('No user found with provided token');
    }
    
    const uid = data.users[0].localId;
    
    if (!uid) {
      throw new Error('Invalid user ID in token');
    }
    
    console.log('[Dashboard API] Successfully verified token for UID:', uid);
    
    // Now get an exchange token to use with our server-side operations
    try {
      // This token will be used by Firebase client SDK
      console.log('[Dashboard API] Using the ID token directly with Firestore client SDK');
      // We use the idToken directly with the Firestore client SDK
      return { uid, idToken };
    } catch (exchangeError) {
      console.error('[Dashboard API] Error exchanging token:', exchangeError);
      // If we fail to get a custom token, we can still proceed with the verified UID
      return { uid };
    }
  } catch (error) {
    console.error('[Dashboard API] Error verifying token:', error);
    throw new Error('Invalid Firebase ID token');
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('[Dashboard API] Request received');
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    console.log('[Dashboard API] Authorization header present:', !!authHeader);
    
    // Verify the ID token
    let userId;
    let idToken;
    try {
      const tokenData = await verifyIdToken(authHeader);
      userId = tokenData.uid;
      idToken = tokenData.idToken;
      console.log('[Dashboard API] Verified token, using UID:', userId);
    } catch (error) {
      console.error('[Dashboard API] Token verification failed:', error);
      return NextResponse.json(
        { error: "Unauthorized. Invalid Firebase ID token." },
        { status: 401 }
      );
    }
    
    // Check if this is a force refresh request
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.has('_nocache');
    
    // Return default dashboard data as a fallback
    const defaultData = {
      user: {
        uid: userId,
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

    // Check cache first - this prevents slow loading for multiple requests
    // Skip cache if force refresh is requested
    const cacheKey = `dashboard_${userId}`;
    const cachedData = DASHBOARD_CACHE.get(cacheKey);
    
    if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log('[Dashboard API] Returning cached data');
      const responseTime = Date.now() - startTime;
      console.log(`[Dashboard API] Response time (cached): ${responseTime}ms`);
      return NextResponse.json(cachedData.data);
    }
    
    // Set timeout for Firestore operations
    const { connected, signal } = await checkFirestoreConnection();
    
    if (!connected) {
      console.log('[Dashboard API] Firestore connection check failed, returning default data');
      const responseTime = Date.now() - startTime;
      console.log(`[Dashboard API] Response time (connection failed): ${responseTime}ms`);
      return NextResponse.json(defaultData);
    }
    
    try {
      console.log('[Dashboard API] Attempting to get user data from Firestore for ID:', userId);
      
      // Use Promise.race to add a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore operation timed out')), 5000);
      });
      
      // Firestore operation with timeout
      const userDataPromise = async () => {
        // Use userId from verified token for the document ID
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        console.log('[Dashboard API] User exists in Firestore:', userSnap.exists());
        
        if (userSnap.exists()) {
          // User exists, get their dashboard data
          console.log('[Dashboard API] Getting dashboard data for existing user');
          // Pass only the userId to get dashboard data
          const dashboardData = await getDashboardData(userId);
          console.log('[Dashboard API] Dashboard data retrieved successfully');
          
          // Cache the result
          DASHBOARD_CACHE.set(cacheKey, {
            data: dashboardData,
            timestamp: Date.now()
          });
          
          return dashboardData;
        } else {
          console.log("[Dashboard API] User does not exist, creating new user with ID:", userId);
          
          // If user data doesn't exist yet, create default user data
          const defaultUserData = {
            uid: userId,
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
              modelUsage: {},
              lastUpdated: new Date().toISOString()
            }
          };
          
          await setDoc(userRef, defaultUserData);
          console.log('[Dashboard API] User document created successfully');
          
          // Cache the default data
          DASHBOARD_CACHE.set(cacheKey, {
            data: defaultData,
            timestamp: Date.now()
          });
          
          return defaultData;
        }
      };
      
      // Race between timeout and Firestore operation
      const result = await Promise.race([userDataPromise(), timeoutPromise]);
      const responseTime = Date.now() - startTime;
      console.log(`[Dashboard API] Response time (success): ${responseTime}ms`);
      
      // Add the auth token to the response headers for client to reuse
      const response = NextResponse.json(result);
      if (idToken) {
        response.headers.set('X-Firebase-Auth', idToken);
      }
      
      return response;
      
    } catch (error) {
      console.error("[Dashboard API] Error accessing Firestore:", error);
      // Return default data if there's any error with Firestore
      console.log('[Dashboard API] Returning default data due to Firestore error');
      const responseTime = Date.now() - startTime;
      console.log(`[Dashboard API] Response time (error): ${responseTime}ms`);
      return NextResponse.json(defaultData);
    }
  } catch (error: any) {
    console.error("[Dashboard API] Unhandled error:", error);
    const responseTime = Date.now() - startTime;
    console.log(`[Dashboard API] Response time (unhandled error): ${responseTime}ms`);
    
    // Return a 401 Unauthorized with error
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 401 }
    );
  }
} 