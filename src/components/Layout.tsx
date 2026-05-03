import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ThemeToggle from "./ThemeToggle";
import { Calendar, Globe, Menu, X } from "lucide-react";
import { formatNepaliDate } from "@/lib/nepali-date";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Layout() {
  const today = new Date();
  const [showNepali, setShowNepali] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const englishDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const nepaliDate = formatNepaliDate(today);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : ""
        }
      >
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className={`flex-1 ${isMobile ? "ml-0" : "ml-64"} p-4 sm:p-6 lg:p-8`}>
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4 gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-1 p-1.5 rounded-md border border-border hover:bg-accent transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
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
