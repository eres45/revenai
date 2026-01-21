"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function TimeDate() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format time as "hh:mm AM/PM"
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

      // Format date as "Day, Mon DD"
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayOfWeek = days[now.getDay()];
      const month = months[now.getMonth()];
      const dayOfMonth = now.getDate();
      const dateString = `${dayOfWeek}, ${month} ${dayOfMonth}`;

      setCurrentTime(timeString);
      setCurrentDate(dateString);
    };

    // Update time immediately and then every minute
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 w-full">
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          className="justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:text-accent-foreground group flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:shadow-sm transition-all h-auto"
          variant="outline"
        >
          <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
            {currentTime}
          </span>
        </Button>
        <Button
          className="justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:text-accent-foreground group flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:shadow-sm transition-all h-auto"
          variant="outline"
        >
          <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
            {currentDate}
          </span>
        </Button>
      </div>
    </div>
  );
}
