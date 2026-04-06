import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Bikram Sambat calendar data
const BS_MONTHS = ["Baisakh","Jestha","Ashadh","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];
const BS_CALENDAR: Record<number, number[]> = {
  2000:[30,32,31,32,31,30,30,30,29,30,29,31],2001:[31,31,32,31,31,31,30,29,30,29,30,30],2002:[31,31,32,32,31,30,30,29,30,29,30,30],2003:[31,32,31,32,31,30,30,30,29,29,30,31],2004:[30,32,31,32,31,30,30,30,29,30,29,31],2005:[31,31,32,31,31,31,30,29,30,29,30,30],2006:[31,31,32,32,31,30,30,29,30,29,30,30],2007:[31,32,31,32,31,30,30,30,29,29,30,31],2008:[31,31,31,32,31,31,29,30,30,29,29,31],2009:[31,31,32,31,31,31,30,29,30,29,30,30],2010:[31,31,32,32,31,30,30,29,30,29,30,30],2011:[31,32,31,32,31,30,30,30,29,29,30,31],2012:[31,31,31,32,31,31,29,30,30,29,30,30],2013:[31,31,32,31,31,31,30,29,30,29,30,30],2014:[31,31,32,32,31,30,30,29,30,29,30,30],2015:[31,32,31,32,31,30,30,30,29,29,30,31],2016:[31,31,31,32,31,31,29,30,30,29,30,30],2017:[31,31,32,31,31,31,30,29,30,29,30,30],2018:[31,32,31,32,31,30,30,29,30,29,30,30],2019:[31,32,31,32,31,30,30,30,29,30,29,31],2020:[31,31,31,32,31,31,30,29,30,29,30,30],2021:[31,31,32,31,31,31,30,29,30,29,30,30],2022:[31,32,31,32,31,30,30,30,29,29,30,30],2023:[31,32,31,32,31,30,30,30,29,30,29,31],2024:[31,31,31,32,31,31,30,29,30,29,30,30],2025:[31,31,32,31,31,31,30,29,30,29,30,30],2026:[31,32,31,32,31,30,30,30,29,29,30,31],2027:[30,32,31,32,31,30,30,30,29,30,29,31],2028:[31,31,32,31,31,31,30,29,30,29,30,30],2029:[31,31,32,31,32,30,30,29,30,29,30,30],2030:[31,32,31,32,31,30,30,30,29,29,30,31],2031:[30,32,31,32,31,30,30,30,29,30,29,31],2032:[31,31,32,31,31,31,30,29,30,29,30,30],2033:[31,31,32,32,31,30,30,29,30,29,30,30],2034:[31,32,31,32,31,30,30,30,29,29,30,31],2035:[30,32,31,32,31,31,29,30,30,29,29,31],2036:[31,31,32,31,31,31,30,29,30,29,30,30],2037:[31,31,32,32,31,30,30,29,30,29,30,30],2038:[31,32,31,32,31,30,30,30,29,29,30,31],2039:[31,31,31,32,31,31,29,30,30,29,30,30],2040:[31,31,32,31,31,31,30,29,30,29,30,30],2041:[31,31,32,32,31,30,30,29,30,29,30,30],2042:[31,32,31,32,31,30,30,30,29,29,30,31],2043:[31,31,31,32,31,31,29,30,30,29,30,30],2044:[31,31,32,31,31,31,30,29,30,29,30,30],2045:[31,32,31,32,31,30,30,29,30,29,30,30],2046:[31,32,31,32,31,30,30,30,29,29,30,31],2047:[31,31,31,32,31,31,30,29,30,29,30,30],2048:[31,31,32,31,31,31,30,29,30,29,30,30],2049:[31,32,31,32,31,30,30,30,29,29,30,30],2050:[31,32,31,32,31,30,30,30,29,30,29,31],2051:[31,31,31,32,31,31,30,29,30,29,30,30],2052:[31,31,32,31,31,31,30,29,30,29,30,30],2053:[31,32,31,32,31,30,30,30,29,29,30,30],2054:[31,32,31,32,31,30,30,30,29,30,29,31],2055:[31,31,32,31,31,31,30,29,30,29,30,30],2056:[31,31,32,31,32,30,30,29,30,29,30,30],2057:[31,32,31,32,31,30,30,30,29,29,30,31],2058:[30,32,31,32,31,30,30,30,29,30,29,31],2059:[31,31,32,31,31,31,30,29,30,29,30,30],2060:[31,31,32,32,31,30,30,29,30,29,30,30],2061:[31,32,31,32,31,30,30,30,29,29,30,31],2062:[30,32,31,32,31,31,29,30,29,30,29,31],2063:[31,31,32,31,31,31,30,29,30,29,30,30],2064:[31,31,32,32,31,30,30,29,30,29,30,30],2065:[31,32,31,32,31,30,30,30,29,29,30,31],2066:[31,31,31,32,31,31,29,30,30,29,29,31],2067:[31,31,32,31,31,31,30,29,30,29,30,30],2068:[31,31,32,32,31,30,30,29,30,29,30,30],2069:[31,32,31,32,31,30,30,30,29,29,30,31],2070:[31,31,31,32,31,31,29,30,30,29,30,30],2071:[31,31,32,31,31,31,30,29,30,29,30,30],2072:[31,32,31,32,31,30,30,29,30,29,30,30],2073:[31,32,31,32,31,30,30,30,29,29,30,31],2074:[31,31,31,32,31,31,30,29,30,29,30,30],2075:[31,31,32,31,31,31,30,29,30,29,30,30],2076:[31,32,31,32,31,30,30,30,29,29,30,30],2077:[31,32,31,32,31,30,30,30,29,30,29,31],2078:[31,31,31,32,31,31,30,29,30,29,30,30],2079:[31,31,32,31,31,31,30,29,30,29,30,30],2080:[31,32,31,32,31,30,30,30,29,29,30,30],2081:[31,31,32,32,31,30,30,30,29,29,30,31],2082:[31,31,31,32,31,31,29,30,30,29,30,30],2083:[31,31,32,31,31,31,30,29,30,29,30,30],2084:[31,31,32,32,31,30,30,29,30,29,30,30],2085:[31,32,31,32,31,30,30,30,29,29,30,31],2086:[31,31,31,32,31,31,29,30,30,29,30,30],2087:[31,31,32,31,31,31,30,29,30,29,30,30],2088:[31,32,31,32,31,30,30,30,29,29,30,30],2089:[31,32,31,32,31,30,30,30,29,30,29,31],2090:[31,31,32,31,31,31,30,29,30,29,30,30],
};

const AD_REF = new Date(1943, 3, 14); // April 14, 1943 = 2000/01/01 BS

function adToBS(adDate: Date): { year: number; month: number; day: number; monthName: string } {
  const diffMs = adDate.getTime() - AD_REF.getTime();
  let totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let bsYear = 2000, bsMonth = 0, bsDay = 1;
  while (totalDays > 0) {
    const cal = BS_CALENDAR[bsYear];
    if (!cal) break;
    const daysInMonth = cal[bsMonth];
    const remaining = daysInMonth - bsDay;
    if (totalDays <= remaining) {
      bsDay += totalDays;
      totalDays = 0;
    } else {
      totalDays -= (remaining + 1);
      bsMonth++;
      if (bsMonth >= 12) { bsMonth = 0; bsYear++; }
      bsDay = 1;
    }
  }
  return { year: bsYear, month: bsMonth, day: bsDay, monthName: BS_MONTHS[bsMonth] };
}

function bsToAD(bsYear: number, bsMonth: number, bsDay: number): Date {
  // Count total days from BS reference to target BS date
  let totalDays = 0;
  for (let y = 2000; y < bsYear; y++) {
    const cal = BS_CALENDAR[y];
    if (!cal) break;
    for (let m = 0; m < 12; m++) totalDays += cal[m];
  }
  const cal = BS_CALENDAR[bsYear];
  if (cal) {
    for (let m = 0; m < bsMonth; m++) totalDays += cal[m];
    totalDays += bsDay - 1;
  }
  const result = new Date(AD_REF);
  result.setDate(result.getDate() + totalDays);
  return result;
}

// Generate date mapping for current and surrounding months
function generateDateMapping(today: Date): string {
  const bs = adToBS(today);
  const mappings: string[] = [];
  
  // Map current BS month and previous month
  const monthsToMap = [
    { year: bs.month === 0 ? bs.year - 1 : bs.year, month: bs.month === 0 ? 11 : bs.month - 1 },
    { year: bs.year, month: bs.month },
  ];
  
  for (const { year: bsY, month: bsM } of monthsToMap) {
    const cal = BS_CALENDAR[bsY];
    if (!cal) continue;
    const daysInMonth = cal[bsM];
    for (let d = 1; d <= daysInMonth; d++) {
      const ad = bsToAD(bsY, bsM, d);
      const adStr = ad.toISOString().split("T")[0];
      mappings.push(`  ${d} ${BS_MONTHS[bsM]} ${bsY} BS = ${adStr} AD`);
    }
  }
  
  return mappings.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ALL transactions
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

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const todayBS = adToBS(today);

    // Generate Nepali date mapping
    const dateMapping = generateDateMapping(today);

    // Also add BS date to each transaction for the AI
    const txWithBS = allTransactions.map(t => {
      const txDate = new Date(t.date);
      const bs = adToBS(txDate);
      return { ...t, nepaliDate: `${bs.day} ${bs.monthName} ${bs.year}` };
    });

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

    const cm = monthlyData[currentMonth] || { income: 0, expense: 0, byCategory: {} };
    const categoryBreakdown = Object.entries(cm.byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt]) => `  - ${cat}: Rs.${amt.toLocaleString("en-IN")}`)
      .join("\n");

    let totalIncome = 0, totalExpense = 0;
    for (const t of allTransactions) {
      if (t.type === "income") totalIncome += Number(t.amount);
      else totalExpense += Number(t.amount);
    }

    const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
    const monthlyTrend = sortedMonths.map(m => {
      const d = monthlyData[m];
      return `  ${m}: Income Rs.${d.income.toLocaleString("en-IN")} | Expense Rs.${d.expense.toLocaleString("en-IN")} | Net Rs.${(d.income - d.expense).toLocaleString("en-IN")}`;
    }).join("\n");

    // Recent transactions with Nepali dates
    const recentTx = txWithBS.slice(0, 30).map(t =>
      `${t.date.substring(0, 10)} (${t.nepaliDate} BS) | ${t.type} | ${t.category} | Rs.${Number(t.amount).toLocaleString("en-IN")} | ${t.description}`
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

## CRITICAL: NEPALI DATE CONVERSION
- Today is ${todayStr} AD = ${todayBS.day} ${todayBS.monthName} ${todayBS.year} BS
- When the user mentions a Nepali date (like "21 Chaitra" or "5 Baisakh"), you MUST use the EXACT mapping below to find the correct AD date.
- DO NOT guess or calculate Nepali dates yourself. ONLY use the mapping table below.
- If a date is not in the mapping, say you don't have data for that date.

### Nepali Date ↔ English Date Mapping (AUTHORITATIVE - USE THIS):
${dateMapping}

## Pre-Computed Data (USE THESE FOR ANSWERS):

### Today: ${todayStr} (${todayBS.day} ${todayBS.monthName} ${todayBS.year} BS)
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

### Recent 30 Transactions (with Nepali dates):
${recentTx || "No transactions yet."}

## When Adding Transactions:
- ALWAYS use the add_transaction tool. Never just say you added it.
- For "today", use ${todayStr}. For "yesterday", use ${new Date(today.getTime() - 86400000).toISOString().split("T")[0]}.
- Expense categories: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Rent & Housing, Insurance, Subscriptions, Other
- Income categories: Salary, Freelance, Investment, Business, Rental Income, Other

## Response Style:
- Be concise. Use markdown tables for comparisons.
- For spending questions, show the number prominently and add brief context.
- When user asks about a Nepali date, ALWAYS mention both the Nepali date and its corresponding English date in your response.`;

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
