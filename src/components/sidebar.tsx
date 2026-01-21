"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, Settings, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryItem {
  id: string;
  title: string;
  date: Date;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Format date to relative time
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-background border-r border-border shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-border">
            <h1 className="text-lg font-medium">Menu</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          {/* Logo Section */}
          <div className="flex items-center px-4 py-6 border-b border-border pl-8">
            <img
              src="/AI assistant - Animation.gif"
              alt="RevenAI Logo"
              className="h-12 w-12 object-contain rounded-full mr-1"
            />
            <h1 className="text-xl font-semibold">RevenAI</h1>
          </div>

          {/* New Chat Button */}
          <div className="px-4 py-4">
            <Link href="/" onClick={onClose}>
              <Button
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Chat</span>
              </Button>
            </Link>
          </div>

          {/* History Section */}
          <div className="flex-grow overflow-y-auto px-2">
            <div className="text-sm text-muted-foreground font-medium px-3 py-2">
              History
            </div>
            <div className="space-y-1">
              {history.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start text-left px-3 py-2 h-auto"
                >
                  <div className="truncate flex-1">
                    <span className="block text-sm">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{formatDate(item.date)}</span>
                  </div>
                </Button>
              ))}
              {history.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No chat history yet
                </div>
              )}
            </div>
          </div>

          {/* Settings and Pricing Buttons */}
          <div className="mt-auto border-t border-border p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start gap-2"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>

            <Link href="/pricing" className="w-full" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start gap-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Upgrade to Pro</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
} 