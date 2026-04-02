import { useState, useMemo, useCallback, useEffect } from "react";
import { useTransactions, formatCurrency } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Save, Check } from "lucide-react";
import { formatNepaliDateFromISO } from "@/lib/nepali-date";
import { motion } from "framer-motion";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getDayName(year: number, month: number, day: number) {
  return new Date(year, month, day).toLocaleDateString("en-IN", { weekday: "short" });
}

export default function Transportation() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [dailyAmounts, setDailyAmounts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const daysCount = getDaysInMonth(selectedYear, selectedMonth);

  // Get existing transportation transactions for this month
  const existingTransport = useMemo(() => {
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.category === "Transportation" &&
        t.description.startsWith("Daily Transport") &&
        t.date.startsWith(monthKey)
    );
  }, [transactions, selectedYear, selectedMonth]);

  // Map day number to existing transaction
  const existingByDay = useMemo(() => {
    const map: Record<number, { id: string; amount: number }> = {};
    existingTransport.forEach((t) => {
      const day = new Date(t.date).getDate();
      map[day] = { id: t.id, amount: t.amount };
    });
    return map;
  }, [existingTransport]);

  // Initialize daily amounts from existing data when month changes
  useEffect(() => {
    const init: Record<number, string> = {};
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    const monthTransport = transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.category === "Transportation" &&
        t.description.startsWith("Daily Transport") &&
        t.date.startsWith(monthKey)
    );
    for (const t of monthTransport) {
      const day = new Date(t.date).getDate();
      init[day] = String(t.amount);
    }
    setDailyAmounts(init);
  }, [selectedYear, selectedMonth, transactions.length]);

  const totalMonthly = useMemo(() => {
    let total = 0;
    for (let d = 1; d <= daysCount; d++) {
      const val = parseFloat(dailyAmounts[d] || "0");
      if (val > 0) total += val;
    }
    return total;
  }, [dailyAmounts, daysCount]);

  const filledDays = Object.values(dailyAmounts).filter((v) => parseFloat(v || "0") > 0).length;

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      // Delete existing daily transport entries for this month
      for (const t of existingTransport) {
        await deleteTransaction(t.id);
      }

      // Add new entries for days with amounts
      for (let d = 1; d <= daysCount; d++) {
        const amt = parseFloat(dailyAmounts[d] || "0");
        if (amt > 0) {
          const dateStr = new Date(selectedYear, selectedMonth, d).toISOString();
          await addTransaction({
            type: "expense",
            amount: amt,
            category: "Transportation",
            description: `Daily Transport - Day ${d}`,
            date: dateStr,
          });
        }
      }
      toast.success(`Transportation expenses saved for ${MONTHS[selectedMonth]} ${selectedYear}`);
    } catch {
      toast.error("Failed to save. Please try again.");
    }
    setSaving(false);
  }, [existingTransport, dailyAmounts, daysCount, selectedYear, selectedMonth, addTransaction, deleteTransaction]);

  const years = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur - 1, cur, cur + 1];
  }, []);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Daily Transportation</h1>
            <p className="text-sm text-muted-foreground">
              Enter daily transport costs · {filledDays}/{daysCount} days filled
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 flex items-center justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Transportation — {MONTHS[selectedMonth]} {selectedYear}
          </p>
          <p className="mt-1 font-heading text-3xl font-bold text-expense">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Avg/day</p>
            <p className="font-heading font-semibold text-foreground">
              {formatCurrency(filledDays > 0 ? totalMonthly / filledDays : 0)}
            </p>
          </div>
          <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
            {saving ? <span className="animate-spin">⏳</span> : <Save className="h-4 w-4" />}
            Save All
          </Button>
        </div>
      </motion.div>

      {/* Daily Grid */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => {
            const dateISO = new Date(selectedYear, selectedMonth, day).toISOString();
            const dayName = getDayName(selectedYear, selectedMonth, day);
            const isSunday = new Date(selectedYear, selectedMonth, day).getDay() === 0;
            const isToday = isCurrentMonth && today.getDate() === day;
            const hasValue = parseFloat(dailyAmounts[day] || "0") > 0;
            const isSaved = !!existingByDay[day];

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: day * 0.01 }}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  isToday
                    ? "border-primary bg-primary/5"
                    : isSunday
                    ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10"
                    : "border-border"
                }`}
              >
                <div className={`w-14 text-center ${isSunday ? "text-red-500" : "text-muted-foreground"}`}>
                  <p className="text-xs font-medium">{dayName}</p>
                  <p className="text-lg font-heading font-bold">{day}</p>
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="₹ 0"
                    value={dailyAmounts[day] || ""}
                    onChange={(e) =>
                      setDailyAmounts((prev) => ({ ...prev, [day]: e.target.value }))
                    }
                    className="h-8 text-sm font-heading"
                  />
                  <p className="text-[10px] text-muted-foreground truncate">
                    {formatNepaliDateFromISO(dateISO)}
                  </p>
                </div>
                {isSaved && hasValue && (
                  <Check className="h-4 w-4 text-income shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
