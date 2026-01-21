'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <img 
        src="/AI assistant - Animation.gif" 
        alt="Fortec AI Logo" 
        className="h-24 w-24 object-contain rounded-full mb-6"
      />
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        We apologize for the inconvenience. Our team has been notified about this issue.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Link href="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    </div>
  );
} 