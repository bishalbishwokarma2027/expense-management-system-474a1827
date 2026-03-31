import { useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTransactions, useBudgets, formatCurrency, getMonthKey, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { formatNepaliDate } from "@/lib/nepali-date";
import StatCard from "@/components/StatCard";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import RecentTransactions from "@/components/RecentTransactions";
import SpendingChart from "@/components/SpendingChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const now = new Date();
  const currentMonth = getMonthKey(now);
  const nepaliToday = formatNepaliDate(now);

  const monthTx = transactions.filter((t) => getMonthKey(t.date) === currentMonth);
  const totalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const txCount = monthTx.length;

  // Budget usage
  const totalBudget = budgets
    .filter((b) => b.month === currentMonth)
    .reduce((s, b) => s + b.limit, 0);
  const budgetUsed = totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : 0;

  // Top spending category
  const topCategory = useMemo(() => {
    const expTx = monthTx.filter((t) => t.type === "expense");
    const catMap = new Map<string, number>();
    expTx.forEach((t) => catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount));
    let top = { name: "", amount: 0 };
    catMap.forEach((amount, name) => { if (amount > top.amount) top = { name, amount }; });
    const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    const icon = allCats.find((c) => c.name === top.name)?.icon || "📦";
    return { ...top, icon };
  }, [monthTx]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 glass-card px-3 py-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div className="text-xs">
              <p className="font-medium text-foreground">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</p>
              <p className="text-primary/80">{nepaliToday}</p>
            </div>
          </div>
          <AddTransactionDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Balance" value={formatCurrency(balance)} icon={Wallet} delay={0} />
        <StatCard title="Income" value={formatCurrency(totalIncome)} icon={TrendingUp} variant="income" delay={0.1} />
        <StatCard title="Expenses" value={formatCurrency(totalExpense)} icon={TrendingDown} variant="expense" delay={0.2} />
        <StatCard title="Transactions" value={String(txCount)} subtitle="this month" icon={BarChart3} variant="info" delay={0.3} />
      </div>

      {/* Quick insights row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Budget Used</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${budgetUsed > 90 ? "bg-expense" : budgetUsed > 70 ? "bg-warning" : "bg-primary"}`}
                style={{ width: `${budgetUsed}%` }}
              />
            </div>
            <span className="text-sm font-heading font-bold text-foreground">{budgetUsed.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(totalExpense)} of {formatCurrency(totalBudget)}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Top Spending</p>
          {topCategory.name ? (
            <div className="flex items-center gap-2">
              <span className="text-xl">{topCategory.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{topCategory.name}</p>
                <p className="text-xs text-expense font-heading font-bold">{formatCurrency(topCategory.amount)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No expenses yet</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Savings Rate</p>
          <div className="flex items-center gap-2">
            {balance >= 0 ? (
              <ArrowUpRight className="h-5 w-5 text-income" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-expense" />
            )}
            <span className={`text-xl font-heading font-bold ${balance >= 0 ? "text-income" : "text-expense"}`}>
              {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">of total income saved</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold text-foreground">
            Monthly Trend
          </h2>
          <MonthlyTrendChart />
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold text-foreground">
            Spending by Category
          </h2>
          <SpendingChart />
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="mb-3 font-heading text-sm font-semibold text-foreground">
          Recent Transactions
        </h2>
        <RecentTransactions limit={8} />
      </div>
    </div>
  );
}
