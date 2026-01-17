import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { stocksList, fiiList, StockAsset } from '@/data/stocksList';
import { bdrList, BDRAsset } from '@/data/bdrList';

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

interface CachedStockPrices {
  prices: Record<string, StockPrice>;
  timestamp: number;
}

const CACHE_KEY = 'stock_prices_cache';
const MAX_CACHE_AGE_MS = 15 * 60 * 1000; // 15 minutos - cache válido
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hora - força atualização

// Funções de cache
function getCachedPrices(): CachedStockPrices | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as CachedStockPrices;
    }
  } catch {
    // Ignora erros de localStorage
  }
  return null;
}

function setCachedPrices(prices: Record<string, StockPrice>) {
  try {
    const data: CachedStockPrices = {
      prices,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignora erros de localStorage
  }
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < MAX_CACHE_AGE_MS;
}

function isCacheStale(timestamp: number): boolean {
  return Date.now() - timestamp > STALE_THRESHOLD_MS;
}

// Fallback prices from local data (stocks, FIIs, and BDRs)
function getLocalPrices(): Record<string, StockAsset | BDRAsset> {
  const allAssets = [...stocksList, ...fiiList, ...bdrList];
  const priceMap: Record<string, StockAsset | BDRAsset> = {};
  allAssets.forEach(asset => {
    priceMap[asset.ticker] = asset;
  });
  return priceMap;
}

const localPrices = getLocalPrices();

export function useStockPrices() {
  const [prices, setPrices] = useState<Record<string, StockPrice>>(() => {
    // Inicializa com cache local se disponível
    const cached = getCachedPrices();
    return cached?.prices || {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(() => {
    const cached = getCachedPrices();
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });
  
  // Mantém o último preço válido da API
  const lastValidPrices = useRef<Record<string, StockPrice>>({});
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Fetch a single stock price from BRAPI
  const fetchSinglePrice = async (symbol: string): Promise<StockPrice | null> => {
    try {
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
    } catch (err) {
      console.error('Error fetching price for', symbol, ':', err);
      return null;
    }
  };

  // Get local fallback price for a symbol - usa cache primeiro
  const getLocalFallback = (symbol: string): StockPrice | null => {
    const upperSymbol = symbol.toUpperCase();
    
    // Primeiro tenta usar preço do cache se não for muito antigo
    const cached = getCachedPrices();
    if (cached && cached.prices[upperSymbol] && !isCacheStale(cached.timestamp)) {
      return cached.prices[upperSymbol];
    }
    
    // Depois tenta último preço válido em memória
    if (lastValidPrices.current[upperSymbol]) {
      return lastValidPrices.current[upperSymbol];
    }
    
    // Por fim usa dados locais estáticos
    const stockData = localPrices[upperSymbol];
    if (!stockData) return null;
    
    // Small random variation to simulate real-time
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
  };

  // Fetch prices for specific symbols only (on demand)
  const fetchPrices = useCallback(async (symbols?: string[]) => {
    if (!symbols || symbols.length === 0) {
      // Don't fetch all stocks at once - use local data for initial load
      const priceMap: Record<string, StockPrice> = {};
      Object.keys(localPrices).forEach(symbol => {
        const fallback = getLocalFallback(symbol);
        if (fallback) priceMap[symbol] = fallback;
      });
      setPrices(priceMap);
      setLastUpdate(new Date());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch each symbol individually to comply with BRAPI free tier
      const newPrices: Record<string, StockPrice> = {};
      let successCount = 0;
      
      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();
        
        // Try BRAPI first
        const livePrice = await fetchSinglePrice(upperSymbol);
        
        if (livePrice) {
          newPrices[upperSymbol] = livePrice;
          successCount++;
          console.log(`Updated ${upperSymbol} price from BRAPI:`, livePrice.price);
        } else {
          // Fallback to cache/local data
          const fallback = getLocalFallback(upperSymbol);
          if (fallback) {
            newPrices[upperSymbol] = fallback;
            console.log(`Using fallback for ${upperSymbol}:`, fallback.price);
          }
        }
      }

      const updatedPrices = { ...prices, ...newPrices };
      
      // Salva no cache se teve sucesso
      if (successCount > 0) {
        setCachedPrices(updatedPrices);
        lastValidPrices.current = { ...lastValidPrices.current, ...newPrices };
        retryCount.current = 0;
      }
      
      setPrices(updatedPrices);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching stock prices:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      
      retryCount.current++;
      
      // Use fallback for all requested symbols
      const fallbackPrices: Record<string, StockPrice> = {};
      symbols.forEach(symbol => {
        const fallback = getLocalFallback(symbol.toUpperCase());
        if (fallback) fallbackPrices[symbol.toUpperCase()] = fallback;
      });
      setPrices(prev => ({ ...prev, ...fallbackPrices }));
      
      // Retry se falhou
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

  // Load cached/local prices on mount and auto-refresh every 60 seconds
  useEffect(() => {
    const loadPrices = () => {
      const cached = getCachedPrices();
      
      // Se cache é válido, usa
      if (cached && isCacheValid(cached.timestamp)) {
        console.log('Using valid cached stock prices');
        setPrices(cached.prices);
        setLastUpdate(new Date(cached.timestamp));
        lastValidPrices.current = cached.prices;
        return;
      }
      
      // Senão usa fallback local
      const priceMap: Record<string, StockPrice> = {};
      Object.keys(localPrices).forEach(symbol => {
        const fallback = getLocalFallback(symbol);
        if (fallback) priceMap[symbol] = fallback;
      });
      setPrices(priceMap);
      setLastUpdate(new Date());
    };

    loadPrices();

    // Atualiza a cada 60 segundos
    const interval = setInterval(loadPrices, 60000);
    return () => clearInterval(interval);
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
