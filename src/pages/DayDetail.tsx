import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTransactions, formatCurrency } from "@/lib/store";
import { formatNepaliDate } from "@/lib/nepali-date";
import ReportFormView from "@/components/ReportFormView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import { useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DayDetail() {
  const { year: yStr, month: mStr, day: dStr } = useParams();
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const [showNepaliDates, setShowNepaliDates] = useState(true);

  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);

  // Get transactions for this specific day
  const dayTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }, [transactions, year, month, day]);

  // Calculate carry-forward: sum of all income - expenses from day 1 to (day-1) of this month
  const previousDayBalance = useMemo(() => {
    // First get previous month's net balance
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
    const prevMonthNet = prevMonthTx.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    const carryForward = prevMonthNet > 0 ? prevMonthNet : 0;

    // Then add this month's days 1 to day-1
    if (day <= 1) return carryForward;

    const priorDaysTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() < day;
    });
    const priorNet = priorDaysTx.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    return carryForward + priorNet;
  }, [transactions, year, month, day]);

  const nepaliDate = formatNepaliDate(new Date(year, month, day));
  const periodLabel = `${day} ${MONTHS[month]} ${year} • ${nepaliDate}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/track-expense")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Calendar
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              📋 Daily Report — {day} {MONTHS[month]} {year}
            </h1>
            <p className="text-sm text-muted-foreground">{nepaliDate}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNepaliDates(!showNepaliDates)}
          className="gap-1.5"
        >
          <Globe className="h-3.5 w-3.5" />
          {showNepaliDates ? "Hide Nepali Dates" : "Show Nepali Dates"}
        </Button>
      </div>

      {dayTx.length > 0 ? (
        <ReportFormView
          transactions={dayTx}
          periodLabel={periodLabel}
          showNepaliDates={showNepaliDates}
          previousBalance={previousDayBalance > 0 ? previousDayBalance : 0}
          previousBalanceLabel="Prev Day Balance"
        />
      ) : (
        <div className="bg-white dark:bg-card text-foreground rounded-lg shadow-xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No transactions on this day</p>
          <p className="text-sm text-muted-foreground mt-1">{nepaliDate}</p>
          {previousDayBalance > 0 && (
            <p className="text-sm font-bold text-blue-600 mt-3">
              Available Balance: {formatCurrency(previousDayBalance)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
