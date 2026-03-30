import { motion } from "framer-motion";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useTransactions, formatCurrency, formatDate, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  limit?: number;
  showDelete?: boolean;
}

export default function RecentTransactions({ limit, showDelete = false }: Props) {
  const { transactions, deleteTransaction } = useTransactions();
  const displayed = limit ? transactions.slice(0, limit) : transactions;

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No transactions yet</p>
        <p className="text-xs mt-1">Add your first transaction to get started</p>
      </div>
    );
  }

  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="space-y-1">
      {displayed.map((t, i) => {
        const cat = allCats.find((c) => c.name === t.category);
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50 group"
          >
            <span className="text-lg">{cat?.icon || "📦"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {t.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.category} · {formatDate(t.date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-heading font-semibold",
                  t.type === "income" ? "text-income" : "text-expense"
                )}
              >
                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
              </span>
              {t.type === "income" ? (
                <TrendingUp className="h-3 w-3 text-income" />
              ) : (
                <TrendingDown className="h-3 w-3 text-expense" />
              )}
              {showDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense"
                  onClick={() => deleteTransaction(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
