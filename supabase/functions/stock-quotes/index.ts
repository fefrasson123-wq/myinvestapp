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

// Converte símbolo de cripto para formato Yahoo Finance
function getCryptoYahooSymbol(symbol: string): string {
  const normalized = symbol.toUpperCase().replace('-USD', '');
  return `${normalized}-USD`;
}

// Fetch with timeout and retry
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries = 2, 
  timeout = 8000
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
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  }
  
  throw lastError || new Error('Fetch failed');
}

// Yahoo Finance API - completely free, no API key needed
async function fetchYahooFinanceQuote(originalSymbol: string, market: 'br' | 'usa' | 'crypto' = 'br'): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number;
  name?: string;
} | null> {
  try {
    let yahooSymbol: string;
    
    if (market === 'crypto') {
      // Cryptos use -USD suffix
      yahooSymbol = getCryptoYahooSymbol(originalSymbol);
    } else if (market === 'usa') {
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
    
    const response = await fetchWithRetry(url, {
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
      name: meta.shortName || meta.longName,
    };
  } catch (error) {
    console.error(`Error fetching Yahoo Finance for ${originalSymbol}:`, error);
    return null;
  }
}

// Busca histórico de preços do Yahoo Finance
async function fetchHistoricalPrices(
  symbols: string[], 
  market: 'br' | 'usa' | 'crypto',
  range: string = '1mo'
): Promise<Record<string, Array<{ date: string; price: number }>>> {
  const result: Record<string, Array<{ date: string; price: number }>> = {};
  
  // Mapeia range para intervalo Yahoo
  const intervalMap: Record<string, string> = {
    '1d': '5m',
    '1w': '1h',
    '1mo': '1d',
    '6mo': '1d',
    '1y': '1d',
    '2y': '1wk',
    'max': '1mo'
  };
  
  const interval = intervalMap[range] || '1d';
  
  await Promise.all(symbols.map(async (originalSymbol) => {
    try {
      let yahooSymbol: string;
      
      if (market === 'crypto') {
        yahooSymbol = getCryptoYahooSymbol(originalSymbol);
      } else if (market === 'usa') {
        yahooSymbol = originalSymbol.toUpperCase();
      } else {
        const normalizedSymbol = normalizeToYahooSymbol(originalSymbol);
        yahooSymbol = `${normalizedSymbol}.SA`;
      }
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
      
      console.log(`Fetching historical for: ${yahooSymbol} (range: ${range}, interval: ${interval})`);
      
      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.error(`Yahoo historical error for ${originalSymbol}: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      if (!data?.chart?.result?.[0]) {
        console.error(`No historical data for ${originalSymbol}`);
        return;
      }

      const chartResult = data.chart.result[0];
      const timestamps = chartResult.timestamp || [];
      const closes = chartResult.indicators?.quote?.[0]?.close || [];
      
      const history: Array<{ date: string; price: number }> = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        const price = closes[i];
        if (price !== null && price !== undefined) {
          const date = new Date(timestamps[i] * 1000).toISOString();
          history.push({ date, price });
        }
      }
      
      const symbol = originalSymbol.toUpperCase().replace('.SA', '').replace('-USD', '');
      result[symbol] = history;
      
      console.log(`Got ${history.length} historical points for ${symbol}`);
    } catch (error) {
      console.error(`Error fetching historical for ${originalSymbol}:`, error);
    }
  }));
  
  return result;
}

// Busca criptomoedas no Yahoo Finance por nome/símbolo
async function searchCryptos(query: string): Promise<Array<{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
}>> {
  try {
    // Yahoo Finance search API
    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
    
    console.log(`Searching cryptos on Yahoo Finance for: ${query}`);
    
    const response = await fetchWithRetry(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance search error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data?.quotes || data.quotes.length === 0) {
      console.log(`No search results for: ${query}`);
      return [];
    }

    // Filter only crypto results (quoteType === 'CRYPTOCURRENCY')
    const cryptoQuotes = data.quotes.filter((q: { quoteType?: string; symbol?: string }) => 
      q.quoteType === 'CRYPTOCURRENCY' || (q.symbol && q.symbol.endsWith('-USD'))
    );

    console.log(`Found ${cryptoQuotes.length} crypto results for: ${query}`);

    // Fetch detailed quotes for each crypto
    const detailedQuotes = await Promise.all(
      cryptoQuotes.slice(0, 10).map(async (q: { symbol: string; shortname?: string; longname?: string }) => {
        const symbol = q.symbol.replace('-USD', '');
        const quote = await fetchYahooFinanceQuote(symbol, 'crypto');
        
        if (quote) {
          return {
            symbol,
            name: q.shortname || q.longname || symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            high24h: quote.high24h,
            low24h: quote.low24h,
          };
        }
        return null;
      })
    );

    return detailedQuotes.filter((q): q is NonNullable<typeof q> => q !== null);
  } catch (error) {
    console.error(`Error searching cryptos:`, error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { symbols, market = 'br', action, query } = body;
    
    // Handle crypto search action
    if (action === 'search-crypto' && query) {
      console.log(`Searching cryptos for query: ${query}`);
      const results = await searchCryptos(query);
      
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle historical prices action
    if (action === 'historical') {
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        throw new Error('Símbolos inválidos para histórico');
      }
      
      const range = body.range || '1mo';
      console.log(`Fetching historical for: ${symbols.join(', ')} (market: ${market}, range: ${range})`);
      
      const history = await fetchHistoricalPrices(symbols, market, range);
      
      return new Response(JSON.stringify({ history }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Símbolos inválidos');
    }

    console.log(`Fetching quotes for: ${symbols.join(', ')} (market: ${market})`);
    
    // Fetch all symbols in parallel using Yahoo Finance
    const quotePromises = symbols.map(async (symbol: string) => {
      let upperSymbol = symbol.toUpperCase();
      
      // Normalize based on market
      if (market === 'crypto') {
        upperSymbol = upperSymbol.replace('-USD', '');
      } else if (market === 'br') {
        upperSymbol = upperSymbol.replace('.SA', '');
      }
      
      const quote = await fetchYahooFinanceQuote(upperSymbol, market);
      return { symbol: upperSymbol, quote };
    });

    const results = await Promise.all(quotePromises);

    // Transform data to our format
    const quotes: Record<string, {
      symbol: string;
      name?: string;
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
          name: quote.name,
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