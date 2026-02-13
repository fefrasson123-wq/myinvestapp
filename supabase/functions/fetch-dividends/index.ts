import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YahooDividend {
  amount: number;
  date: number; // Unix timestamp
}

// Normalize ticker to Yahoo Finance symbol based on category
function normalizeToYahooSymbol(symbol: string, category: string): string {
  let normalized = symbol.toUpperCase();
  
  // US stocks and REITs don't need .SA suffix
  if (category === 'usastocks' || category === 'reits') {
    return normalized.replace('.SA', '');
  }
  
  // Brazilian tickers
  normalized = normalized.replace('.SA', '');
  // Remove 'N' from units (ex: ITUBN4 -> ITUB4)
  normalized = normalized.replace(/^([A-Z]+)N(\d+)$/, '$1$2');
  // Remove 'F' from fractional (ex: PETR4F -> PETR4)
  normalized = normalized.replace(/^([A-Z]+\d+)F$/, '$1');
  return `${normalized}.SA`;
}

// Fetch with timeout and retry
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries = 2, 
  timeout = 10000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Fetch attempt ${i + 1} failed for ${url}: ${lastError.message}`);
      
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  }
  
  throw lastError || new Error('Fetch failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    const body = await req.json();
    const { tickers, investmentMap } = body;
    // investmentMap: Record<ticker, { id: string; name: string; category: string; quantity: number }>

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(
        JSON.stringify({ dividends: [], message: 'No tickers provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching dividends for ${tickers.length} tickers via Yahoo Finance: ${tickers.join(', ')}`);

    // Get existing income payments to avoid duplicates
    const { data: existingPayments, error: fetchError } = await supabase
      .from('income_payments')
      .select('investment_name, payment_date, amount, type')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching existing payments:', fetchError);
    }

    // Create a set of existing payment keys for deduplication
    const existingKeys = new Set(
      (existingPayments || []).map(p => 
        `${p.investment_name}-${p.payment_date}-${p.amount}-${p.type}`
      )
    );

    const allDividends: Array<{
      user_id: string;
      investment_id: string | null;
      investment_name: string;
      category: string;
      type: 'dividend';
      amount: number;
      payment_date: string;
      ex_date: string | null;
      notes: string | null;
    }> = [];

    // Calculate date range (last 12 months)
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const period1 = Math.floor(oneYearAgo.getTime() / 1000);
    const period2 = Math.floor(now.getTime() / 1000);

    // Fetch dividends for all tickers in parallel
    const fetchPromises = tickers.map(async (ticker: string) => {
      try {
        const investment = investmentMap?.[ticker.toUpperCase()];
        const category = investment?.category || 'stocks';
        const yahooSymbol = normalizeToYahooSymbol(ticker, category);
        
        // Yahoo Finance chart API with dividend events
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=1d&events=div`;
        
        const response = await fetchWithRetry(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          console.error(`Yahoo Finance error for ${ticker}: ${response.status}`);
          return [];
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];
        
        if (!result) {
          console.log(`No data found for ${ticker}`);
          return [];
        }

        // Get dividends from events
        const dividends = result.events?.dividends;
        if (!dividends || Object.keys(dividends).length === 0) {
          console.log(`No dividend events for ${ticker}`);
          return [];
        }

        const investmentId = investment?.id || null;
        const investmentName = investment?.name || ticker;
        const quantity = investment?.quantity || 1;

        const tickerDividends: typeof allDividends = [];

        for (const [timestamp, div] of Object.entries(dividends)) {
          const dividendData = div as YahooDividend;
          const paymentDate = new Date(dividendData.date * 1000);
          const paymentDateStr = paymentDate.toISOString().split('T')[0];
          
          // Calculate total amount: dividend per share × quantity
          const amountPerShare = dividendData.amount;
          const totalAmount = Math.round(amountPerShare * quantity * 100) / 100;
          
          // Check for duplicates
          const key = `${investmentName}-${paymentDateStr}-${totalAmount}-dividend`;
          if (existingKeys.has(key)) {
            console.log(`Skipping duplicate: ${key}`);
            continue;
          }

          tickerDividends.push({
            user_id: userId,
            investment_id: investmentId,
            investment_name: investmentName,
            category: category,
            type: 'dividend',
            amount: totalAmount,
            payment_date: paymentDateStr,
            ex_date: null,
            notes: `Sincronizado via Yahoo Finance (${amountPerShare.toFixed(4)}/ação × ${quantity} ações)`,
          });

          // Add to existing keys to prevent duplicates within this batch
          existingKeys.add(key);
        }

        console.log(`Found ${tickerDividends.length} dividends for ${ticker}`);
        return tickerDividends;

      } catch (error) {
        console.error(`Error fetching dividends for ${ticker}:`, error);
        return [];
      }
    });

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);
    results.forEach(tickerDividends => {
      allDividends.push(...tickerDividends);
    });

    // Insert new dividends
    if (allDividends.length > 0) {
      const { error: insertError } = await supabase
        .from('income_payments')
        .insert(allDividends);

      if (insertError) {
        console.error('Error inserting dividends:', insertError);
        throw insertError;
      }

      console.log(`Inserted ${allDividends.length} new dividend payments`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        inserted: allDividends.length,
        dividends: allDividends,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-dividends:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
