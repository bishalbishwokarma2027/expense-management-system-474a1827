import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ThemeToggle from "./ThemeToggle";
import { Calendar, Globe } from "lucide-react";
import { formatNepaliDate } from "@/lib/nepali-date";

export default function Layout() {
  const today = new Date();
  const [showNepali, setShowNepali] = useState(false);

  const englishDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const nepaliDate = formatNepaliDate(today);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{englishDate}</span>
            {showNepali && (
              <span className="text-primary font-medium">• {nepaliDate}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowNepali(!showNepali)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2.5 py-1.5 rounded-md border border-border hover:border-primary/30"
            >
              <Globe className="h-3.5 w-3.5" />
              {showNepali ? "Hide Nepali Date" : "Nepali Date"}
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
