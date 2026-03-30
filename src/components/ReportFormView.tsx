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

  const renderRow = (t: Transaction, i: number, type: "income" | "expense") => (
    <tr key={t.id} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
      <td className="py-1 px-2 text-gray-400 text-[11px]">{i + 1}</td>
      <td className="py-1 px-2 text-gray-700 text-[11px]">{formatDate(t.date)}</td>
      {showNepaliDates && <td className="py-1 px-2 text-blue-600 text-[10px]">{formatNepaliDateFromISO(t.date)}</td>}
      <td className="py-1 px-2 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="text-xs">{getCategoryIcon(t.category, type)}</span>
          <span className="text-gray-700 truncate max-w-[100px]">{t.category}</span>
        </span>
      </td>
      <td className="py-1 px-2 text-gray-500 text-[11px] truncate max-w-[120px]">{t.description}</td>
      <td className={`py-1 px-2 text-right text-[11px] font-semibold ${type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
        {formatCurrency(t.amount)}
      </td>
    </tr>
  );

  const thClass = "py-1.5 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden">

        {/* Compact Header */}
        <div className="border-b-2 border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Financial Report</h2>
              <p className="text-[11px] text-gray-500">{periodLabel}</p>
            </div>
          </div>
          <div className="flex gap-5 text-center">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Income</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="border-l border-gray-200 pl-5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Expenses</p>
              <p className="text-sm font-bold text-rose-600">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="border-l border-gray-200 pl-5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Net</p>
              <p className={`text-sm font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout for Income & Expenses side by side */}
        <div className="grid grid-cols-2 divide-x divide-gray-200" style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto" }}>
          
          {/* Income Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 bg-emerald-50/50 sticky top-0 z-10">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-800">Income</h3>
              <span className="text-[10px] text-gray-400">({income.length})</span>
              <span className="ml-auto text-xs font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
            </div>
            {income.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="sticky top-[33px] z-10 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className={`${thClass} w-6`}>#</th>
                    <th className={thClass}>Date</th>
                    {showNepaliDates && <th className={thClass}>BS Date</th>}
                    <th className={thClass}>Category</th>
                    <th className={thClass}>Desc</th>
                    <th className={`${thClass} text-right`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((t, i) => renderRow(t, i, "income"))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-emerald-50/50">
                    <td colSpan={colSpan - 1} className="py-1.5 px-2 text-[11px] font-bold text-gray-700">Total</td>
                    <td className="py-1.5 px-2 text-right text-[11px] font-bold text-emerald-600">{formatCurrency(totalIncome)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs py-8">No income recorded</div>
            )}
          </div>

          {/* Expense Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 bg-rose-50/50 sticky top-0 z-10">
              <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                <ArrowDownRight className="h-3 w-3 text-rose-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-800">Expenses</h3>
              <span className="text-[10px] text-gray-400">({expenses.length})</span>
              <span className="ml-auto text-xs font-bold text-rose-600">{formatCurrency(totalExpense)}</span>
            </div>
            {expenses.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="sticky top-[33px] z-10 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className={`${thClass} w-6`}>#</th>
                    <th className={thClass}>Date</th>
                    {showNepaliDates && <th className={thClass}>BS Date</th>}
                    <th className={thClass}>Category</th>
                    <th className={thClass}>Desc</th>
                    <th className={`${thClass} text-right`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((t, i) => renderRow(t, i, "expense"))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-rose-50/50">
                    <td colSpan={colSpan - 1} className="py-1.5 px-2 text-[11px] font-bold text-gray-700">Total</td>
                    <td className="py-1.5 px-2 text-right text-[11px] font-bold text-rose-600">{formatCurrency(totalExpense)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs py-8">No expenses recorded</div>
            )}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-6 py-2 border-t-2 border-gray-300 bg-gray-50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ExpenseIQ
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Net Balance:</span>
            <span className={`text-base font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
