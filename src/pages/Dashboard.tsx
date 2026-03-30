import { Wallet, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useTransactions, formatCurrency, getMonthKey } from "@/lib/store";
import StatCard from "@/components/StatCard";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import RecentTransactions from "@/components/RecentTransactions";
import SpendingChart from "@/components/SpendingChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";

export default function Dashboard() {
  const { transactions } = useTransactions();
  const currentMonth = getMonthKey(new Date());

  const monthTx = transactions.filter((t) => getMonthKey(t.date) === currentMonth);
  const totalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const txCount = monthTx.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} Overview
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Balance" value={formatCurrency(balance)} icon={Wallet} delay={0} />
        <StatCard title="Income" value={formatCurrency(totalIncome)} icon={TrendingUp} variant="income" delay={0.1} />
        <StatCard title="Expenses" value={formatCurrency(totalExpense)} icon={TrendingDown} variant="expense" delay={0.2} />
        <StatCard title="Transactions" value={String(txCount)} subtitle="this month" icon={BarChart3} variant="info" delay={0.3} />
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
