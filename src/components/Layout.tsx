import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ThemeToggle from "./ThemeToggle";
import { Calendar, Globe, Menu } from "lucide-react";
import { formatNepaliDate } from "@/lib/nepali-date";

export default function Layout() {
  const today = new Date();
  const [showNepali, setShowNepali] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const englishDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const nepaliDate = formatNepaliDate(today);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: hidden off-screen on mobile, always visible on md+ */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="ml-0 w-full min-w-0 flex-1 p-3 sm:p-6 md:ml-64 lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-1 shrink-0 p-1.5 rounded-md border border-border hover:bg-accent transition-colors md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Calendar className="h-4 w-4 text-primary hidden sm:block" />
            <span className="font-medium text-foreground text-xs sm:text-sm truncate">
              {englishDate}
            </span>
            {showNepali && (
              <span className="text-primary font-medium text-xs sm:text-sm hidden sm:inline">
                • {nepaliDate}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => setShowNepali(!showNepali)}
              className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1.5 rounded-md border border-border hover:border-primary/30"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {showNepali ? "Hide Nepali Date" : "Nepali Date"}
              </span>
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
