"use client";

import { useSearchParams } from "next/navigation";
import { SearchBox } from "./search-box";
import { SearchResults } from "./search-results";

export function SearchClientPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";

  return (
    <main className="w-full max-w-3xl mx-auto p-4 pt-8">
      <SearchBox initialQuery={query} />
      <SearchResults query={query} />
    </main>
  );
}
