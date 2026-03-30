import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Calendar } from "lucide-react";

export default function Layout() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground border-b border-border pb-4">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{formattedDate}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
