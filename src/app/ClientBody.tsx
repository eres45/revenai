"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
    setMounted(true);
  }, []);

  return (
    <body className="antialiased bg-background transition-colors duration-500" suppressHydrationWarning>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AuthProvider>
        {children}
        </AuthProvider>
      </ThemeProvider>
    </body>
  );
}
