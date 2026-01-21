'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to create or update user document in Firestore
const ensureUserDocument = async (user: User) => {
  if (!user.uid) return;
  
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('[Auth] Creating new user document for:', user.email);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
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
      });
      console.log('[Auth] User document created successfully');
    } else {
      console.log('[Auth] User document already exists for:', user.email);
    }
  } catch (error) {
    console.error('[Auth] Error ensuring user document:', error);
  }
};

// Helper function to set the userEmail cookie
const setUserEmailCookie = async (email: string | null) => {
  if (email) {
    try {
      // Set the cookie client-side as a fallback
      document.cookie = `userEmail=${email}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
      console.log(`[Auth] Setting userEmail cookie client-side for: ${email}`);
      
      // Also set the cookie server-side through the API
      const response = await fetch('/api/set-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        console.error('[Auth] Failed to set cookie server-side:', await response.text());
      } else {
        console.log('[Auth] Successfully set cookie server-side');
      }
    } catch (error) {
      console.error('[Auth] Error setting cookie server-side:', error);
    }
  } else {
    // Clear the cookie when logging out
    document.cookie = 'userEmail=; max-age=0; path=/;';
    console.log('[Auth] Clearing userEmail cookie');
    
    // Also clear the cookie server-side
    try {
      await fetch('/api/set-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: '' }),
      });
    } catch (error) {
      console.error('[Auth] Error clearing cookie server-side:', error);
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[Auth] Auth state changed:', currentUser?.email || 'No user');
      console.log('[Auth] User display name:', currentUser?.displayName || 'No display name');
      console.log('[Auth] User object:', currentUser ? JSON.stringify({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified,
        isAnonymous: currentUser.isAnonymous,
      }) : 'null');
      
      setUser(currentUser);
      
      // If we have a user, ensure they have a document in Firestore
      if (currentUser) {
        await ensureUserDocument(currentUser);
      }
      
      // Set or clear the userEmail cookie based on auth state
      setUserEmailCookie(currentUser?.email || null).catch(error => {
        console.error('[Auth] Error in cookie setting:', error);
      });
      
      setLoading(false);
    });

    // Check if there's a cookie already set
    const checkExistingCookie = () => {
      const cookies = document.cookie.split(';');
      const userEmailCookie = cookies.find(cookie => cookie.trim().startsWith('userEmail='));
      if (userEmailCookie) {
        const email = userEmailCookie.split('=')[1].trim();
        console.log('[Auth] Found existing userEmail cookie:', email);
      } else {
        console.log('[Auth] No existing userEmail cookie found');
      }
    };
    
    checkExistingCookie();
    
    return () => unsubscribe();
  }, []);

  async function signUp(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        
        // Ensure the user has a document in Firestore
        await ensureUserDocument(userCredential.user);
        
        // Set the userEmail cookie
        setUserEmailCookie(email);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async function logIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Ensure the user has a document in Firestore
      if (userCredential.user) {
        await ensureUserDocument(userCredential.user);
      }
      
      // Cookie will be set by onAuthStateChanged
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      console.log('[Auth] Attempting Google sign-in');
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters for the Google provider
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('[Auth] Google sign-in successful for:', result.user.email);
      
      // Ensure the user has a document in Firestore
      await ensureUserDocument(result.user);
      
      // Cookie will be set by onAuthStateChanged
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Provide more helpful error messages based on Firebase error codes
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
      } else if (error.code === 'auth/api-key-not-valid') {
        errorMessage = 'Authentication service is temporarily unavailable. Please try again later.';
        console.error('[Auth] API key error - check Firebase console configuration');
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Previous sign-in operation is still in progress.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async function logOut() {
    try {
      await signOut(auth);
      // Cookie will be cleared by onAuthStateChanged
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  const value = {
    user,
    loading,
    signUp,
    logIn,
    signInWithGoogle,
    logOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 