import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Public quotes endpoint: we intentionally disable JWT verification so quotes never fail
// due to auth token issues (prices are not sensitive data).
export const config = {
  verify_jwt: false,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeia tickers brasileiros com sufixos especiais (units, BDRs, etc) para o formato Yahoo Finance
function normalizeToYahooSymbol(symbol: string): string {
  let normalized = symbol.toUpperCase().replace('.SA', '');
  
  // Remove 'N' de units/nominativas (ex: ITUBN4 -> ITUB4, BPACN11 -> BPAC11)
  normalized = normalized.replace(/^([A-Z]+)N(\d+)$/, '$1$2');
  
  // Remove 'F' de fracionário (ex: PETR4F -> PETR4)
  normalized = normalized.replace(/^([A-Z]+\d+)F$/, '$1');
  
  return normalized;
}

// Yahoo Finance API - completely free, no API key needed
async function fetchYahooFinanceQuote(originalSymbol: string, market: 'br' | 'usa' = 'br'): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number;
} | null> {
  try {
    let yahooSymbol: string;
    
    if (market === 'usa') {
      // USA stocks don't need suffix
      yahooSymbol = originalSymbol.toUpperCase();
    } else {
      // Brazilian stocks need .SA suffix
      const normalizedSymbol = normalizeToYahooSymbol(originalSymbol);
      yahooSymbol = `${normalizedSymbol}.SA`;
    }
    
    // Use Yahoo Finance v8 API (public, no auth needed)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
    
    console.log(`Fetching Yahoo Finance for: ${yahooSymbol} (market: ${market})`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance error for ${originalSymbol} (${yahooSymbol}): ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data?.chart?.result?.[0]) {
      console.error(`No data found for ${originalSymbol} (${yahooSymbol})`);
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    // Get the most recent values
    const regularMarketPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = regularMarketPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    // Get high/low from today's data or fallback
    let high24h = meta.regularMarketDayHigh || regularMarketPrice;
    let low24h = meta.regularMarketDayLow || regularMarketPrice;
    let open = meta.regularMarketOpen || previousClose;
    let volume = meta.regularMarketVolume || 0;
    
    // If we have intraday data, get the actual high/low
    if (quote?.high && quote.high.length > 0) {
      const validHighs = quote.high.filter((h: number | null) => h !== null);
      if (validHighs.length > 0) high24h = Math.max(...validHighs);
    }
    if (quote?.low && quote.low.length > 0) {
      const validLows = quote.low.filter((l: number | null) => l !== null);
      if (validLows.length > 0) low24h = Math.min(...validLows);
    }
    if (quote?.open && quote.open.length > 0) {
      const validOpens = quote.open.filter((o: number | null) => o !== null);
      if (validOpens.length > 0) open = validOpens[0];
    }

    console.log(`Yahoo Finance ${originalSymbol} (${yahooSymbol}): price=${regularMarketPrice}, change=${change.toFixed(2)} (${changePercent.toFixed(2)}%)`);

    return {
      price: regularMarketPrice,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      high24h: Math.round(high24h * 100) / 100,
      low24h: Math.round(low24h * 100) / 100,
      open: Math.round(open * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      volume,
      marketCap: 0,
    };
  } catch (error) {
    console.error(`Error fetching Yahoo Finance for ${originalSymbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, market = 'br' } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Símbolos inválidos');
    }

    console.log(`Fetching quotes for: ${symbols.join(', ')} (market: ${market})`);
    
    // Fetch all symbols in parallel using Yahoo Finance
    const quotePromises = symbols.map(async (symbol: string) => {
      const upperSymbol = symbol.toUpperCase().replace('.SA', ''); // Normalize symbol
      const quote = await fetchYahooFinanceQuote(upperSymbol, market);
      return { symbol: upperSymbol, quote };
    });

    const results = await Promise.all(quotePromises);

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
    
    for (const { symbol, quote } of results) {
      if (quote) {
        quotes[symbol] = {
          symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          high24h: quote.high24h,
          low24h: quote.low24h,
          open: quote.open,
          previousClose: quote.previousClose,
          volume: quote.volume,
          marketCap: quote.marketCap,
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    console.log(`Successfully fetched ${Object.keys(quotes).length}/${symbols.length} quotes`);

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
