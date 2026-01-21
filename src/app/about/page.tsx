import Link from "next/link";
import { Header } from "@/components/header";

export default function AboutPage() {
  return (
    <div className="flex flex-col !font-sans items-center min-h-screen bg-background text-foreground transition-all duration-500">
      <Header />

      <div className="w-full pt-20 p-4 sm:p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-12 mx-auto">
          <div className="text-center space-y-4">
            <Link href="/" className="inline-block mb-2">
              <div className="flex items-center justify-center">
                <h1 className="text-3xl font-bold">Scira</h1>
              </div>
            </Link>
            <div className="flex justify-center">
              <span className="px-3 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800">AI Search</span>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              A minimal but powerful AI search engine and is not associated with any cryptocurrency, memecoin, or token activities. Beware of impersonators.
            </p>
          </div>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-center">RAG & Search Grounding</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              Watch how Scira retrieves data and ground your AI to factual, up-to-date information from reliable sources.
            </p>

            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs mt-0.5">Q</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Explain quantum computing and its real-world applications</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs mt-0.5">P</div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Processing search results...</p>
                    <p className="text-xs">Retrieving relevant information...</p>
                    <p className="text-xs">Combining insights from multiple sources for a comprehensive answer...</p>
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2">
                  <div className="text-xs">
                    <p className="font-medium">Response Preview:</p>
                    <p className="text-sm mt-1">Quantum computing is a revolutionary technology that harnesses quantum mechanics to solve complex problems...</p>
                  </div>
                  <div className="text-xs text-neutral-500 mt-2">
                    Sources: Nature Physics, MIT Research, MIT Technology Review
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-center">Powered By</h2>
            <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
              Built with cutting-edge technology from industry leaders
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900">
                <div className="text-center">
                  <img src="https://ext.same-assets.com/2811501481/3217223920.png" alt="Vercel" className="h-8 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">Powered by Vercel's AI SDK</p>
                </div>
              </div>
              <div className="p-6 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900">
                <div className="text-center">
                  <img src="https://ext.same-assets.com/2811501481/2959825768.svg" alt="Tavily" className="h-8 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">Search grounding powered by Tavily AI</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-center">Built For Everyone</h2>
            <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
              Whether you need quick answers or in-depth research, Scira adapts to your search needs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900">
                <h3 className="text-sm font-medium mb-2">Students</h3>
                <ul className="text-xs space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Research paper assistance</li>
                  <li>• Complex topic explanation</li>
                  <li>• Math problem solving</li>
                </ul>
              </div>

              <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900">
                <h3 className="text-sm font-medium mb-2">Researchers</h3>
                <ul className="text-xs space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Academic paper analysis</li>
                  <li>• Data interpretation</li>
                  <li>• Literature review</li>
                </ul>
              </div>

              <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900">
                <h3 className="text-sm font-medium mb-2">Professionals</h3>
                <ul className="text-xs space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Market research</li>
                  <li>• Technical documentation</li>
                  <li>• Data analysis</li>
                </ul>
              </div>
            </div>
          </section>

          <footer className="py-6 text-center">
            <p className="text-xs text-neutral-500">© 2024 All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
