"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { SearchClientPage } from "@/components/search-client-page";

export const dynamic = 'force-static';

export default function SearchPage() {
  return (
    <div className="flex flex-col !font-sans items-center min-h-screen bg-background text-foreground transition-all duration-500">
      <Header />

      <Suspense fallback={
        <div className="w-full pt-20 p-4 flex flex-col items-center">
          <div className="animate-pulse h-12 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-10"></div>
          <div className="animate-pulse h-40 w-full max-w-3xl bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
        </div>
      }>
        <SearchClientPage />
      </Suspense>
    </div>
  );
}
