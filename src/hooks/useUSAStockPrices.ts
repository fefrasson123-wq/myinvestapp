import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPriceCache } from '@/lib/priceCache';

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

type USAStockPriceMap = Record<string, USAStockPrice>;

// Cache instance
const usaStockCache = getPriceCache<USAStockPriceMap>('usaStocks');

export function useUSAStockPrices() {
  const [prices, setPrices] = useState<USAStockPriceMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const lastValidPrices = useRef<USAStockPriceMap>({});
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Inicializa com cache
  useEffect(() => {
    const initCache = async () => {
      const cached = await usaStockCache.get();
      if (cached) {
        setPrices(cached.data);
        setLastUpdate(new Date(usaStockCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
      }
    };
    initCache();
    
    // Subscribe to cache updates from other tabs
    const unsubscribe = usaStockCache.subscribe((data) => {
      setPrices(data as USAStockPriceMap);
      setLastUpdate(new Date());
    });
    
    return unsubscribe;
  }, []);

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

  const getLocalFallback = useCallback(async (symbol: string): Promise<USAStockPrice | null> => {
    const upperSymbol = symbol.toUpperCase();
    
    const cached = await usaStockCache.get();
    if (cached && cached.data[upperSymbol] && !cached.isStale) {
      return cached.data[upperSymbol];
    }
    
    if (lastValidPrices.current[upperSymbol]) {
      return lastValidPrices.current[upperSymbol];
    }
    
    return null;
  }, []);

  const fetchPrices = useCallback(async (symbols: string[]) => {
    if (!symbols || symbols.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPrices: USAStockPriceMap = {};
      let successCount = 0;
      
      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();
        
        const livePrice = await fetchSinglePrice(upperSymbol);
        
        if (livePrice) {
          newPrices[upperSymbol] = livePrice;
          successCount++;
          console.log(`Updated ${upperSymbol} (USA) price:`, livePrice.price);
        } else {
          const fallback = await getLocalFallback(upperSymbol);
          if (fallback) {
            newPrices[upperSymbol] = fallback;
            console.log(`Using fallback for ${upperSymbol} (USA):`, fallback.price);
          }
        }
      }

      // Merge with cache and save
      const updatedPrices = await usaStockCache.merge(newPrices);
      
      if (successCount > 0) {
        lastValidPrices.current = { ...lastValidPrices.current, ...newPrices };
        retryCount.current = 0;
      }
      
      setPrices(updatedPrices);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching USA stock prices:', err);
      setError(err instanceof Error ? err.message : 'Error fetching quotes');
      
      retryCount.current++;
      
      const fallbackPrices: USAStockPriceMap = {};
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

  useEffect(() => {
    const initCache = async () => {
      const cached = await usaStockCache.get();
      
      if (cached?.isValid) {
        console.log('Using valid cached USA stock prices');
        setPrices(cached.data);
        setLastUpdate(new Date(usaStockCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
      }
    };
    initCache();
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
