import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback rates (updated manually as conservative defaults)
const FALLBACK_RATES: Record<string, number> = {
  "USD-BRL": 5.85,
  "EUR-BRL": 6.35,
};

async function fetchFromAwesomeAPI(pair: string): Promise<{ bid: number; ask: number }> {
  const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${pair}`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "MyInvest/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`AwesomeAPI returned ${response.status}`);
  }

  const data = await response.json();
  const pairKey = pair.replace("-", "");
  const rateData = data[pairKey];

  if (!rateData) {
    throw new Error("No rate data in response");
  }

  return {
    bid: parseFloat(rateData.bid),
    ask: parseFloat(rateData.ask),
  };
}

async function fetchFromOpenExchange(pair: string): Promise<{ bid: number; ask: number }> {
  // This is a free alternative API
  // Currency pair format: USD-BRL -> base=USD, target=BRL
  const [base, target] = pair.split("-");
  
  const response = await fetch(
    `https://open.er-api.com/v6/latest/${base}`,
    {
      headers: {
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`OpenExchange returned ${response.status}`);
  }

  const data = await response.json();
  
  if (data.result !== "success" || !data.rates?.[target]) {
    throw new Error("Invalid OpenExchange response");
  }

  const rate = data.rates[target];
  return {
    bid: rate,
    ask: rate,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pair = (url.searchParams.get("pair") || "USD-BRL").toUpperCase();
    
    // Validate pair format
    const validPairs = ["USD-BRL", "EUR-BRL"];
    if (!validPairs.includes(pair)) {
      return new Response(
        JSON.stringify({ error: "Invalid currency pair. Supported: USD-BRL, EUR-BRL" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check cache first
    const cached = cache.get(pair);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached rate for ${pair}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let rates: { bid: number; ask: number } | null = null;
    let source = "awesome";

    // Try AwesomeAPI first
    try {
      rates = await fetchFromAwesomeAPI(pair);
      source = "awesome";
    } catch (awesomeError) {
      console.warn(`AwesomeAPI failed: ${awesomeError}`);
      
      // Try OpenExchange as fallback
      try {
        rates = await fetchFromOpenExchange(pair);
        source = "openexchange";
      } catch (openError) {
        console.warn(`OpenExchange also failed: ${openError}`);
      }
    }

    // If both APIs failed, use fallback
    if (!rates) {
      const fallbackRate = FALLBACK_RATES[pair] || 5.0;
      console.log(`Using fallback rate for ${pair}: ${fallbackRate}`);
      rates = { bid: fallbackRate, ask: fallbackRate };
      source = "fallback";
    }

    const result = {
      pair,
      bid: rates.bid,
      ask: rates.ask,
      source,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };

    // Store in cache
    cache.set(pair, { data: result, timestamp: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Exchange rate error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch exchange rate",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
