import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoPrice {
  symbol: string;
  name?: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

interface CachedCryptoPrices {
  prices: Record<string, CryptoPrice>;
  timestamp: number;
}

const CACHE_KEY = 'crypto_prices_cache_v2';
const MAX_CACHE_AGE_MS = 5 * 60 * 1000; // 5 minutos - cache válido
const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutos - força atualização

// Funções de cache
function getCachedPrices(): CachedCryptoPrices | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as CachedCryptoPrices;
    }
  } catch {
    // Ignora erros de localStorage
  }
  return null;
}

function setCachedPrices(prices: Record<string, CryptoPrice>) {
  try {
    const data: CachedCryptoPrices = {
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

// Lista das principais criptos para buscar automaticamente
const MAIN_CRYPTO_SYMBOLS = [
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'DOGE', 'ADA', 'TRX',
  'AVAX', 'LINK', 'DOT', 'MATIC', 'LTC', 'SHIB', 'BCH', 'UNI', 'XLM', 'NEAR',
  'ARB', 'OP', 'IMX', 'AAVE', 'MKR', 'LDO', 'CRV', 'COMP', 'SUSHI',
  'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'RNDR', 'FET', 'WLD',
  'XMR', 'ATOM', 'FIL', 'HBAR', 'VET', 'FTM', 'PEPE', 'FLOKI', 'BONK', 'WIF',
  'APT', 'SUI', 'SEI', 'INJ', 'TON', 'JUP', 'GMX', 'RUNE', 'PENDLE', 'MINA'
];

export function useCryptoPrices() {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>(() => {
    const cached = getCachedPrices();
    return cached?.prices || {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(() => {
    const cached = getCachedPrices();
    return cached?.timestamp ? new Date(cached.timestamp) : null;
  });
  
  const lastValidPrices = useRef<Record<string, CryptoPrice>>({});
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isFetching = useRef(false);
  const hasFetchedOnce = useRef(false);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    // Prevent concurrent fetches
    if (isFetching.current) return;
    isFetching.current = true;
    
    setIsLoading(true);
    setError(null);

    try {
      const symbolsToFetch = symbols || MAIN_CRYPTO_SYMBOLS;
      
      console.log('Fetching crypto prices from Yahoo Finance via edge function...');
      
      const { data, error: fetchError } = await supabase.functions.invoke('stock-quotes', {
        body: {
          symbols: symbolsToFetch,
          market: 'crypto'
        }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data?.quotes) {
        throw new Error('No quotes returned');
      }

      const priceMap: Record<string, CryptoPrice> = {};
      
      for (const [symbol, quote] of Object.entries(data.quotes)) {
        const q = quote as {
          symbol: string;
          name?: string;
          price: number;
          change: number;
          changePercent: number;
          high24h: number;
          low24h: number;
          lastUpdated: string;
        };
        
        priceMap[symbol.toUpperCase()] = {
          symbol: symbol.toUpperCase(),
          name: q.name,
          current_price: q.price ?? 0,
          price_change_24h: q.change ?? 0,
          price_change_percentage_24h: q.changePercent ?? 0,
          high_24h: q.high24h ?? 0,
          low_24h: q.low24h ?? 0,
          last_updated: q.lastUpdated ?? new Date().toISOString(),
        };
      }

      // Use functional update to avoid dependency on prices
      setPrices(prevPrices => {
        const newPrices = { ...prevPrices, ...priceMap };
        setCachedPrices(newPrices);
        lastValidPrices.current = newPrices;
        return newPrices;
      });
      
      retryCount.current = 0;
      setLastUpdate(new Date());
      hasFetchedOnce.current = true;
      console.log('Crypto prices updated from Yahoo Finance:', Object.keys(priceMap).length, 'coins');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('Erro ao buscar preços de cripto:', err);
      
      retryCount.current++;
      
      const cached = getCachedPrices();
      
      if (Object.keys(lastValidPrices.current).length > 0) {
        console.log('Using last valid crypto prices from memory');
        setPrices(lastValidPrices.current);
      } else if (cached && !isCacheStale(cached.timestamp)) {
        console.log('Using cached crypto prices (age:', Math.round((Date.now() - cached.timestamp) / 1000 / 60), 'min)');
        setPrices(cached.prices);
        setLastUpdate(new Date(cached.timestamp));
      } else if (cached) {
        console.warn('Using stale cached crypto prices');
        setPrices(cached.prices);
        setLastUpdate(new Date(cached.timestamp));
      }
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, []); // No dependencies - use refs and functional updates

  const getPrice = useCallback((symbol: string): number | null => {
    const upperSymbol = symbol.toUpperCase();
    const price = prices[upperSymbol];
    return price?.current_price ?? null;
  }, [prices]);

  const getPriceChange = useCallback((symbol: string): { change: number; percent: number } | null => {
    const upperSymbol = symbol.toUpperCase();
    const price = prices[upperSymbol];
    if (!price) return null;
    return {
      change: price.price_change_24h ?? 0,
      percent: price.price_change_percentage_24h ?? 0,
    };
  }, [prices]);

  // Busca preços na inicialização e verifica cache
  useEffect(() => {
    const cached = getCachedPrices();
    
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('Using valid cached crypto prices');
      setPrices(cached.prices);
      setLastUpdate(new Date(cached.timestamp));
      lastValidPrices.current = cached.prices;
      hasFetchedOnce.current = true;
    } else if (!hasFetchedOnce.current) {
      fetchPrices();
    }
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(() => {
      fetchPrices();
    }, 60000);

    return () => clearInterval(interval);
  }, []); // Run only once on mount

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

// Função para buscar criptomoedas por nome/símbolo via Yahoo Finance
export async function searchCryptoOnYahoo(query: string): Promise<Array<{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
}>> {
  try {
    console.log('Searching crypto on Yahoo Finance:', query);
    
    const { data, error } = await supabase.functions.invoke('stock-quotes', {
      body: {
        action: 'search-crypto',
        query: query
      }
    });

    if (error) {
      console.error('Error searching crypto:', error);
      return [];
    }

    // Ensure all values have defaults to prevent null errors
    return (data?.results || []).map((r: {
      symbol?: string;
      name?: string;
      price?: number;
      change?: number;
      changePercent?: number;
      high24h?: number;
      low24h?: number;
    }) => ({
      symbol: r.symbol || 'UNKNOWN',
      name: r.name || r.symbol || 'Unknown',
      price: r.price ?? 0,
      change: r.change ?? 0,
      changePercent: r.changePercent ?? 0,
      high24h: r.high24h ?? 0,
      low24h: r.low24h ?? 0,
    }));
  } catch (err) {
    console.error('Error searching crypto:', err);
    return [];
  }
}