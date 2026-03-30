import { useMemo } from "react";
import { Transaction, formatCurrency, formatDate, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { formatNepaliDateFromISO } from "@/lib/nepali-date";
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

  const colSpan = showNepaliDates ? 6 : 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* White paper container */}
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden" style={{ minHeight: "800px" }}>
        
        {/* Paper Header */}
        <div className="border-b-2 border-gray-200 px-10 py-8">
          <div className="flex items-center justify-center gap-3 mb-1">
            <FileText className="h-7 w-7 text-blue-600" />
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Financial Report</h2>
          </div>
          <p className="text-center text-sm text-gray-500 mt-1">{periodLabel}</p>

          {/* Summary strip */}
          <div className="mt-6 grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Income</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center border-l border-r border-gray-200">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Expenses</p>
              <p className="mt-1 text-lg font-bold text-rose-600">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Net Balance</p>
              <p className={`mt-1 text-lg font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Income Section */}
        <div className="px-10 py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Income</h3>
            <span className="text-xs text-gray-400 ml-1">({income.length} entries)</span>
            <span className="ml-auto text-base font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
          </div>

          {income.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-10">#</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  {showNepaliDates && <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nepali Date</th>}
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                  <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {income.map((t, i) => (
                  <tr key={t.id} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
                    <td className="py-2.5 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-700">{formatDate(t.date)}</td>
                    {showNepaliDates && <td className="py-2.5 px-3 text-blue-600 text-xs">{formatNepaliDateFromISO(t.date)}</td>}
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1.5">
                        <span>{getCategoryIcon(t.category, "income")}</span>
                        <span className="text-gray-700">{t.category}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{t.description}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-emerald-50/50">
                  <td colSpan={colSpan - 1} className="py-3 px-3 font-bold text-gray-700">Total Income</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">{formatCurrency(totalIncome)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="py-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
              No income recorded for this period
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-10 border-t border-gray-200" />

        {/* Expense Section */}
        <div className="px-10 py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-100">
              <ArrowDownRight className="h-4 w-4 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Expenses</h3>
            <span className="text-xs text-gray-400 ml-1">({expenses.length} entries)</span>
            <span className="ml-auto text-base font-bold text-rose-600">{formatCurrency(totalExpense)}</span>
          </div>

          {expenses.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-10">#</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  {showNepaliDates && <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nepali Date</th>}
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                  <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((t, i) => (
                  <tr key={t.id} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
                    <td className="py-2.5 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-700">{formatDate(t.date)}</td>
                    {showNepaliDates && <td className="py-2.5 px-3 text-blue-600 text-xs">{formatNepaliDateFromISO(t.date)}</td>}
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1.5">
                        <span>{getCategoryIcon(t.category, "expense")}</span>
                        <span className="text-gray-700">{t.category}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{t.description}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-600">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-rose-50/50">
                  <td colSpan={colSpan - 1} className="py-3 px-3 font-bold text-gray-700">Total Expenses</td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">{formatCurrency(totalExpense)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="py-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
              No expenses recorded for this period
            </div>
          )}
        </div>

        {/* Net Balance Footer */}
        <div className="mx-10 border-t-2 border-gray-300" />
        <div className="px-10 py-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Net Balance</p>
              <p className="text-sm text-gray-500">{periodLabel}</p>
            </div>
            <span className={`text-2xl font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
        </div>

        {/* Paper Footer */}
        <div className="px-10 py-4 border-t border-gray-200 bg-gray-50/50">
          <p className="text-xs text-gray-400 text-center">
            Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} — ExpenseIQ Financial Report
          </p>
        </div>
      </div>
    </motion.div>
  );
}
