import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowUpDown, BarChart3, Target, Bus, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowUpDown, label: "Transactions" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/budgets", icon: Target, label: "Budgets" },
  { to: "/transportation", icon: Bus, label: "Transportation" },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-sidebar p-4">
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm">
          ₹
        </div>
        <h1 className="font-heading text-lg font-bold text-foreground tracking-tight">
          ExpenseIQ
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary glow-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="glass-card p-3">
          <p className="text-xs text-muted-foreground">Real-time tracking</p>
          <p className="mt-1 text-xs text-primary font-medium">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </aside>
  );
}
