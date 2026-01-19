import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPriceCache, PriceCache } from '@/lib/priceCache';
import { coingeckoRateLimiter } from '@/lib/rateLimiter';

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

type CryptoPriceMap = Record<string, CryptoPrice>;

// Cache instance
const cryptoCache = getPriceCache<CryptoPriceMap>('crypto');

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
  const [prices, setPrices] = useState<CryptoPriceMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const lastValidPrices = useRef<CryptoPriceMap>({});
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isFetching = useRef(false);
  const hasFetchedOnce = useRef(false);

  // Inicializa com cache
  useEffect(() => {
    const initCache = async () => {
      const cached = await cryptoCache.get();
      if (cached) {
        setPrices(cached.data);
        setLastUpdate(new Date(cryptoCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
        
        if (cached.isValid) {
          console.log('Using valid cached crypto prices');
          hasFetchedOnce.current = true;
        }
      }
    };
    initCache();
    
    // Subscribe to cache updates from other tabs
    const unsubscribe = cryptoCache.subscribe((data) => {
      setPrices(data as CryptoPriceMap);
      setLastUpdate(new Date());
    });
    
    return unsubscribe;
  }, []);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    // Prevent concurrent fetches
    if (isFetching.current) return;
    isFetching.current = true;
    
    setIsLoading(true);
    setError(null);

    try {
      const symbolsToFetch = symbols || MAIN_CRYPTO_SYMBOLS;
      
      console.log('Fetching crypto prices via edge function...');
      
      const data = await coingeckoRateLimiter.execute(async () => {
        const { data: responseData, error: fetchError } = await supabase.functions.invoke('stock-quotes', {
          body: {
            symbols: symbolsToFetch,
            market: 'crypto'
          }
        });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (!responseData?.quotes) {
          throw new Error('No quotes returned');
        }
        
        return responseData;
      }, 2); // Higher priority for crypto fetches

      const priceMap: CryptoPriceMap = {};
      
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

      // Merge with existing prices and save to cache
      const newPrices = await cryptoCache.merge(priceMap);
      setPrices(newPrices);
      lastValidPrices.current = newPrices;
      
      retryCount.current = 0;
      setLastUpdate(new Date());
      hasFetchedOnce.current = true;
      console.log('Crypto prices updated:', Object.keys(priceMap).length, 'coins');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('Erro ao buscar preços de cripto:', err);
      
      retryCount.current++;
      
      // Try to use cached data on error
      const cached = await cryptoCache.get();
      
      if (Object.keys(lastValidPrices.current).length > 0) {
        console.log('Using last valid crypto prices from memory');
        setPrices(lastValidPrices.current);
      } else if (cached && !cached.isStale) {
        console.log('Using cached crypto prices (age:', Math.round(cached.age / 1000 / 60), 'min)');
        setPrices(cached.data);
        setLastUpdate(new Date(cryptoCache.getTimestamp() || Date.now()));
      } else if (cached) {
        console.warn('Using stale cached crypto prices');
        setPrices(cached.data);
        setLastUpdate(new Date(cryptoCache.getTimestamp() || Date.now()));
      }
      
      // Retry logic
      if (retryCount.current < maxRetries) {
        setTimeout(() => fetchPrices(symbols), 15000);
      }
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, []);

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
    const initAndFetch = async () => {
      const cached = await cryptoCache.get();
      
      if (cached?.isValid) {
        console.log('Using valid cached crypto prices');
        setPrices(cached.data);
        setLastUpdate(new Date(cryptoCache.getTimestamp() || Date.now()));
        lastValidPrices.current = cached.data;
        hasFetchedOnce.current = true;
      } else if (!hasFetchedOnce.current) {
        fetchPrices();
      }
    };
    
    initAndFetch();
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(() => {
      fetchPrices();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchPrices]);

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

// Função para buscar criptomoedas por nome/símbolo
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
    console.log('Searching crypto:', query);
    
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
