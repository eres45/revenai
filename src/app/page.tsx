"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { SearchBox } from "@/components/search-box";
import { StarBorder } from "@/components/ui/star-border";
import { TextShimmer } from "@/components/ui/text-shimmer";
import Image from "next/image";

export default function Home() {
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Callback function to be passed to SearchBox to notify when chat has started
  const handleChatStart = () => {
    setHasStartedChat(true);
  };

  return (
    <div className="flex flex-col !font-sans items-center min-h-screen bg-background text-foreground transition-all duration-500">
      <Header />

      <div className="w-full p-2 sm:p-4 min-h-screen flex flex-col items-center justify-center pb-24">
        {/* Intro elements that disappear when chat starts */}
        {!hasStartedChat && (
          <div className="w-full max-w-[95%] !font-sans sm:max-w-6xl space-y-6 p-0 mx-auto transition-all duration-300">
          <div className="text-center !font-sans">
              <div className="flex justify-center mb-6">
                <Image
                  src="/AI assistant - Animation.gif"
                  alt="AI Assistant Animation"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>
              <div className="flex justify-center mb-3">
                <StarBorder
                  as="div"
                  color="#ffffff"
                  speed="8s"
                  className="text-white text-xs scale-75"
                >
                  all chatbots in one place
                </StarBorder>
              </div>
              <h1 className="text-2xl sm:text-4xl mb-2 text-neutral-800 dark:text-neutral-100 font-syne">
                Welcome to RevenAI
            </h1>
              <div className="mb-6">
                <TextShimmer 
                  as="p" 
                  className="text-lg font-medium" 
                  duration={3}
                >
                  Introducing the ultimate AI platform, brought to you by eres45
                </TextShimmer>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat area that appears when chat starts */}
        {hasStartedChat && (
          <div className="w-full max-w-[95%] !font-sans sm:max-w-6xl px-4">
            {/* This div will grow to fill the space when intro elements are hidden */}
          </div>
        )}
      </div>

      <div className="fixed bottom-5 left-0 right-0 bg-background/80 backdrop-blur-sm pb-4 pt-2">
        <div className="max-w-6xl mx-auto px-4">
          <SearchBox onConversationStart={handleChatStart} />
        </div>
      </div>
    </div>
  );
}
