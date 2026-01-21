"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

export function WarningDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show the warning dialog after a short delay
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 bg-neutral-50 dark:bg-neutral-900 sm:max-w-[425px]">
        <DialogHeader className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <img
              src="https://ext.same-assets.com/2811501481/2508737671.svg"
              alt=""
              width="20"
              height="20"
              style={{ width: "20px", height: "20px" }}
            />
            Warning
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600 dark:text-neutral-400">
            Scira is an AI search engine and is not associated with any cryptocurrency, memecoin, or token activities. Beware of impersonators.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4">
          <Button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-9 px-4 py-2 w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
            onClick={() => setOpen(false)}
          >
            Got it, thanks
          </Button>
        </DialogFooter>
        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setOpen(false)}
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
