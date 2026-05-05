import { useState, useMemo } from "react";
import { useTransactions, formatCurrency, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import RecentTransactions from "@/components/RecentTransactions";

export default function Transactions() {
  const { transactions } = useTransactions();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  const total = filtered.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} transactions · Net: {formatCurrency(total)}
          </p>
        </div>
        <AddTransactionDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_180px]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCats.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card p-4">
        {filtered.length > 0 ? (
          <RecentTransactions showDelete transactionsOverride={filtered} />
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No transactions match your filters
          </div>
        )}
      </div>
    </div>
  );
}
