import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useTransactions, EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionType } from "@/lib/store";
import { toast } from "sonner";

export default function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { addTransaction } = useTransactions();

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const finalCategory = useCustom ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error("Please select or enter a category");
      return;
    }

    await addTransaction({
      type,
      amount: numAmount,
      category: finalCategory,
      description: description.trim() || finalCategory,
      date: new Date(date).toISOString(),
    });

    toast.success(`${type === "income" ? "Income" : "Expense"} added successfully`);
    setAmount("");
    setCategory("");
    setCustomCategory("");
    setUseCustom(false);
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              className={type === "expense" ? "flex-1 bg-expense hover:bg-expense/90" : "flex-1"}
              onClick={() => { setType("expense"); setCategory(""); setUseCustom(false); }}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              className={type === "income" ? "flex-1 bg-income hover:bg-income/90" : "flex-1"}
              onClick={() => { setType("income"); setCategory(""); setUseCustom(false); }}
            >
              Income
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-heading"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category</Label>
              <button
                type="button"
                onClick={() => { setUseCustom(!useCustom); setCategory(""); setCustomCategory(""); }}
                className="text-xs text-primary hover:underline"
              >
                {useCustom ? "Choose from list" : "Type custom"}
              </button>
            </div>
            {useCustom ? (
              <Input
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                maxLength={40}
              />
            ) : (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      <span className="flex items-center gap-2">
                        {c.icon} {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Add {type === "income" ? "Income" : "Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
