import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions, formatCurrency } from "@/lib/store";
import { adToBS } from "@/lib/nepali-date";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TrackExpense() {
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Previous month net balance (carry-forward)
  const prevMonthBalance = useMemo(() => {
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    const prevTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === py && d.getMonth() === pm;
    });
    const net = prevTx.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    return net > 0 ? net : 0;
  }, [transactions, year, month]);

  // Group transactions by day & compute running balance
  const { txByDay, balanceByDay } = useMemo(() => {
    const map = new Map<number, typeof transactions>();
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(t);
      }
    });

    // Compute running balance per day
    const balMap = new Map<number, number>();
    let running = prevMonthBalance;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayTx = map.get(d) || [];
      const dayIncome = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const dayExpense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      // Balance at start of this day (before this day's transactions)
      balMap.set(d, running);
      running = running + dayIncome - dayExpense;
    }
    return { txByDay: map, balanceByDay: balMap };
  }, [transactions, year, month, daysInMonth, prevMonthBalance]);

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goToNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  const yearOptions = Array.from({ length: 20 }, (_, i) => now.getFullYear() - 10 + i);

  const handleDayDoubleClick = (day: number) => {
    navigate(`/track-expense/${year}/${month}/${day}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Track Your Expense
          </h1>
          <p className="text-sm text-muted-foreground">
            Double-click any day to view detailed report
          </p>
        </div>
      </div>

      {/* Month/Year Navigation */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="text-xl font-heading font-bold text-foreground hover:text-primary transition-colors"
            >
              {MONTHS[month]} {year}
            </button>
            <span className="text-sm text-primary font-medium">
              ({(() => {
                const bs = adToBS(new Date(year, month, 15));
                return `${bs.monthName} ${bs.year}`;
              })()})
            </span>
          </div>

          <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Year/Month quick picker */}
        <AnimatePresence>
          {showYearPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="grid grid-cols-6 gap-2 mb-3">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => { setMonth(i); setShowYearPicker(false); }}
                    className={`text-xs py-2 rounded-lg font-medium transition-colors ${
                      i === month
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-foreground hover:bg-primary/20"
                    }`}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {yearOptions.map((y) => (
                  <button
                    key={y}
                    onClick={() => { setYear(y); setShowYearPicker(false); }}
                    className={`text-xs py-1.5 rounded-md font-medium transition-colors ${
                      y === year
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-foreground hover:bg-primary/20"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className={`text-center text-xs font-bold uppercase tracking-wider py-2 ${
              d === "Sat" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayTx = txByDay.get(day) || [];
            const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const expense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            const dayOfWeek = new Date(year, month, day).getDay();
            const isSat = dayOfWeek === 6;
            const today = isToday(day);
            const balance = balanceByDay.get(day) || 0;

            // Nepali date
            const bs = adToBS(new Date(year, month, day));
            const nepaliLabel = `${bs.day} ${bs.monthName.slice(0, 3)}`;

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onDoubleClick={() => handleDayDoubleClick(day)}
                className={`relative rounded-lg border transition-all text-left p-1.5 min-h-[90px] flex flex-col ${
                  today
                    ? "border-primary/50 bg-primary/5"
                    : isSat
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border hover:border-primary/30 hover:bg-accent/50"
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-heading font-bold ${
                    today ? "text-primary" : isSat ? "text-destructive" : "text-foreground"
                  }`}>
                    {day}
                  </span>
                  <span className="text-[8px] text-primary/70 leading-tight font-medium">
                    {nepaliLabel}
                  </span>
                </div>

                {/* Balance from previous day */}
                {balance > 0 && (
                  <div className="text-[9px] font-medium text-blue-500 truncate mt-0.5">
                    Bal: {formatCurrency(balance)}
                  </div>
                )}

                {dayTx.length > 0 && (
                  <div className="mt-auto space-y-0.5">
                    {income > 0 && (
                      <div className="text-[10px] font-medium text-income truncate">
                        +{formatCurrency(income)}
                      </div>
                    )}
                    {expense > 0 && (
                      <div className="text-[10px] font-medium text-expense truncate">
                        -{formatCurrency(expense)}
                      </div>
                    )}
                  </div>
                )}

                {dayTx.length > 0 && (
                  <div className="absolute top-1.5 right-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                      {dayTx.length}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Monthly summary */}
        <div className="mt-4 flex items-center justify-center gap-6 pt-3 border-t border-border">
          {prevMonthBalance > 0 && (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prev Balance</p>
              <p className="text-sm font-heading font-bold text-blue-500">
                {formatCurrency(prevMonthBalance)}
              </p>
            </div>
          )}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Income</p>
            <p className="text-sm font-heading font-bold text-income">
              {formatCurrency(
                transactions
                  .filter((t) => {
                    const d = new Date(t.date);
                    return d.getFullYear() === year && d.getMonth() === month && t.type === "income";
                  })
                  .reduce((s, t) => s + t.amount, 0)
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Expense</p>
            <p className="text-sm font-heading font-bold text-expense">
              {formatCurrency(
                transactions
                  .filter((t) => {
                    const d = new Date(t.date);
                    return d.getFullYear() === year && d.getMonth() === month && t.type === "expense";
                  })
                  .reduce((s, t) => s + t.amount, 0)
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transactions</p>
            <p className="text-sm font-heading font-bold text-foreground">
              {transactions.filter((t) => {
                const d = new Date(t.date);
                return d.getFullYear() === year && d.getMonth() === month;
              }).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
