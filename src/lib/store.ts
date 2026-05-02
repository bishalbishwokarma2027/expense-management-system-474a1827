import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
}

export const EXPENSE_CATEGORIES = [
  { name: "Food & Dining", icon: "🍔", color: "hsl(0, 72%, 58%)" },
  { name: "Transportation", icon: "🚗", color: "hsl(38, 92%, 50%)" },
  { name: "Shopping", icon: "🛍️", color: "hsl(280, 65%, 60%)" },
  { name: "Entertainment", icon: "🎬", color: "hsl(217, 91%, 60%)" },
  { name: "Bills & Utilities", icon: "💡", color: "hsl(190, 80%, 45%)" },
  { name: "Healthcare", icon: "🏥", color: "hsl(160, 84%, 39%)" },
  { name: "Education", icon: "📚", color: "hsl(340, 75%, 55%)" },
  { name: "Travel", icon: "✈️", color: "hsl(45, 90%, 50%)" },
  { name: "Rent & Housing", icon: "🏠", color: "hsl(20, 70%, 50%)" },
  { name: "Insurance", icon: "🛡️", color: "hsl(200, 60%, 50%)" },
  { name: "Subscriptions", icon: "📱", color: "hsl(260, 60%, 55%)" },
  { name: "Other", icon: "📦", color: "hsl(0, 0%, 50%)" },
];

export const INCOME_CATEGORIES = [
  { name: "Salary", icon: "💰", color: "hsl(160, 84%, 39%)" },
  { name: "Freelance", icon: "💻", color: "hsl(217, 91%, 60%)" },
  { name: "Investment", icon: "📈", color: "hsl(38, 92%, 50%)" },
  { name: "Business", icon: "🏢", color: "hsl(280, 65%, 60%)" },
  { name: "Rental Income", icon: "🏠", color: "hsl(190, 80%, 45%)" },
  { name: "Other", icon: "💵", color: "hsl(0, 0%, 50%)" },
];

const STORAGE_EVENT = "expense-tracker-update";

function emitUpdate() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

function mapRow(row: { id: string; type: string; amount: number; category: string; description: string; date: string; created_at: string }): Transaction {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    category: row.category,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
  };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTransactions(data.map(mapRow));
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
    const handler = () => fetchTransactions();
    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (t: Omit<Transaction, "id" | "createdAt">) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description || t.category,
        date: t.date,
        user_id: user.id,
      })
      .select()
      .single();
    if (!error && data) {
      emitUpdate();
      return mapRow(data);
    }
    return null;
  }, [user]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => {
    const dbUpdates: { type?: string; amount?: number; category?: string; description?: string; date?: string } = {};
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    await supabase.from("transactions").update(dbUpdates).eq("id", id);
    emitUpdate();
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    emitUpdate();
  }, []);

  return { transactions, addTransaction, updateTransaction, deleteTransaction };
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const { user } = useAuth();

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setBudgets(
        data.map((row) => ({
          id: row.id,
          category: row.category,
          limit: Number(row.limit),
          month: row.month,
        }))
      );
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
    const handler = () => fetchBudgets();
    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  }, [fetchBudgets]);

  const setBudget = useCallback(async (category: string, limit: number, month: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("budgets")
      .select("id")
      .eq("category", category)
      .eq("month", month)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("budgets").update({ limit }).eq("id", existing.id);
    } else {
      await supabase.from("budgets").insert({ category, limit, month, user_id: user.id });
    }
    emitUpdate();
  }, [user]);

  const deleteBudget = useCallback(async (category: string, month: string) => {
    if (!user) return;
    await supabase.from("budgets").delete().eq("category", category).eq("month", month).eq("user_id", user.id);
    emitUpdate();
  }, [user]);

  return { budgets, setBudget, deleteBudget };
}

// Helper functions
export function getMonthKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}
