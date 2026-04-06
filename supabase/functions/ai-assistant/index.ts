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

    // Fetch all transactions for context
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(500);

    const { data: budgets } = await supabase
      .from("budgets")
      .select("*");

    const txSummary = transactions?.map(t => 
      `${t.date} | ${t.type} | ${t.category} | Rs.${t.amount} | ${t.description}`
    ).join("\n") || "No transactions yet.";

    const budgetSummary = budgets?.map(b =>
      `${b.month} | ${b.category} | Limit: Rs.${b.limit}`
    ).join("\n") || "No budgets set.";

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are ExpenseIQ AI Assistant — a smart financial assistant for a personal expense tracker app. You help the user manage their finances.

## Your Capabilities:
1. **Analyze spending**: Summarize expenses by category, month, trends, etc.
2. **Answer questions**: About transactions, budgets, balances, and financial habits.
3. **Add transactions**: When the user says something like "I spent 500 on food today" or "add income 50000 salary", extract the details and use the add_transaction tool.
4. **Provide insights**: Spending patterns, budget alerts, saving tips based on their data.

## Current Data:
Today's date: ${today}

### Recent Transactions (up to 500):
${txSummary}

### Budgets:
${budgetSummary}

## Rules:
- Currency is Nepali Rupees (Rs. / NPR). Format amounts with commas Indian-style.
- When adding a transaction, ALWAYS use the add_transaction tool. Don't just say you added it.
- For dates, if the user says "today", use ${today}. If "yesterday", calculate accordingly.
- Be concise but helpful. Use markdown formatting.
- Expense categories: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Rent & Housing, Insurance, Subscriptions, Other
- Income categories: Salary, Freelance, Investment, Business, Rental Income, Other`;

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
            results.push(`✅ Added ${args.type}: Rs.${args.amount} for ${args.category} on ${args.date}`);
          }
        }
      }

      // Second call to get natural language response after tool execution
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
