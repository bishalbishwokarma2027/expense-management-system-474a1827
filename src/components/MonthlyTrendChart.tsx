import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTransactions, formatCurrency } from "@/lib/store";

export default function MonthlyTrendChart() {
  const { transactions } = useTransactions();

  const last6Months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    last6Months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
    });
  }

  const data = last6Months.map(({ key, label }) => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return mk === key;
    });
    return {
      month: label,
      income: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
        <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          content={({ payload, label }) => {
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
          }}
        />
        <Bar dataKey="income" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="hsl(0, 72%, 58%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
