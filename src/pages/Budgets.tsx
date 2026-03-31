import { useState } from "react";
import { useTransactions, useBudgets, formatCurrency, getMonthKey, EXPENSE_CATEGORIES } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Target, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Budgets() {
  const { transactions } = useTransactions();
  const { budgets, setBudget, deleteBudget } = useBudgets();
  const currentMonth = getMonthKey(new Date());
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const categoryData = EXPENSE_CATEGORIES.map((cat) => {
    const spent = transactions
      .filter((t) => t.type === "expense" && t.category === cat.name && getMonthKey(t.date) === currentMonth)
      .reduce((s, t) => s + t.amount, 0);
    const budget = budgets.find((b) => b.category === cat.name && b.month === currentMonth);
    const limit = budget?.limit || 0;
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return { ...cat, spent, limit, pct };
  });

  const totalBudget = categoryData.reduce((s, c) => s + c.limit, 0);
  const totalSpent = categoryData.reduce((s, c) => s + c.spent, 0);

  const handleSave = (catName: string) => {
    const val = parseFloat(editValue);
    if (val > 0) {
      setBudget(catName, val, currentMonth);
      toast.success(`Budget set for ${catName}`);
    }
    setEditingCat(null);
    setEditValue("");
  };

  const handleDelete = async (catName: string) => {
    await deleteBudget(catName, currentMonth);
    toast.success(`Budget removed for ${catName}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} — Set spending limits per category
        </p>
      </div>

      {/* Overall */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-semibold">Overall Budget</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              totalBudget > 0 && totalSpent / totalBudget > 0.9 ? "bg-expense" :
              totalBudget > 0 && totalSpent / totalBudget > 0.7 ? "bg-warning" : "bg-primary"
            )}
            style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Per-category */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categoryData.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{cat.icon} {cat.name}</span>
              <div className="flex items-center gap-1">
                {cat.limit > 0 && (
                  <>
                    {cat.pct > 90 ? (
                      <AlertTriangle className="h-4 w-4 text-expense" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-income" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingCat(cat.name);
                        setEditValue(String(cat.limit));
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-expense"
                      onClick={() => handleDelete(cat.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {cat.limit > 0 && (
              <>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatCurrency(cat.spent)} spent</span>
                  <span>{formatCurrency(cat.limit)} limit</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      cat.pct > 90 ? "bg-expense" : cat.pct > 70 ? "bg-warning" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(cat.pct, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cat.limit - cat.spent > 0
                    ? `${formatCurrency(cat.limit - cat.spent)} remaining`
                    : `Over by ${formatCurrency(cat.spent - cat.limit)}`}
                </p>
              </>
            )}

            {editingCat === cat.name ? (
              <div className="mt-2 flex gap-2">
                <Input
                  type="number"
                  placeholder="Budget limit"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button size="sm" className="h-8" onClick={() => handleSave(cat.name)}>Save</Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => { setEditingCat(null); setEditValue(""); }}>Cancel</Button>
              </div>
            ) : (
              !cat.limit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    setEditingCat(cat.name);
                    setEditValue("");
                  }}
                >
                  Set Budget
                </Button>
              )
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
