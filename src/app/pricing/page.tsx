"use client";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Check, X } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
        <h1 className="text-5xl font-bold mb-4 text-center">Pricing</h1>
        <p className="text-xl text-neutral-400 mb-16 text-center">
          Use it for free for yourself, upgrade when your team needs advanced control.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          {/* Free Plan */}
          <div className="border border-neutral-800 rounded-lg p-8 flex flex-col">
            <h2 className="text-xl font-medium mb-6 text-center">Free</h2>
            <div className="text-4xl font-bold mb-2 text-center">$0/mo</div>
            <p className="text-neutral-400 mb-8 text-center">Best for 1-5 users</p>
            
            <div className="border-t border-neutral-800 my-4"></div>
            
            <ul className="space-y-4 flex-1">
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>One workspace</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Email support</span>
              </li>
              <li className="flex items-center">
                <X className="h-5 w-5 mr-3 text-neutral-600" />
                <span className="text-neutral-600">1 day data retention</span>
              </li>
              <li className="flex items-center">
                <X className="h-5 w-5 mr-3 text-neutral-600" />
                <span className="text-neutral-600">Custom roles</span>
              </li>
              <li className="flex items-center">
                <X className="h-5 w-5 mr-3 text-neutral-600" />
                <span className="text-neutral-600">Priority support</span>
              </li>
              <li className="flex items-center">
                <X className="h-5 w-5 mr-3 text-neutral-600" />
                <span className="text-neutral-600">SSO</span>
              </li>
            </ul>
            
            <Button className="mt-8 w-full bg-neutral-900 hover:bg-neutral-800 text-white">
              Get started free
            </Button>
          </div>
          
          {/* Pro Plan */}
          <div className="border border-neutral-800 rounded-lg p-8 flex flex-col">
            <h2 className="text-xl font-medium mb-6 text-center">Pro</h2>
            <div className="text-4xl font-bold mb-2 text-center">$79/mo</div>
            <p className="text-neutral-400 mb-8 text-center">Best for 5-50 users</p>
            
            <div className="border-t border-neutral-800 my-4"></div>
            
            <ul className="space-y-4 flex-1">
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Five workspaces</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Email support</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>7 day data retention</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Custom roles</span>
              </li>
              <li className="flex items-center">
                <X className="h-5 w-5 mr-3 text-neutral-600" />
                <span className="text-neutral-600">Priority support</span>
              </li>
              <li className="flex items-center">
                <X className="h-5 w-5 mr-3 text-neutral-600" />
                <span className="text-neutral-600">SSO</span>
              </li>
            </ul>
            
            <Button className="mt-8 w-full bg-white hover:bg-neutral-200 text-black">
              14-day free trial
            </Button>
          </div>
          
          {/* Enterprise Plan */}
          <div className="border border-neutral-800 rounded-lg p-8 flex flex-col">
            <h2 className="text-xl font-medium mb-6 text-center">Enterprise</h2>
            <div className="text-4xl font-bold mb-2 text-center">Contact us</div>
            <p className="text-neutral-400 mb-8 text-center">Best for 50+ users</p>
            
            <div className="border-t border-neutral-800 my-4"></div>
            
            <ul className="space-y-4 flex-1">
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Unlimited workspaces</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Email support</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>30 day data retention</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Custom roles</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-500" />
                <span>SSO</span>
              </li>
            </ul>
            
            <Button className="mt-8 w-full bg-neutral-900 hover:bg-neutral-800 text-white">
              Contact us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 