import { useAuth } from "@/contexts/AuthContext";
import { useSettings, ALL_SECTIONS, SectionId } from "@/contexts/SettingsContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, ArrowUpDown, BarChart3, Target, Bus, CalendarDays, Sparkles } from "lucide-react";

const sectionMeta: Record<SectionId, { label: string; icon: React.ReactNode }> = {
  dashboard: { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  transactions: { label: "Transactions", icon: <ArrowUpDown className="h-4 w-4" /> },
  reports: { label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
  budgets: { label: "Budgets", icon: <Target className="h-4 w-4" /> },
  transportation: { label: "Transportation", icon: <Bus className="h-4 w-4" /> },
  "track-expense": { label: "Track Expense", icon: <CalendarDays className="h-4 w-4" /> },
  "ai-assistant": { label: "AI Assistant", icon: <Sparkles className="h-4 w-4" /> },
};

export default function Settings() {
  const { user, signOut } = useAuth();
  const { visibleSections, toggleSection } = useSettings();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and app sections</p>
      </div>

      <div className="glass-card p-5 rounded-xl border border-border bg-card space-y-2">
        <h2 className="font-semibold text-foreground mb-3">Account</h2>
        <p className="text-sm text-muted-foreground">Signed in as <span className="text-foreground font-medium">{user?.email}</span></p>
        <Button variant="destructive" size="sm" onClick={signOut} className="mt-3">
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>

      <div className="glass-card p-5 rounded-xl border border-border bg-card space-y-4">
        <h2 className="font-semibold text-foreground mb-1">Visible Sections</h2>
        <p className="text-sm text-muted-foreground mb-3">Enable or disable sections in the sidebar menu</p>
        {ALL_SECTIONS.map((id) => {
          const meta = sectionMeta[id];
          return (
            <div key={id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{meta.icon}</span>
                <Label htmlFor={`section-${id}`} className="cursor-pointer">{meta.label}</Label>
              </div>
              <Switch
                id={`section-${id}`}
                checked={visibleSections.includes(id)}
                onCheckedChange={() => toggleSection(id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
