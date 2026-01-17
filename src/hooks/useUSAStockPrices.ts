import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface USAStockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  open: number;
  lastUpdated: string;
}

interface CachedUSAStockPrices {
  prices: Record<string, USAStockPrice>;
  timestamp: number;
}

const CACHE_KEY = 'usa_stock_prices_cache';
const MAX_CACHE_AGE_MS = 15 * 60 * 1000; // 15 minutes
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

function getCachedPrices(): CachedUSAStockPrices | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as CachedUSAStockPrices;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function setCachedPrices(prices: Record<string, USAStockPrice>) {
  try {
    const data: CachedUSAStockPrices = {
      prices,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < MAX_CACHE_AGE_MS;
}

function isCacheStale(timestamp: number): boolean {
  return Date.now() - timestamp > STALE_THRESHOLD_MS;
}

export function useUSAStockPrices() {
  const [prices, setPrices] = useState<Record<string, USAStockPrice>>(() => {
    const cached = getCachedPrices();
    return cached?.prices || {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(() => {
    const cached = getCachedPrices();
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });
  
  const lastValidPrices = useRef<Record<string, USAStockPrice>>({});
  const retryCount = useRef(0);
  const maxRetries = 3;

  const fetchSinglePrice = async (symbol: string): Promise<USAStockPrice | null> => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('stock-quotes', {
        body: { symbols: [symbol], market: 'usa' },
      });

      if (fetchError) {
        console.error('Edge function error for USA stock', symbol, ':', fetchError);
        return null;
      }

      if (data?.quotes?.[symbol]) {
        const q = data.quotes[symbol];
        return {
          symbol: q.symbol,
          price: q.price,
          change: q.change,
          changePercent: q.changePercent,
          high24h: q.high24h,
          low24h: q.low24h,
          open: q.open,
          lastUpdated: new Date().toISOString(),
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching USA stock price for', symbol, ':', err);
      return null;
    }
  };

  const getLocalFallback = (symbol: string): USAStockPrice | null => {
    const upperSymbol = symbol.toUpperCase();
    
    const cached = getCachedPrices();
    if (cached && cached.prices[upperSymbol] && !isCacheStale(cached.timestamp)) {
      return cached.prices[upperSymbol];
    }
    
    if (lastValidPrices.current[upperSymbol]) {
      return lastValidPrices.current[upperSymbol];
    }
    
    return null;
  };

  const fetchPrices = useCallback(async (symbols: string[]) => {
    if (!symbols || symbols.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPrices: Record<string, USAStockPrice> = {};
      let successCount = 0;
      
      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();
        
        const livePrice = await fetchSinglePrice(upperSymbol);
        
        if (livePrice) {
          newPrices[upperSymbol] = livePrice;
          successCount++;
          console.log(`Updated ${upperSymbol} (USA) price:`, livePrice.price);
        } else {
          const fallback = getLocalFallback(upperSymbol);
          if (fallback) {
            newPrices[upperSymbol] = fallback;
            console.log(`Using fallback for ${upperSymbol} (USA):`, fallback.price);
          }
        }
      }

      const updatedPrices = { ...prices, ...newPrices };
      
      if (successCount > 0) {
        setCachedPrices(updatedPrices);
        lastValidPrices.current = { ...lastValidPrices.current, ...newPrices };
        retryCount.current = 0;
      }
      
      setPrices(updatedPrices);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching USA stock prices:', err);
      setError(err instanceof Error ? err.message : 'Error fetching quotes');
      
      retryCount.current++;
      
      const fallbackPrices: Record<string, USAStockPrice> = {};
      symbols.forEach(symbol => {
        const fallback = getLocalFallback(symbol.toUpperCase());
        if (fallback) fallbackPrices[symbol.toUpperCase()] = fallback;
      });
      setPrices(prev => ({ ...prev, ...fallbackPrices }));
      
      if (retryCount.current < maxRetries) {
        setTimeout(() => fetchPrices(symbols), 15000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prices]);

  const getPrice = useCallback((symbol: string): number | null => {
    const upperSymbol = symbol.toUpperCase();
    return prices[upperSymbol]?.price ?? null;
  }, [prices]);

  const getPriceChange = useCallback((symbol: string): { change: number; percent: number } | null => {
    const upperSymbol = symbol.toUpperCase();
    const stockPrice = prices[upperSymbol];
    if (!stockPrice) return null;
    return {
      change: stockPrice.change,
      percent: stockPrice.changePercent,
    };
  }, [prices]);

  useEffect(() => {
    const cached = getCachedPrices();
    
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('Using valid cached USA stock prices');
      setPrices(cached.prices);
      setLastUpdate(new Date(cached.timestamp));
      lastValidPrices.current = cached.prices;
    }
  }, []);

  return {
    prices,
    isLoading,
    error,
    lastUpdate,
    fetchPrices,
    getPrice,
    getPriceChange,
  };
}
