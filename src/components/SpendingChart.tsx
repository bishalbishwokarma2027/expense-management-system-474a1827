import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTransactions, EXPENSE_CATEGORIES, getMonthKey, formatCurrency } from "@/lib/store";

interface Props {
  month?: string;
}

export default function SpendingChart({ month }: Props) {
  const { transactions } = useTransactions();
  const currentMonth = month || getMonthKey(new Date());

  const expenses = transactions.filter(
    (t) => t.type === "expense" && getMonthKey(t.date) === currentMonth
  );

  const byCategory = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value: total, color: cat.color, icon: cat.icon };
  }).filter((c) => c.value > 0);

  if (byCategory.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No expenses this month
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={byCategory}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {byCategory.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="glass-card p-2 text-xs">
                  <span>{d.icon} {d.name}</span>
                  <p className="font-heading font-semibold">{formatCurrency(d.value)}</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        {byCategory.slice(0, 5).map((c) => (
          <div key={c.name} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
            <span className="truncate text-muted-foreground">{c.icon} {c.name}</span>
            <span className="ml-auto font-medium text-foreground whitespace-nowrap">
              {formatCurrency(c.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
