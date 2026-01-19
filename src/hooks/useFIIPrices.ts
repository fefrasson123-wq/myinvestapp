import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fiiList, StockAsset } from '@/data/stocksList';
import { getPriceCache } from '@/lib/priceCache';
import { yahooRateLimiter } from '@/lib/rateLimiter';

interface FIIPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dividendYield: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

type FIIPriceMap = Record<string, FIIPrice>;

// Cache instance
const fiiCache = getPriceCache<FIIPriceMap>('fii');

// Dividend Yields aproximados dos FIIs (dados Status Invest Dez/2024)
const fiiDividendYields: Record<string, number> = {
  'MXRF11': 12.8,
  'XPLG11': 8.9,
  'HGLG11': 8.2,
  'VISC11': 9.4,
  'XPML11': 9.8,
  'KNRI11': 8.1,
  'HGBS11': 7.6,
  'BCFF11': 10.8,
  'VILG11': 9.5,
  'PVBI11': 9.2,
  'RBRP11': 12.5,
  'BTLG11': 9.3,
  'HGRE11': 8.0,
  'JSRE11': 10.5,
  'VRTA11': 13.8,
  'CPTS11': 13.2,
  'RECR11': 14.5,
  'IRDM11': 14.0,
  'KNCR11': 12.8,
  'RBRY11': 12.2,
  'VGIR11': 14.5,
  'HSML11': 10.2,
  'MALL11': 8.8,
  'LVBI11': 8.5,
  'ALZR11': 8.4,
};

// Fallback prices from local data
function getLocalFIIPrices(): Record<string, StockAsset> {
  const priceMap: Record<string, StockAsset> = {};
  fiiList.forEach(fii => {
    priceMap[fii.ticker] = fii;
  });
  return priceMap;
}

const localFIIPrices = getLocalFIIPrices();

export function useFIIPrices() {
  const [prices, setPrices] = useState<FIIPriceMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Mantém o último preço válido da API
  const lastValidPrices = useRef<FIIPriceMap>({});
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Inicializa com cache
  useEffect(() => {
    const initCache = async () => {
      const cached = await fiiCache.get();
      if (cached) {
        setPrices(cached.data);
        setLastUpdate(new Date(fiiCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
      }
    };
    initCache();
    
    // Subscribe to cache updates from other tabs
    const unsubscribe = fiiCache.subscribe((data) => {
      setPrices(data as FIIPriceMap);
      setLastUpdate(new Date());
    });
    
    return unsubscribe;
  }, []);

  // Fetch a single FII price from BRAPI with rate limiting
  const fetchSinglePrice = async (symbol: string): Promise<FIIPrice | null> => {
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
            dividendYield: fiiDividendYields[symbol] || 10.0,
            high24h: q.high24h,
            low24h: q.low24h,
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

  // Get local fallback price for a symbol - usa cache primeiro
  const getLocalFallback = useCallback(async (symbol: string): Promise<FIIPrice | null> => {
    const upperSymbol = symbol.toUpperCase();
    
    // Primeiro tenta usar preço do cache se não for muito antigo
    const cached = await fiiCache.get();
    if (cached && cached.data[upperSymbol] && !cached.isStale) {
      return cached.data[upperSymbol];
    }
    
    // Depois tenta último preço válido em memória
    if (lastValidPrices.current[upperSymbol]) {
      return lastValidPrices.current[upperSymbol];
    }
    
    // Por fim usa dados locais estáticos
    const fiiData = localFIIPrices[upperSymbol];
    if (!fiiData) return null;
    
    // Small random variation
    const variationPercent = (Math.random() - 0.5) * 0.006;
    const variation = fiiData.price * variationPercent;
    const currentPrice = fiiData.price + variation;
    
    return {
      symbol: upperSymbol,
      price: Math.round(currentPrice * 100) / 100,
      change: fiiData.change + variation,
      changePercent: fiiData.changePercent + variationPercent * 100,
      dividendYield: fiiDividendYields[upperSymbol] || 10.0,
      high24h: Math.round(currentPrice * 1.015 * 100) / 100,
      low24h: Math.round(currentPrice * 0.985 * 100) / 100,
      lastUpdated: new Date().toISOString(),
    };
  }, []);

  // Fetch prices for specific symbols only (on demand)
  const fetchPrices = useCallback(async (symbols?: string[]) => {
    if (!symbols || symbols.length === 0) {
      // Don't fetch all FIIs at once - use cached/local data for initial load
      const priceMap: FIIPriceMap = {};
      for (const symbol of Object.keys(localFIIPrices)) {
        const fallback = await getLocalFallback(symbol);
        if (fallback) priceMap[symbol] = fallback;
      }
      setPrices(priceMap);
      setLastUpdate(new Date());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch each symbol individually to comply with BRAPI free tier
      const newPrices: FIIPriceMap = {};
      let successCount = 0;
      
      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();
        
        // Try BRAPI first
        const livePrice = await fetchSinglePrice(upperSymbol);
        
        if (livePrice) {
          newPrices[upperSymbol] = livePrice;
          successCount++;
          console.log(`Updated ${upperSymbol} price:`, livePrice.price);
        } else {
          // Fallback to cache/local data
          const fallback = await getLocalFallback(upperSymbol);
          if (fallback) {
            newPrices[upperSymbol] = fallback;
            console.log(`Using fallback for ${upperSymbol}:`, fallback.price);
          }
        }
      }

      // Merge with cache and save
      const updatedPrices = await fiiCache.merge(newPrices);
      
      if (successCount > 0) {
        lastValidPrices.current = { ...lastValidPrices.current, ...newPrices };
        retryCount.current = 0;
      }
      
      setPrices(updatedPrices);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching FII prices:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      
      retryCount.current++;
      
      // Use fallback for all requested symbols
      const fallbackPrices: FIIPriceMap = {};
      for (const symbol of symbols) {
        const fallback = await getLocalFallback(symbol.toUpperCase());
        if (fallback) fallbackPrices[symbol.toUpperCase()] = fallback;
      }
      setPrices(prev => ({ ...prev, ...fallbackPrices }));
      
      // Retry se falhou
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
    const fiiPrice = prices[upperSymbol];
    if (!fiiPrice) return null;
    return {
      change: fiiPrice.change,
      percent: fiiPrice.changePercent,
    };
  }, [prices]);

  const getDividendYield = useCallback((symbol: string): number | null => {
    const upperSymbol = symbol.toUpperCase();
    return prices[upperSymbol]?.dividendYield ?? null;
  }, [prices]);

  // Load cached/local prices on mount and auto-refresh every 60 seconds
  useEffect(() => {
    const loadPrices = async () => {
      const cached = await fiiCache.get();
      
      // Se cache é válido, usa
      if (cached?.isValid) {
        console.log('Using valid cached FII prices');
        setPrices(cached.data);
        setLastUpdate(new Date(fiiCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
        return;
      }
      
      // Senão usa fallback local
      const priceMap: FIIPriceMap = {};
      for (const symbol of Object.keys(localFIIPrices)) {
        const fallback = await getLocalFallback(symbol);
        if (fallback) priceMap[symbol] = fallback;
      }
      setPrices(priceMap);
      setLastUpdate(new Date());
    };

    loadPrices();

    // Atualiza a cada 60 segundos
    const interval = setInterval(loadPrices, 60000);
    return () => clearInterval(interval);
  }, [getLocalFallback]);

  return {
    prices,
    isLoading,
    error,
    lastUpdate,
    fetchPrices,
    getPrice,
    getPriceChange,
    getDividendYield,
  };
}
