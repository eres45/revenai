"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[ProtectedRoute] Auth state:', { 
      user: user?.email || 'null', 
      uid: user?.uid || 'null', 
      loading,
      isAuthenticated: !!user
    });
    
    if (!loading && !user) {
      console.log('[ProtectedRoute] User not authenticated, redirecting to login');
      router.push("/login");
    } else if (!loading && user) {
      console.log('[ProtectedRoute] User authenticated:', user.email);
      console.log('[ProtectedRoute] User details:', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        providerData: user.providerData
      }));
      
      // Make sure the cookie is set
      document.cookie = `userEmail=${user.email}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
      // Also set a cookie for the UID to help with server-side operations
      document.cookie = `userId=${user.uid}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
      console.log('[ProtectedRoute] Ensured userEmail and userId cookies are set');
    }
  }, [user, loading, router]);

  // Show loading state or nothing while checking authentication
  if (loading || !user) {
    console.log('[ProtectedRoute] Showing loading state');
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800 mb-4"></div>
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  // User is authenticated, render the protected content
  console.log('[ProtectedRoute] Rendering protected content for:', user.email);
  return <>{children}</>;
} 