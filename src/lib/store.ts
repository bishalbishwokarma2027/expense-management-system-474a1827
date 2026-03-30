import { useState, useEffect, useCallback } from "react";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string; // YYYY-MM
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

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Custom event for cross-component reactivity
const STORAGE_EVENT = "expense-tracker-update";

function emitUpdate() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage("transactions", [])
  );

  useEffect(() => {
    const handler = () => {
      setTransactions(loadFromStorage("transactions", []));
    };
    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, "id" | "createdAt">) => {
    const newT: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newT, ...loadFromStorage<Transaction[]>("transactions", [])];
    saveToStorage("transactions", updated);
    setTransactions(updated);
    emitUpdate();
    return newT;
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    const updated = loadFromStorage<Transaction[]>("transactions", []).filter(
      (t) => t.id !== id
    );
    saveToStorage("transactions", updated);
    setTransactions(updated);
    emitUpdate();
  }, []);

  return { transactions, addTransaction, deleteTransaction };
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>(() =>
    loadFromStorage("budgets", [])
  );

  useEffect(() => {
    const handler = () => setBudgets(loadFromStorage("budgets", []));
    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  }, []);

  const setBudget = useCallback((category: string, limit: number, month: string) => {
    const current = loadFromStorage<Budget[]>("budgets", []);
    const existing = current.findIndex(
      (b) => b.category === category && b.month === month
    );
    let updated: Budget[];
    if (existing >= 0) {
      updated = [...current];
      updated[existing] = { ...updated[existing], limit };
    } else {
      updated = [...current, { id: crypto.randomUUID(), category, limit, month }];
    }
    saveToStorage("budgets", updated);
    setBudgets(updated);
    emitUpdate();
  }, []);

  return { budgets, setBudget };
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
