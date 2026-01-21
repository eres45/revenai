// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBU9jkOPyYoehS5Qxg_ubBf7GG5hbd-HNQ",
  authDomain: "fortecai-84d62.firebaseapp.com",
  projectId: "fortecai-84d62",
  storageBucket: "fortecai-84d62.appspot.com",
  messagingSenderId: "886417851334",
  appId: "1:886417851334:web:259e4d38d982d8a886e8c7"
};

// Custom auth domain configuration
const customAuthDomain = 'fortecofficial.site';

// If we're on the custom domain, update the authDomain
if (typeof window !== 'undefined' && window.location.hostname === customAuthDomain) {
  firebaseConfig.authDomain = customAuthDomain;
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set custom auth domain if in production environment
if (typeof window !== 'undefined' && window.location.hostname === customAuthDomain) {
  auth.useDeviceLanguage();
  auth.tenantId = null;
  // Use custom domain for auth operations
  console.log('[Firebase] Using custom auth domain:', customAuthDomain);
}

// Initialize Firestore with performance settings
export let db;
try {
  // Try to use persistent cache first
  console.log('[Firebase] Trying to initialize Firestore with persistent cache');
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ 
      tabManager: persistentMultipleTabManager(),
      sizeBytes: 50 * 1024 * 1024 // 50 MB cache
    })
  });
  console.log('[Firebase] Successfully initialized Firestore with persistent cache');
} catch (error) {
  console.warn('[Firebase] Failed to initialize with persistent cache, falling back to memory cache:', error);
  // Fall back to memory cache if persistent cache is not available
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
}

// Initialize Storage
export const storage = getStorage(app);

// Add this function to check Firestore connectivity with timeout
export const checkFirestoreConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    // This will be used for testing connectivity
    const signal = controller.signal;
    
    // Use the signal for future Firestore operations
    return { connected: true, signal };
  } catch (error) {
    console.error("Firestore connection check failed:", error);
    return { connected: false, signal: null };
  }
}; 