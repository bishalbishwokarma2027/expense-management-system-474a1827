import { useMemo } from "react";
import { Transaction, formatCurrency, formatDate, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/store";
import { formatNepaliDateFromISO } from "@/lib/nepali-date";
import { ArrowDownRight, ArrowUpRight, FileText, GripHorizontal, Bus } from "lucide-react";
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
  const transportExpenses = sorted.filter(
    (t) => t.type === "expense" && t.category === "Transportation" && t.description.startsWith("Daily Transport")
  );
  const otherExpenses = expenses.filter(
    (t) => !(t.category === "Transportation" && t.description.startsWith("Daily Transport"))
  );
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalTransport = transportExpenses.reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const colSpan = showNepaliDates ? 6 : 5;

  const renderRow = (t: Transaction, i: number, type: "income" | "expense") => (
    <tr key={t.id} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
      <td className="py-1.5 px-2 text-gray-400 text-xs">{i + 1}</td>
      <td className="py-1.5 px-2 text-gray-800 text-xs font-medium whitespace-nowrap">{formatDate(t.date)}</td>
      {showNepaliDates && <td className="py-1.5 px-2 text-blue-700 text-xs whitespace-nowrap">{formatNepaliDateFromISO(t.date)}</td>}
      <td className="py-1.5 px-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="text-sm">{getCategoryIcon(t.category, type)}</span>
          <span className="text-gray-800 font-medium">{t.category}</span>
        </span>
      </td>
      <td className="py-1.5 px-2 text-gray-600 text-xs">{t.description}</td>
      <td className={`py-1.5 px-2 text-right text-xs font-bold whitespace-nowrap ${type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
        {formatCurrency(t.amount)}
      </td>
    </tr>
  );

  const thClass = "py-2 px-2 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      drag
      dragMomentum={false}
      className="max-w-5xl mx-auto cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden">

        {/* Drag handle indicator */}
        <div className="flex items-center justify-center gap-2 py-1.5 bg-gray-100 select-none border-b border-gray-200">
          <GripHorizontal className="h-4 w-4 text-gray-400" />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Drag to move</span>
        </div>

        {/* Header */}
        <div className="border-b-2 border-gray-300 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Financial Report</h2>
              <p className="text-xs text-gray-500">{periodLabel}</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Income</p>
              <p className="text-base font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="border-l border-gray-200 pl-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expenses</p>
              <p className="text-base font-bold text-rose-700">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="border-l border-gray-200 pl-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Transport</p>
              <p className="text-base font-bold text-amber-700">{formatCurrency(totalTransport)}</p>
            </div>
            <div className="border-l border-gray-200 pl-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Net Balance</p>
              <p className={`text-base font-bold ${netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Two-column tables */}
        <div className="grid grid-cols-2 divide-x divide-gray-200" style={{ maxHeight: "calc(100vh - 360px)", overflow: "auto" }}>
          
          {/* Income */}
          <div>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-emerald-50/60 sticky top-0 z-10">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-700" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Income</h3>
              <span className="text-[11px] text-gray-500">({income.length})</span>
              <span className="ml-auto text-sm font-bold text-emerald-700">{formatCurrency(totalIncome)}</span>
            </div>
            {income.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="sticky top-[41px] z-10 bg-white">
                  <tr className="border-b-2 border-gray-200">
                    <th className={`${thClass} w-8`}>#</th>
                    <th className={thClass}>Date</th>
                    {showNepaliDates && <th className={thClass}>BS Date</th>}
                    <th className={thClass}>Category</th>
                    <th className={thClass}>Description</th>
                    <th className={`${thClass} text-right`}>Amount</th>
                  </tr>
                </thead>
                <tbody>{income.map((t, i) => renderRow(t, i, "income"))}</tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-emerald-50/60">
                    <td colSpan={colSpan - 1} className="py-2 px-2 text-xs font-bold text-gray-800">Total Income</td>
                    <td className="py-2 px-2 text-right text-xs font-bold text-emerald-700">{formatCurrency(totalIncome)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="flex items-center justify-center text-gray-400 text-sm py-12">No income recorded</div>
            )}
          </div>

          {/* Expenses (non-transport) */}
          <div>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-rose-50/60 sticky top-0 z-10">
              <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-700" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Expenses</h3>
              <span className="text-[11px] text-gray-500">({otherExpenses.length})</span>
              <span className="ml-auto text-sm font-bold text-rose-700">{formatCurrency(otherExpenses.reduce((s, t) => s + t.amount, 0))}</span>
            </div>
            {otherExpenses.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="sticky top-[41px] z-10 bg-white">
                  <tr className="border-b-2 border-gray-200">
                    <th className={`${thClass} w-8`}>#</th>
                    <th className={thClass}>Date</th>
                    {showNepaliDates && <th className={thClass}>BS Date</th>}
                    <th className={thClass}>Category</th>
                    <th className={thClass}>Description</th>
                    <th className={`${thClass} text-right`}>Amount</th>
                  </tr>
                </thead>
                <tbody>{otherExpenses.map((t, i) => renderRow(t, i, "expense"))}</tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-rose-50/60">
                    <td colSpan={colSpan - 1} className="py-2 px-2 text-xs font-bold text-gray-800">Total Expenses</td>
                    <td className="py-2 px-2 text-right text-xs font-bold text-rose-700">{formatCurrency(otherExpenses.reduce((s, t) => s + t.amount, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="flex items-center justify-center text-gray-400 text-sm py-12">No expenses recorded</div>
            )}
          </div>
        </div>

        {/* Transportation Daily Breakdown */}
        {transportExpenses.length > 0 && (
          <div className="border-t-2 border-gray-300">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/60 border-b border-gray-200">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <Bus className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Daily Transportation</h3>
              <span className="text-[11px] text-gray-500">({transportExpenses.length} days)</span>
              <span className="ml-auto text-sm font-bold text-amber-700">{formatCurrency(totalTransport)}</span>
            </div>
            <div className="px-4 py-3" style={{ maxHeight: "200px", overflow: "auto" }}>
              <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-1.5">
                {transportExpenses
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((t) => {
                    const day = new Date(t.date).getDate();
                    return (
                      <div key={t.id} className="text-center p-1.5 rounded bg-amber-50 border border-amber-200">
                        <p className="text-[10px] text-gray-500 font-medium">Day {day}</p>
                        <p className="text-xs font-bold text-amber-800">{formatCurrency(t.amount)}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-3 border-t-2 border-gray-300 bg-gray-50 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} — ExpenseIQ
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700">Net Balance:</span>
            <span className={`text-lg font-bold ${netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
