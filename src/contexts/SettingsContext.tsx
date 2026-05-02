import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

const ALL_SECTIONS = [
  "dashboard",
  "transactions",
  "reports",
  "budgets",
  "transportation",
  "track-expense",
  "ai-assistant",
] as const;

export type SectionId = typeof ALL_SECTIONS[number];

interface SettingsContextType {
  visibleSections: SectionId[];
  toggleSection: (id: SectionId) => void;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  visibleSections: [...ALL_SECTIONS],
  toggleSection: () => {},
  loading: true,
});

export const useSettings = () => useContext(SettingsContext);
export { ALL_SECTIONS };

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [visibleSections, setVisibleSections] = useState<SectionId[]>([...ALL_SECTIONS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("visible_sections")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.visible_sections) {
        setVisibleSections(data.visible_sections as SectionId[]);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const toggleSection = useCallback(async (id: SectionId) => {
    if (!user) return;
    const next = visibleSections.includes(id)
      ? visibleSections.filter((s) => s !== id)
      : [...visibleSections, id];
    setVisibleSections(next);
    await supabase
      .from("user_settings")
      .update({ visible_sections: next as unknown as any })
      .eq("user_id", user.id);
  }, [user, visibleSections]);

  return (
    <SettingsContext.Provider value={{ visibleSections, toggleSection, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
