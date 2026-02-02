import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrapiDividend {
  assetIssued: string;
  paymentDate: string;
  rate: number;
  relatedTo: string;
  approvedOn: string;
  isinCode: string;
  label: string;
  lastDatePrior: string;
  type: string;
}

interface BrapiResult {
  symbol: string;
  dividendsData: {
    cashDividends: BrapiDividend[];
  };
}

// Map BRAPI dividend types to our income types
function mapDividendType(brapiType: string): 'dividend' | 'jcp' {
  const type = brapiType?.toLowerCase() || '';
  if (type.includes('jcp') || type.includes('juros sobre capital')) {
    return 'jcp';
  }
  return 'dividend';
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    
    if (!BRAPI_TOKEN) {
      throw new Error('BRAPI_TOKEN not configured');
    }

    const body = await req.json();
    const { tickers, investmentMap } = body;
    // investmentMap: Record<ticker, { id: string; name: string; category: string }>

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(
        JSON.stringify({ dividends: [], message: 'No tickers provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching dividends for ${tickers.length} tickers: ${tickers.join(', ')}`);

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
      type: 'dividend' | 'jcp';
      amount: number;
      payment_date: string;
      ex_date: string | null;
      notes: string | null;
    }> = [];

    // Fetch dividends for each ticker (BRAPI free tier: 1 ticker at a time)
    for (const ticker of tickers) {
      try {
        const url = `https://brapi.dev/api/quote/${ticker}?dividends=true&token=${BRAPI_TOKEN}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          console.error(`BRAPI error for ${ticker}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const result: BrapiResult | undefined = data?.results?.[0];

        if (!result?.dividendsData?.cashDividends) {
          console.log(`No dividend data for ${ticker}`);
          continue;
        }

        const investment = investmentMap?.[ticker.toUpperCase()];
        const investmentId = investment?.id || null;
        const investmentName = investment?.name || ticker;
        const category = investment?.category || 'stocks';

        // Filter dividends from last 12 months
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        for (const div of result.dividendsData.cashDividends) {
          const paymentDate = new Date(div.paymentDate);
          
          // Only include dividends from last 12 months
          if (paymentDate < oneYearAgo) continue;

          const paymentDateStr = paymentDate.toISOString().split('T')[0];
          const divType = mapDividendType(div.type);
          
          // Check for duplicates
          const key = `${investmentName}-${paymentDateStr}-${div.rate}-${divType}`;
          if (existingKeys.has(key)) {
            console.log(`Skipping duplicate: ${key}`);
            continue;
          }

          allDividends.push({
            user_id: userId,
            investment_id: investmentId,
            investment_name: investmentName,
            category: category,
            type: divType,
            amount: div.rate,
            payment_date: paymentDateStr,
            ex_date: div.lastDatePrior ? new Date(div.lastDatePrior).toISOString().split('T')[0] : null,
            notes: `Sincronizado automaticamente via BRAPI - ${div.label || div.type}`,
          });

          // Add to existing keys to prevent duplicates within this batch
          existingKeys.add(key);
        }

        console.log(`Found ${result.dividendsData.cashDividends.length} dividends for ${ticker}`);

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error fetching dividends for ${ticker}:`, error);
      }
    }

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
