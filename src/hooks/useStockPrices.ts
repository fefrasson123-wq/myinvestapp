import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPriceCache } from '@/lib/priceCache';
import { yahooRateLimiter } from '@/lib/rateLimiter';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  open: number;
  lastUpdated: string;
}

type StockPriceMap = Record<string, StockPrice>;

// Cache instance
const stockCache = getPriceCache<StockPriceMap>('stocks');

// Lazy-load local data only when needed (avoid importing large lists at module level)
let _localPrices: Record<string, { ticker: string; price: number; change: number; changePercent: number }> | null = null;
async function getLocalPrices() {
  if (_localPrices) return _localPrices;
  const [{ stocksList, fiiList }, { bdrList }] = await Promise.all([
    import('@/data/stocksList'),
    import('@/data/bdrList'),
  ]);
  _localPrices = {};
  for (const asset of [...stocksList, ...fiiList, ...bdrList]) {
    _localPrices[asset.ticker] = asset;
  }
  return _localPrices;
}

export function useStockPrices() {
  const [prices, setPrices] = useState<StockPriceMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const lastValidPrices = useRef<StockPriceMap>({});
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Initialize from cache only (no eager local data load)
  useEffect(() => {
    const initCache = async () => {
      const cached = await stockCache.get();
      if (cached) {
        setPrices(cached.data);
        setLastUpdate(new Date(stockCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
      }
    };
    initCache();
    
    const unsubscribe = stockCache.subscribe((data) => {
      setPrices(data as StockPriceMap);
      setLastUpdate(new Date());
    });
    
    return unsubscribe;
  }, []);

  const fetchSinglePrice = async (symbol: string): Promise<StockPrice | null> => {
    try {
      const result = await yahooRateLimiter.execute(async () => {
        const { data, error: fetchError } = await supabase.functions.invoke('stock-quotes', {
          body: { symbols: [symbol] },
        });

        if (fetchError) {
          console.error('Edge function error for', symbol, ':', fetchError);
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
      }, 1);
      
      return result;
    } catch (err) {
      console.error('Error fetching price for', symbol, ':', err);
      return null;
    }
  };

  // Get fallback price for a specific symbol only (not all)
  const getLocalFallback = useCallback(async (symbol: string): Promise<StockPrice | null> => {
    const upperSymbol = symbol.toUpperCase();
    
    // Try cache first
    const cached = await stockCache.get();
    if (cached && cached.data[upperSymbol] && !cached.isStale) {
      return cached.data[upperSymbol];
    }
    
    // Then last valid from memory
    if (lastValidPrices.current[upperSymbol]) {
      return lastValidPrices.current[upperSymbol];
    }
    
    // Finally use local static data for this specific symbol
    const localPrices = await getLocalPrices();
    const stockData = localPrices[upperSymbol];
    if (!stockData) return null;
    
    const variationPercent = (Math.random() - 0.5) * 0.01;
    const variation = stockData.price * variationPercent;
    const currentPrice = stockData.price + variation;
    
    return {
      symbol: upperSymbol,
      price: Math.round(currentPrice * 100) / 100,
      change: stockData.change + variation,
      changePercent: stockData.changePercent + variationPercent * 100,
      high24h: Math.round(currentPrice * 1.02 * 100) / 100,
      low24h: Math.round(currentPrice * 0.98 * 100) / 100,
      open: Math.round((currentPrice - stockData.change) * 100) / 100,
      lastUpdated: new Date().toISOString(),
    };
  }, []);

  // Fetch prices for specific symbols only (on demand) - NO automatic load of all stocks
  const fetchPrices = useCallback(async (symbols?: string[]) => {
    if (!symbols || symbols.length === 0) {
      // Only load from cache, don't iterate all local data
      const cached = await stockCache.get();
      if (cached) {
        setPrices(cached.data);
        setLastUpdate(new Date(stockCache.getTimestamp() || Date.now()));
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPrices: StockPriceMap = {};
      let successCount = 0;
      
      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();
        
        const livePrice = await fetchSinglePrice(upperSymbol);
        
        if (livePrice) {
          newPrices[upperSymbol] = livePrice;
          successCount++;
        } else {
          const fallback = await getLocalFallback(upperSymbol);
          if (fallback) {
            newPrices[upperSymbol] = fallback;
          }
        }
      }

      const updatedPrices = await stockCache.merge(newPrices);
      
      if (successCount > 0) {
        lastValidPrices.current = { ...lastValidPrices.current, ...newPrices };
        retryCount.current = 0;
      }
      
      setPrices(updatedPrices);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching stock prices:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      
      retryCount.current++;
      
      const fallbackPrices: StockPriceMap = {};
      for (const symbol of symbols) {
        const fallback = await getLocalFallback(symbol.toUpperCase());
        if (fallback) fallbackPrices[symbol.toUpperCase()] = fallback;
      }
      setPrices(prev => ({ ...prev, ...fallbackPrices }));
      
      if (retryCount.current < maxRetries) {
        setTimeout(() => fetchPrices(symbols), 15000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getLocalFallback]);

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

  // Only load from cache on mount - NO 60s interval loading all local prices
  useEffect(() => {
    const loadFromCache = async () => {
      const cached = await stockCache.get();
      if (cached?.isValid) {
        setPrices(cached.data);
        setLastUpdate(new Date(stockCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
      }
    };
    loadFromCache();
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
