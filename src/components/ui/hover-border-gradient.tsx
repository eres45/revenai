"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Component = "div",
  ...props
}: {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  as?: React.ElementType;
  [key: string]: any;
}) {
  return (
    <div className={cn("relative p-[1px] group", containerClassName)}>
      <div
        className="absolute inset-0 rounded-[inherit] bg-gradient-to-r opacity-0 group-hover:opacity-100 from-indigo-500 via-purple-500 to-pink-500 transition duration-300"
        aria-hidden="true"
      />
      <Component
        className={cn(
          "relative flex items-center justify-center px-4 py-2 rounded-[inherit] bg-background",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    </div>
  );
} 