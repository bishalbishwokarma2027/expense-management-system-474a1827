import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowUpDown, BarChart3, Target, Bus, CalendarDays, Sparkles, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, SectionId } from "@/contexts/SettingsContext";

const navItems: { to: string; icon: any; label: string; id: SectionId }[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { to: "/transactions", icon: ArrowUpDown, label: "Transactions", id: "transactions" },
  { to: "/reports", icon: BarChart3, label: "Reports", id: "reports" },
  { to: "/budgets", icon: Target, label: "Budgets", id: "budgets" },
  { to: "/transportation", icon: Bus, label: "Transportation", id: "transportation" },
  { to: "/track-expense", icon: CalendarDays, label: "Track Expense", id: "track-expense" },
  { to: "/ai-assistant", icon: Sparkles, label: "AI Assistant", id: "ai-assistant" },
];

interface AppSidebarProps {
  onClose?: () => void;
}

export default function AppSidebar({ onClose }: AppSidebarProps) {
  const location = useLocation();
  const { visibleSections } = useSettings();

  const filteredItems = navItems.filter((item) => visibleSections.includes(item.id));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar p-4">
      <div className="mb-8 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm">
            ₹
          </div>
          <h1 className="font-heading text-lg font-bold text-foreground tracking-tight">
            ExpenseIQ
          </h1>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors md:hidden">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {filteredItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
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

      <div className="mt-auto space-y-2">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            location.pathname === "/settings"
              ? "bg-primary/10 text-primary glow-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
        <div className="border-t border-border pt-4">
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
      </div>
    </aside>
  );
}
