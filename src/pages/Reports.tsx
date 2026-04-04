import { useState, useMemo } from "react";
import { useTransactions, formatCurrency, getMonthKey, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, FileText, ArrowLeft, Globe } from "lucide-react";
import ReportFormView from "@/components/ReportFormView";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Reports() {
  const { transactions } = useTransactions();
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [showReportForm, setShowReportForm] = useState(false);
  const [showNepaliDates, setShowNepaliDates] = useState(false);

  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => new Date(t.date).getFullYear()));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions]);

  const filteredTx = useMemo(() => {
    if (view === "yearly") {
      return transactions.filter((t) => new Date(t.date).getFullYear() === Number(selectedYear));
    }
    const key = `${selectedYear}-${String(Number(selectedMonth) + 1).padStart(2, "0")}`;
    return transactions.filter((t) => getMonthKey(t.date) === key);
  }, [transactions, view, selectedYear, selectedMonth]);

  const income = filteredTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = filteredTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Calculate previous month's net balance for carry-forward
  const previousMonthBalance = useMemo(() => {
    if (view !== "monthly") return 0;
    const m = Number(selectedMonth);
    const y = Number(selectedYear);
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    const prevKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
    const prevTx = transactions.filter((t) => getMonthKey(t.date) === prevKey);
    const prevIncome = prevTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const prevExpense = prevTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return prevIncome - prevExpense;
  }, [transactions, view, selectedYear, selectedMonth]);

  const savings = income - expense + (previousMonthBalance > 0 ? previousMonthBalance : 0);
  const totalAvailable = income + (previousMonthBalance > 0 ? previousMonthBalance : 0);
  const savingsRate = totalAvailable > 0 ? ((savings / totalAvailable) * 100).toFixed(1) : "0.0";

  const expenseBreakdown = useMemo(() => {
    const expTx = filteredTx.filter((t) => t.type === "expense");
    const allCats = EXPENSE_CATEGORIES.map((cat) => ({
      ...cat,
      total: expTx.filter((t) => t.category === cat.name).reduce((s, t) => s + t.amount, 0),
      count: expTx.filter((t) => t.category === cat.name).length,
    }));
    // Include custom categories
    const knownNames = new Set(EXPENSE_CATEGORIES.map((c) => c.name));
    const customCats = expTx
      .filter((t) => !knownNames.has(t.category))
      .reduce((acc, t) => {
        const existing = acc.find((c) => c.name === t.category);
        if (existing) { existing.total += t.amount; existing.count++; }
        else acc.push({ name: t.category, icon: "📦", color: "hsl(0, 0%, 50%)", total: t.amount, count: 1 });
        return acc;
      }, [] as { name: string; icon: string; color: string; total: number; count: number }[]);
    return [...allCats, ...customCats].filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  }, [filteredTx]);

  const incomeBreakdown = useMemo(() => {
    const incTx = filteredTx.filter((t) => t.type === "income");
    const allCats = INCOME_CATEGORIES.map((cat) => ({
      ...cat,
      total: incTx.filter((t) => t.category === cat.name).reduce((s, t) => s + t.amount, 0),
      count: incTx.filter((t) => t.category === cat.name).length,
    }));
    const knownNames = new Set(INCOME_CATEGORIES.map((c) => c.name));
    const customCats = incTx
      .filter((t) => !knownNames.has(t.category))
      .reduce((acc, t) => {
        const existing = acc.find((c) => c.name === t.category);
        if (existing) { existing.total += t.amount; existing.count++; }
        else acc.push({ name: t.category, icon: "💵", color: "hsl(160, 84%, 39%)", total: t.amount, count: 1 });
        return acc;
      }, [] as { name: string; icon: string; color: string; total: number; count: number }[]);
    return [...allCats, ...customCats].filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  }, [filteredTx]);

  const topExpense = expenseBreakdown[0];
  const topIncome = incomeBreakdown[0];

  const periodLabel = view === "monthly"
    ? `${MONTHS[Number(selectedMonth)]} ${selectedYear}`
    : `Year ${selectedYear}`;

  if (showReportForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowReportForm(false)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Report Form</h1>
              <p className="text-sm text-muted-foreground">{periodLabel}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNepaliDates(!showNepaliDates)}
            className="gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" />
            {showNepaliDates ? "Hide Nepali Dates" : "Show Nepali Dates"}
          </Button>
        </div>
        <ReportFormView transactions={filteredTx} periodLabel={periodLabel} showNepaliDates={showNepaliDates} previousMonthBalance={previousMonthBalance} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">{periodLabel} — Financial Summary</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={view === "monthly" ? "bg-primary/10 text-primary rounded-none" : "rounded-none text-muted-foreground"}
              onClick={() => setView("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={view === "yearly" ? "bg-primary/10 text-primary rounded-none" : "rounded-none text-muted-foreground"}
              onClick={() => setView("yearly")}
            >
              Yearly
            </Button>
          </div>
          {view === "monthly" && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportForm(true)}
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <FileText className="h-4 w-4" />
            In Report Form
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Income", value: income, icon: TrendingUp, cls: "text-income", bgCls: "bg-income/10 text-income" },
          { label: "Total Expenses", value: expense, icon: TrendingDown, cls: "text-expense", bgCls: "bg-expense/10 text-expense" },
          { label: "Net Savings", value: savings, icon: Wallet, cls: savings >= 0 ? "text-income" : "text-expense", bgCls: savings >= 0 ? "bg-income/10 text-income" : "bg-expense/10 text-expense" },
          { label: "Savings Rate", value: null, icon: ArrowUpRight, cls: "text-primary", bgCls: "bg-primary/10 text-primary", displayValue: `${savingsRate}%` },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`mt-1 font-heading text-xl font-bold ${item.cls}`}>
                  {item.displayValue ?? formatCurrency(item.value!)}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgCls}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Highest Expense</h3>
          {topExpense ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{topExpense.icon}</span>
              <div className="flex-1">
                <p className="font-heading font-semibold text-foreground">{topExpense.name}</p>
                <p className="text-xs text-muted-foreground">{topExpense.count} transaction{topExpense.count > 1 ? "s" : ""}</p>
              </div>
              <p className="font-heading font-bold text-expense">{formatCurrency(topExpense.total)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No expenses recorded</p>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Top Income Source</h3>
          {topIncome ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{topIncome.icon}</span>
              <div className="flex-1">
                <p className="font-heading font-semibold text-foreground">{topIncome.name}</p>
                <p className="text-xs text-muted-foreground">{topIncome.count} transaction{topIncome.count > 1 ? "s" : ""}</p>
              </div>
              <p className="font-heading font-bold text-income">{formatCurrency(topIncome.total)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No income recorded</p>
          )}
        </motion.div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-expense" /> Expense Breakdown
          </h2>
          <div className="space-y-3">
            {expenseBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No expenses recorded</p>
            )}
            {expenseBreakdown.map((c, i) => {
              const pct = expense > 0 ? (c.total / expense) * 100 : 0;
              return (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{c.icon}</span>
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">({c.count})</span>
                    </span>
                    <span className="font-heading font-semibold text-expense">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-income" /> Income Breakdown
          </h2>
          <div className="space-y-3">
            {incomeBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No income recorded</p>
            )}
            {incomeBreakdown.map((c, i) => {
              const pct = income > 0 ? (c.total / income) * 100 : 0;
              return (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{c.icon}</span>
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">({c.count})</span>
                    </span>
                    <span className="font-heading font-semibold text-income">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction count summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <h2 className="mb-3 font-heading text-sm font-semibold">Period Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">{filteredTx.length}</p>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-income">{filteredTx.filter(t => t.type === "income").length}</p>
            <p className="text-xs text-muted-foreground">Income Entries</p>
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-expense">{filteredTx.filter(t => t.type === "expense").length}</p>
            <p className="text-xs text-muted-foreground">Expense Entries</p>
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-primary">{expenseBreakdown.length + incomeBreakdown.length}</p>
            <p className="text-xs text-muted-foreground">Categories Used</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
