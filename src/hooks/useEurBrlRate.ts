import { useState, useEffect, useCallback, useRef } from 'react';
import { getPriceCache } from '@/lib/priceCache';
import { exchangeRateLimiter } from '@/lib/rateLimiter';

interface EurBrlRateState {
  rate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

interface EurRateData {
  rate: number;
  lastUpdated: string;
}

// Cache instance
const eurCache = getPriceCache<EurRateData>('eur');

const DEFAULT_RATE = 6.0; // Conservative fallback rate

export function useEurBrlRate(): EurBrlRateState {
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastValidRate = useRef<number>(DEFAULT_RATE);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Inicializa com cache
  useEffect(() => {
    const initCache = async () => {
      const cached = await eurCache.get();
      if (cached) {
        setRate(cached.data.rate);
        setLastUpdated(new Date(cached.data.lastUpdated));
        lastValidRate.current = cached.data.rate;
      }
    };
    initCache();
    
    // Subscribe to cache updates from other tabs
    const unsubscribe = eurCache.subscribe((data) => {
      const rateData = data as EurRateData;
      setRate(rateData.rate);
      setLastUpdated(new Date(rateData.lastUpdated));
    });
    
    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await exchangeRateLimiter.execute(async () => {
        const response = await fetch('https://economia.awesomeapi.com.br/json/last/EUR-BRL');
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
      }, 2);

      const newRate = parseFloat(data.EURBRL?.bid);

      if (isNaN(newRate) || newRate <= 0) {
        throw new Error('Invalid rate received');
      }

      const now = new Date();
      
      // Salva no cache
      await eurCache.set({
        rate: newRate,
        lastUpdated: now.toISOString(),
      });

      lastValidRate.current = newRate;
      retryCount.current = 0;
      
      setRate(newRate);
      setLastUpdated(now);
      console.log('EUR/BRL rate updated:', newRate);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch EUR/BRL rate';
      setError(errorMessage);
      console.error('Error fetching EUR/BRL:', err);
      
      retryCount.current += 1;

      const cached = await eurCache.get();
      if (cached && !cached.isStale) {
        setRate(cached.data.rate);
        setLastUpdated(new Date(cached.data.lastUpdated));
      } else if (lastValidRate.current !== DEFAULT_RATE) {
        setRate(lastValidRate.current);
      } else {
        setRate(DEFAULT_RATE);
      }
      
      // Retry
      if (retryCount.current < maxRetries) {
        setTimeout(() => refresh(), 10000);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const cached = await eurCache.get();
      
      if (cached?.isValid) {
        console.log('Using valid cached EUR/BRL rate');
        setRate(cached.data.rate);
        setLastUpdated(new Date(cached.data.lastUpdated));
        lastValidRate.current = cached.data.rate;
        setIsLoading(false);
      } else {
        refresh();
      }
    };
    
    init();

    const intervalId = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [refresh]);

  return {
    rate,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}
