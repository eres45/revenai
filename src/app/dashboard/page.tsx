"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { RefreshCcw, User, DollarSign, BarChart, Key, FileText, Clock, CheckCircle, Image } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

interface ModelUsage {
  name: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: string;
  percentage: number;
  gradient: string;
}

interface DashboardData {
  user: {
    email: string;
    name: string;
    memberSince: string;
    plan: string;
    lastPlanChange: string;
    totalPayments: number;
  };
  usage: {
    totalRequests: number;
    imagesGenerated: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    successRate: number;
    estimatedCost: string;
    lastUpdated: string;
  };
  modelUsage: ModelUsage[];
}

// Map model names to gradients
const MODEL_GRADIENTS: Record<string, string> = {
  "Mistral Small 3.1 24B": "from-blue-500 to-purple-600",
  "LLaMA-3 70B": "from-amber-500 to-red-500",
  "OpenAI GPT-4.1": "from-green-400 to-teal-500",
  "DeepSeek Reasoning R1": "from-blue-400 to-indigo-600",
  "OpenAI O3 Reasoning": "from-purple-500 to-pink-500",
  "Qwen 2.5 Coder 32B": "from-yellow-400 to-orange-500"
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number>(120000); // 2 minutes default
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastServerUpdateRef = useRef<string | null>(null);

  // Function to fetch dashboard data
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // If we're already refreshing, don't start another refresh
    if (isRefreshing && !forceRefresh) return;
    
    // Show spinner only for manual refreshes or initial load
    if (forceRefresh) {
      setIsRefreshing(true);
    } else if (!dashboardData) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      // Make sure we have a user
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Get the current user's ID token with forceRefresh if needed
      const idToken = await user.getIdToken(forceRefresh);
      console.log('[Dashboard] Got Firebase ID token');
      
      // Add params
      const queryParams = new URLSearchParams();
      
      // Add a timestamp parameter to prevent caching by the browser
      const timestamp = new Date().getTime();
      if (forceRefresh) {
        queryParams.append('_nocache', timestamp.toString());
      }
      
      // Make the fetch request with the Authorization header containing the ID token
      const response = await fetch(`/api/dashboard?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Dashboard] Received data:', data);
      
      // Check if we got a token in the response header
      const authToken = response.headers.get('X-Firebase-Auth');
      if (authToken) {
        console.log('[Dashboard] Received auth token in response');
        // Could save this for future requests if needed
      }
      
      // Add gradients to model usage data
      const modelUsageWithGradients = data.modelUsage.map((model: any) => ({
        ...model,
        gradient: MODEL_GRADIENTS[model.name] || "from-gray-500 to-gray-700"
      }));
      
      // Check if there are new updates since last check
      const newLastUpdated = data.usage.lastUpdated;
      const hasNewData = lastServerUpdateRef.current !== newLastUpdated;
      
      if (hasNewData || !dashboardData) {
        console.log('[Dashboard] New data detected, updating dashboard');
        lastServerUpdateRef.current = newLastUpdated;
        
        // Adjust polling interval based on activity
        // If there was an update, poll more frequently for the next few minutes
        if (hasNewData && dashboardData) {
          console.log('[Dashboard] Activity detected, increasing polling frequency');
          setPollingInterval(30000); // 30 seconds when active
        } else if (dashboardData) {
          console.log('[Dashboard] No recent activity, reducing polling frequency');
          setPollingInterval(120000); // 2 minutes when inactive
        }
        
        setDashboardData({
          ...data,
          modelUsage: modelUsageWithGradients
        });
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isRefreshing, dashboardData]);

  // Fetch data on initial load and set up polling
  useEffect(() => {
    if (user) {
      console.log('[Dashboard] User authenticated:', user.email);
      console.log('[Dashboard] User object:', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      }));
      fetchDashboardData();
      
      // Set up polling with dynamic interval
      const setupPolling = () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        pollingIntervalRef.current = setInterval(() => fetchDashboardData(), pollingInterval);
        console.log(`[Dashboard] Polling set up with interval: ${pollingInterval}ms`);
      };
      
      setupPolling();
      
      // Update polling interval when it changes
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      console.log('[Dashboard] No user authenticated');
    }
  }, [user, fetchDashboardData, pollingInterval]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Today';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's today, just return "Today"
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Otherwise, format it nicely
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format the last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000); // seconds
    
    if (diff < 60) return 'Updated just now';
    if (diff < 120) return 'Updated 1 minute ago';
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)} minutes ago`;
    if (diff < 7200) return 'Updated 1 hour ago';
    return `Updated ${Math.floor(diff / 3600)} hours ago`;
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Header />
        
        <div className="flex-1 px-4 py-20 pt-24 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-neutral-400">Welcome, {user?.displayName || dashboardData?.user.name || 'user'}!</p>
              {lastUpdated && (
                <p className="text-xs text-neutral-500 mt-1">{getLastUpdatedText()}</p>
              )}
            </div>
            
            <Button 
              className="flex gap-2 items-center bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800"
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
          
          {/* Show error if any */}
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-300 px-4 py-3 rounded mb-6">
              <p className="font-medium">Error loading dashboard</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Show skeleton loading state only on initial load */}
          {loading && !dashboardData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skeleton UI for loading state */}
              <div className="md:col-span-2 bg-black border border-neutral-800 rounded-xl p-6 shadow-lg shadow-blue-900/5 animate-pulse">
                <div className="h-5 bg-neutral-800 rounded w-40 mb-6"></div>
                <div className="grid grid-cols-2 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-neutral-800 rounded w-24"></div>
                      <div className="h-4 bg-neutral-800 rounded w-32"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-black border border-neutral-800 rounded-xl p-6 flex flex-col items-center shadow-lg shadow-purple-900/5 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-neutral-800 mb-4"></div>
                <div className="h-5 bg-neutral-800 rounded w-32 mb-2"></div>
                <div className="h-4 bg-neutral-800 rounded w-48 mb-6"></div>
                <div className="w-full space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-neutral-800 rounded w-24"></div>
                      <div className="h-4 bg-neutral-800 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 bg-black border border-neutral-800 rounded-xl p-6 shadow-lg shadow-green-900/5 animate-pulse">
                <div className="h-5 bg-neutral-800 rounded w-40 mb-6"></div>
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-neutral-800 rounded w-32"></div>
                        <div className="h-4 bg-neutral-800 rounded w-24"></div>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Usage Stats */}
              <div className="md:col-span-2 bg-black border border-neutral-800 rounded-xl p-6 shadow-lg shadow-blue-900/5">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white tracking-tight">Usage Summary</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <p className="text-neutral-400 font-medium text-sm">Total Requests</p>
                    <p className="text-2xl font-bold">{isRefreshing ? '...' : formatNumber(dashboardData?.usage.totalRequests || 0)}</p>
                  </div>
                  
                  <div>
                    <p className="text-neutral-400 font-medium text-sm">Total Tokens</p>
                    <p className="text-2xl font-bold">{isRefreshing ? '...' : formatNumber(dashboardData?.usage.totalTokens || 0)}</p>
                  </div>
                  
                  <div>
                    <p className="text-neutral-400 font-medium text-sm">Success Rate</p>
                    <p className="text-2xl font-bold">{isRefreshing ? '...' : `${dashboardData?.usage.successRate || 100}%`}</p>
                  </div>
                  
                  <div>
                    <p className="text-neutral-400 font-medium text-sm">Input Tokens</p>
                    <p className="text-2xl font-bold">{isRefreshing ? '...' : formatNumber(dashboardData?.usage.inputTokens || 0)}</p>
                  </div>
                  
                  <div>
                    <p className="text-neutral-400 font-medium text-sm">Output Tokens</p>
                    <p className="text-2xl font-bold">{isRefreshing ? '...' : formatNumber(dashboardData?.usage.outputTokens || 0)}</p>
                  </div>
                  
                  <div>
                    <p className="text-neutral-400 font-medium text-sm">Est. Cost</p>
                    <p className="text-2xl font-bold">${isRefreshing ? '...' : dashboardData?.usage.estimatedCost || '0.00'}</p>
                  </div>
                </div>
              </div>
              
              {/* Account Status */}
              <div className="bg-black border border-neutral-800 rounded-xl p-6 shadow-lg shadow-amber-900/5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <BarChart className="h-3 w-3 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white tracking-tight">Account Status</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Current Plan:</span>
                    <span className="font-medium text-white">{dashboardData?.user.plan || 'Free'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Plan Validity:</span>
                    <span className="font-medium text-white">Unlimited</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Last Activity:</span>
                    <span className="font-medium text-white">
                      {dashboardData?.usage.lastUpdated ? formatDate(dashboardData.usage.lastUpdated) : 'Today'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* User Profile */}
              <div className="bg-black border border-neutral-800 rounded-xl p-6 flex flex-col items-center shadow-lg shadow-purple-900/5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-purple-500/20 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : dashboardData?.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{user?.displayName || dashboardData?.user.name || 'User'}</h3>
                <p className="text-neutral-400 text-sm mb-6">{user?.email || dashboardData?.user.email || 'user@example.com'}</p>
                
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 text-blue-400" />
                      Member Since:
                    </span>
                    <span className="text-white">{dashboardData ? formatDate(dashboardData.user.memberSince) : 'Today'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-2 font-medium">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                      Total Payments:
                    </span>
                    <span className="text-white">${dashboardData?.user.totalPayments?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-blue-400" />
                      Last Plan Change:
                    </span>
                    <span className="text-white">{dashboardData?.user.lastPlanChange || 'Free'}</span>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                    <Key className="h-4 w-4" />
                    Manage API Keys
                  </Button>
                </div>
              </div>
              
              {/* Model Usage */}
              <div className="md:col-span-2 bg-black border border-neutral-800 rounded-xl p-6 shadow-lg shadow-green-900/5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white tracking-tight">Model Usage</h2>
                </div>
                
                <div className="space-y-6">
                  {isRefreshing ? (
                    // Skeleton loading for model usage when refreshing
                    <>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2 animate-pulse">
                          <div className="flex justify-between items-center">
                            <div className="h-4 bg-neutral-800 rounded w-32"></div>
                            <div className="h-4 bg-neutral-800 rounded w-24"></div>
                          </div>
                          <div className="h-2 bg-neutral-800 rounded-full w-full"></div>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Real data
                    <>
                      {(dashboardData?.modelUsage || []).map((model, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">{model.name}</span>
                            <span className="text-sm text-neutral-400">
                              {model.requests} reqs · {formatNumber(model.totalTokens)} tokens · ${model.cost}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full bg-gradient-to-r ${model.gradient} rounded-full`} 
                              style={{ width: `${model.percentage}%` }} 
                            />
                          </div>
                          <div className="flex justify-between text-xs text-neutral-500">
                            <span>Input: {formatNumber(model.inputTokens)} tokens</span>
                            <span>Output: {formatNumber(model.outputTokens)} tokens</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 