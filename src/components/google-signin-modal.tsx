"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleSignInModal({ isOpen, onClose }: GoogleSignInModalProps) {
  const { signInWithGoogle } = useAuth(); // Remove user from here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      
      // No need to manually set the cookie here - auth-context will handle it
      // through the onAuthStateChanged listener which is more reliable
      
      onClose();
    } catch (err: any) {
      console.error('[Google Sign-in Modal] Error:', err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">Sign in to Fortec AI</DialogTitle>
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-5"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img 
              src="/models/google.svg" 
              alt="Google" 
              className="h-5 w-5"
              onError={(e) => {
                // Fallback to Google's CDN if local file doesn't exist
                (e.target as HTMLImageElement).src = "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";
              }}
            />
            <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
          </Button>
          
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 