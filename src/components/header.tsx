"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MenuIcon, BarChart3Icon, SparklesIcon, UserCircleIcon } from "lucide-react";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/auth-context";
import { GoogleSignInModal } from "./google-signin-modal";
import { useRouter } from "next/navigation";

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { user, logOut } = useAuth();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(prev => !prev);
  };

  const openSignInModal = () => {
    setIsSignInModalOpen(true);
  };

  const closeSignInModal = () => {
    setIsSignInModalOpen(false);
  };

  const handleUsageClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      openSignInModal();
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-secondary-foreground shadow-sm h-9 px-4 py-2 rounded-full bg-accent hover:bg-accent/80 backdrop-blur-sm group transition-all hover:scale-105 pointer-events-auto"
            type="button"
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-4 w-4" />
            <span className="text-sm ml-2 group-hover:block hidden animate-in fade-in duration-300">
              Menu
            </span>
          </Button>

          {/* Logo and Name as Home Button */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="flex items-center">
              <img
                src="/AI assistant - Animation.gif"
                alt="RevenAI Logo"
                className="h-8 w-8 object-contain rounded-full mr-2"
              />
              <h1 className="text-lg font-semibold hidden sm:block">RevenAI</h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {/* Usage Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={handleUsageClick}
          >
            <Link href={user ? "/dashboard" : "#"} onClick={e => !user && e.preventDefault()}>
              <BarChart3Icon className="h-5 w-5" />
              <span className="sr-only">Usage</span>
            </Link>
          </Button>

          {/* Upgrade Button */}
          <Link href="/pricing">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="button"
              className="px-3 py-1.5 text-sm flex items-center gap-2"
            >
              <SparklesIcon className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline font-medium">Upgrade</span>
            </HoverBorderGradient>
          </Link>

          {/* User Circle for Google Sign-in */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={user ? toggleUserMenu : openSignInModal}
          >
            {user && user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <UserCircleIcon className="h-6 w-6" />
            )}
          </Button>

          {/* User Menu (only shown when logged in) */}
          {user && isUserMenuOpen && (
            <div className="absolute right-4 top-16 w-48 bg-white dark:bg-neutral-900 rounded-md shadow-lg py-1 z-50 border border-neutral-200 dark:border-neutral-800">
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
                <p className="text-sm font-medium">{user.displayName || user.email}</p>
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
              </div>
              <Link href="/dashboard">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  Dashboard
                </button>
              </Link>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Google Sign-in Modal */}
      <GoogleSignInModal isOpen={isSignInModalOpen} onClose={closeSignInModal} />

      {/* Simple Toast message for sign-in prompt */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-3 rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          Please sign in to view your dashboard
        </div>
      )}

      {/* Backdrop for user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </>
  );
}
