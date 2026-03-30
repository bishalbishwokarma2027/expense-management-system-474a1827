import { useState, useMemo } from "react";
import { useTransactions, formatCurrency, getMonthKey, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { motion } from "framer-motion";

export default function Reports() {
  const { transactions } = useTransactions();
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => new Date(t.date).getFullYear()));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Number(selectedYear), i);
      const key = getMonthKey(d);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const monthTx = transactions.filter((t) => getMonthKey(t.date) === key);
      const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return { month: label, income, expense, savings: income - expense };
    });
    return months;
  }, [transactions, selectedYear]);

  const yearlyTotals = useMemo(() => {
    const yearTx = transactions.filter((t) => new Date(t.date).getFullYear() === Number(selectedYear));
    const income = yearTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = yearTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, savings: income - expense };
  }, [transactions, selectedYear]);

  const categoryBreakdown = useMemo(() => {
    const yearTx = transactions.filter(
      (t) => t.type === "expense" && new Date(t.date).getFullYear() === Number(selectedYear)
    );
    return EXPENSE_CATEGORIES.map((cat) => ({
      ...cat,
      total: yearTx.filter((t) => t.category === cat.name).reduce((s, t) => s + t.amount, 0),
    }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [transactions, selectedYear]);

  const topIncomeSource = useMemo(() => {
    const yearTx = transactions.filter(
      (t) => t.type === "income" && new Date(t.date).getFullYear() === Number(selectedYear)
    );
    return INCOME_CATEGORIES.map((cat) => ({
      ...cat,
      total: yearTx.filter((t) => t.category === cat.name).reduce((s, t) => s + t.amount, 0),
    }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [transactions, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Detailed financial analysis</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Year summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Income", value: yearlyTotals.income, cls: "text-income" },
          { label: "Total Expenses", value: yearlyTotals.expense, cls: "text-expense" },
          { label: "Net Savings", value: yearlyTotals.savings, cls: yearlyTotals.savings >= 0 ? "text-income" : "text-expense" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 text-center"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className={`mt-1 font-heading text-xl font-bold ${item.cls}`}>
              {formatCurrency(item.value)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="glass-card p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold">Monthly Income vs Expenses — {selectedYear}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={({ payload, label }) => {
              if (!payload?.length) return null;
              return (
                <div className="glass-card p-3 text-xs space-y-1">
                  <p className="font-heading font-semibold">{label}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey as string}>
                      <span className="capitalize">{p.dataKey as string}: </span>
                      <span className="font-semibold">{formatCurrency(p.value as number)}</span>
                    </p>
                  ))}
                </div>
              );
            }} />
            <Bar dataKey="income" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="hsl(0, 72%, 58%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings trend */}
      <div className="glass-card p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold">Savings Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={({ payload, label }) => {
              if (!payload?.length) return null;
              return (
                <div className="glass-card p-3 text-xs">
                  <p className="font-heading font-semibold">{label}</p>
                  <p>Savings: <span className="font-semibold">{formatCurrency(payload[0].value as number)}</span></p>
                </div>
              );
            }} />
            <Line type="monotone" dataKey="savings" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: "hsl(217, 91%, 60%)", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">Expense Categories</h2>
          <div className="space-y-3">
            {categoryBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No expenses recorded</p>
            )}
            {categoryBreakdown.map((c) => {
              const pct = yearlyTotals.expense > 0 ? (c.total / yearlyTotals.expense) * 100 : 0;
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{c.icon} {c.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(c.total)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold">Income Sources</h2>
          <div className="space-y-3">
            {topIncomeSource.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No income recorded</p>
            )}
            {topIncomeSource.map((c) => {
              const pct = yearlyTotals.income > 0 ? (c.total / yearlyTotals.income) * 100 : 0;
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{c.icon} {c.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(c.total)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
