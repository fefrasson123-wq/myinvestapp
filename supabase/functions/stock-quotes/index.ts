import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Não autorizado' }),
      { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Símbolos inválidos');
    }

    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    
    // Join symbols for batch request
    const symbolsParam = symbols.join(',');
    
    // Build URL with optional token
    let url = `https://brapi.dev/api/quote/${symbolsParam}`;
    if (BRAPI_TOKEN) {
      url += `?token=${BRAPI_TOKEN}`;
    }

    console.log(`Fetching quotes for: ${symbolsParam}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BRAPI Error:', errorText);
      throw new Error(`BRAPI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('BRAPI Response:', JSON.stringify(data).substring(0, 500));

    // Transform data to our format
    const quotes: Record<string, {
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
      high24h: number;
      low24h: number;
      open: number;
      previousClose: number;
      volume: number;
      marketCap: number;
      lastUpdated: string;
    }> = {};
    
    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        if (result.symbol) {
          quotes[result.symbol] = {
            symbol: result.symbol,
            price: result.regularMarketPrice || 0,
            change: result.regularMarketChange || 0,
            changePercent: result.regularMarketChangePercent || 0,
            high24h: result.regularMarketDayHigh || result.regularMarketPrice || 0,
            low24h: result.regularMarketDayLow || result.regularMarketPrice || 0,
            open: result.regularMarketOpen || result.regularMarketPrice || 0,
            previousClose: result.regularMarketPreviousClose || 0,
            volume: result.regularMarketVolume || 0,
            marketCap: result.marketCap || 0,
            lastUpdated: new Date().toISOString(),
          };
        }
      }
    }

    return new Response(JSON.stringify({ quotes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching quotes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
