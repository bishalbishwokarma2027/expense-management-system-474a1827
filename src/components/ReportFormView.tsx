import { useMemo } from "react";
import { Transaction, formatCurrency, formatDate, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { formatNepaliDateFromISO } from "@/lib/nepali-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface ReportFormViewProps {
  transactions: Transaction[];
  periodLabel: string;
  showNepaliDates: boolean;
}

function getCategoryIcon(category: string, type: string): string {
  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return cats.find((c) => c.name === category)?.icon ?? (type === "expense" ? "📦" : "💵");
}

export default function ReportFormView({ transactions, periodLabel, showNepaliDates }: ReportFormViewProps) {
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [transactions]
  );

  const income = sorted.filter((t) => t.type === "income");
  const expenses = sorted.filter((t) => t.type === "expense");
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 print:space-y-4">
      {/* Report Header */}
      <div className="glass-card p-6 text-center border-b-2 border-primary/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">Financial Report</h2>
        </div>
        <p className="text-sm text-muted-foreground">{periodLabel}</p>
        <div className="mt-4 flex justify-center gap-8 text-sm">
          <div>
            <p className="text-muted-foreground">Total Income</p>
            <p className="font-heading font-bold text-income text-lg">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="border-l border-border pl-8">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="font-heading font-bold text-expense text-lg">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="border-l border-border pl-8">
            <p className="text-muted-foreground">Net Balance</p>
            <p className={`font-heading font-bold text-lg ${netBalance >= 0 ? "text-income" : "text-expense"}`}>
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border bg-income/5">
          <ArrowUpRight className="h-4 w-4 text-income" />
          <h3 className="font-heading font-semibold text-foreground">Income ({income.length} entries)</h3>
          <span className="ml-auto font-heading font-bold text-income">{formatCurrency(totalIncome)}</span>
        </div>
        {income.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Date</TableHead>
                {showNepaliDates && <TableHead>Nepali Date</TableHead>}
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {income.map((t, i) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{formatDate(t.date)}</TableCell>
                  {showNepaliDates && <TableCell className="text-primary text-xs">{formatNepaliDateFromISO(t.date)}</TableCell>}
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <span>{getCategoryIcon(t.category, "income")}</span>
                      {t.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.description}</TableCell>
                  <TableCell className="text-right font-heading font-semibold text-income">{formatCurrency(t.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={showNepaliDates ? 5 : 4} className="font-semibold">Total Income</TableCell>
                <TableCell className="text-right font-heading font-bold text-income">{formatCurrency(totalIncome)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No income recorded</p>
        )}
      </div>

      {/* Expense Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border bg-expense/5">
          <ArrowDownRight className="h-4 w-4 text-expense" />
          <h3 className="font-heading font-semibold text-foreground">Expenses ({expenses.length} entries)</h3>
          <span className="ml-auto font-heading font-bold text-expense">{formatCurrency(totalExpense)}</span>
        </div>
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Date</TableHead>
                {showNepaliDates && <TableHead>Nepali Date</TableHead>}
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((t, i) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{formatDate(t.date)}</TableCell>
                  {showNepaliDates && <TableCell className="text-primary text-xs">{formatNepaliDateFromISO(t.date)}</TableCell>}
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <span>{getCategoryIcon(t.category, "expense")}</span>
                      {t.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.description}</TableCell>
                  <TableCell className="text-right font-heading font-semibold text-expense">{formatCurrency(t.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={showNepaliDates ? 5 : 4} className="font-semibold">Total Expenses</TableCell>
                <TableCell className="text-right font-heading font-bold text-expense">{formatCurrency(totalExpense)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">No expenses recorded</p>
        )}
      </div>

      {/* Net Summary Footer */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <span className="font-heading font-semibold text-foreground">Net Balance for {periodLabel}</span>
          <span className={`font-heading text-xl font-bold ${netBalance >= 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(netBalance)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
