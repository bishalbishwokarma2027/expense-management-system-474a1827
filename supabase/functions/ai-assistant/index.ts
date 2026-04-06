import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ALL transactions (handle pagination for >1000 rows)
    let allTransactions: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error || !data || data.length === 0) break;
      allTransactions = allTransactions.concat(data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    const { data: budgets } = await supabase.from("budgets").select("*");

    // Pre-compute summaries for the AI
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // Monthly aggregation
    const monthlyData: Record<string, { income: number; expense: number; byCategory: Record<string, number> }> = {};
    for (const t of allTransactions) {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0, byCategory: {} };
      const amt = Number(t.amount);
      if (t.type === "income") {
        monthlyData[month].income += amt;
      } else {
        monthlyData[month].expense += amt;
        monthlyData[month].byCategory[t.category] = (monthlyData[month].byCategory[t.category] || 0) + amt;
      }
    }

    // Current month summary
    const cm = monthlyData[currentMonth] || { income: 0, expense: 0, byCategory: {} };
    const categoryBreakdown = Object.entries(cm.byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt]) => `  - ${cat}: Rs.${amt.toLocaleString("en-IN")}`)
      .join("\n");

    // Overall totals
    let totalIncome = 0, totalExpense = 0;
    for (const t of allTransactions) {
      if (t.type === "income") totalIncome += Number(t.amount);
      else totalExpense += Number(t.amount);
    }

    // Monthly trend (last 6 months)
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
    const monthlyTrend = sortedMonths.map(m => {
      const d = monthlyData[m];
      return `  ${m}: Income Rs.${d.income.toLocaleString("en-IN")} | Expense Rs.${d.expense.toLocaleString("en-IN")} | Net Rs.${(d.income - d.expense).toLocaleString("en-IN")}`;
    }).join("\n");

    // Recent transactions (last 30)
    const recentTx = allTransactions.slice(0, 30).map(t =>
      `${t.date.substring(0, 10)} | ${t.type} | ${t.category} | Rs.${Number(t.amount).toLocaleString("en-IN")} | ${t.description}`
    ).join("\n");

    const budgetSummary = budgets?.map(b => {
      const spent = monthlyData[b.month]?.byCategory[b.category] || 0;
      return `${b.month} | ${b.category} | Limit: Rs.${Number(b.limit).toLocaleString("en-IN")} | Spent: Rs.${spent.toLocaleString("en-IN")} | ${spent > Number(b.limit) ? "⚠️ OVER BUDGET" : "OK"}`;
    }).join("\n") || "No budgets set.";

    const systemPrompt = `You are ExpenseIQ AI Assistant — a smart, accurate financial assistant. You help analyze spending data and manage transactions.

## CRITICAL RULES FOR ACCURACY:
- ALWAYS use the pre-computed summaries below for totals. DO NOT try to add up numbers from the transaction list yourself.
- When asked "how much did I spend", use the EXACT numbers from the summaries.
- Currency is Nepali Rupees (Rs. / NPR). Format amounts with Indian-style commas (e.g., Rs.1,50,000).

## Pre-Computed Data (USE THESE FOR ANSWERS):

### Today: ${todayStr}
### Current Month: ${currentMonth}

### Current Month (${currentMonth}) Summary:
- Total Income: Rs.${cm.income.toLocaleString("en-IN")}
- Total Expense: Rs.${cm.expense.toLocaleString("en-IN")}
- Net Balance: Rs.${(cm.income - cm.expense).toLocaleString("en-IN")}
- Expense by Category:
${categoryBreakdown || "  No expenses yet"}

### All-Time Totals:
- Total Income: Rs.${totalIncome.toLocaleString("en-IN")}
- Total Expense: Rs.${totalExpense.toLocaleString("en-IN")}
- Net Balance: Rs.${(totalIncome - totalExpense).toLocaleString("en-IN")}
- Total Transactions: ${allTransactions.length}

### Monthly Trend (Last 6 months):
${monthlyTrend || "  No data"}

### Budgets Status:
${budgetSummary}

### Recent 30 Transactions:
${recentTx || "No transactions yet."}

## When Adding Transactions:
- ALWAYS use the add_transaction tool. Never just say you added it.
- For "today", use ${todayStr}. For "yesterday", use ${new Date(today.getTime() - 86400000).toISOString().split("T")[0]}.
- Expense categories: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Rent & Housing, Insurance, Subscriptions, Other
- Income categories: Salary, Freelance, Investment, Business, Rental Income, Other

## Response Style:
- Be concise. Use markdown tables for comparisons.
- For spending questions, show the number prominently and add brief context.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "add_transaction",
          description: "Add a new transaction (income or expense) to the database",
          parameters: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["income", "expense"], description: "Transaction type" },
              amount: { type: "number", description: "Amount in NPR" },
              category: { type: "string", description: "Category name" },
              description: { type: "string", description: "Short description" },
              date: { type: "string", description: "Date in YYYY-MM-DD format" },
            },
            required: ["type", "amount", "category", "date"],
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const choice = aiData.choices?.[0];

    // Handle tool calls
    if (choice?.message?.tool_calls?.length) {
      const results: string[] = [];
      for (const tc of choice.message.tool_calls) {
        if (tc.function.name === "add_transaction") {
          const args = JSON.parse(tc.function.arguments);
          const { error } = await supabase.from("transactions").insert({
            type: args.type,
            amount: args.amount,
            category: args.category,
            description: args.description || args.category,
            date: args.date,
          });
          if (error) {
            results.push(`Failed to add transaction: ${error.message}`);
          } else {
            results.push(`✅ Added ${args.type}: Rs.${Number(args.amount).toLocaleString("en-IN")} for ${args.category} on ${args.date}`);
          }
        }
      }

      const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            choice.message,
            ...choice.message.tool_calls.map((tc: any, i: number) => ({
              role: "tool",
              tool_call_id: tc.id,
              content: results[i],
            })),
          ],
          stream: false,
        }),
      });

      if (followUp.ok) {
        const followUpData = await followUp.json();
        const content = followUpData.choices?.[0]?.message?.content || results.join("\n");
        return new Response(JSON.stringify({ content, toolResults: results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ content: results.join("\n"), toolResults: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content: choice?.message?.content || "No response" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
