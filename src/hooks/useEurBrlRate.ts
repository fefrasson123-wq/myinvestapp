import { useState, useEffect, useCallback, useRef } from 'react';

interface EurBrlRateState {
  rate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'eur_brl_rate_cache';
const CACHE_MS = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_RATE = 6.0; // Conservative fallback rate

interface CachedRate {
  rate: number;
  timestamp: number;
}

function getCachedRate(): CachedRate | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function isCacheValid(cached: CachedRate | null): boolean {
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_MS;
}

function isCacheStale(cached: CachedRate | null): boolean {
  if (!cached) return true;
  return Date.now() - cached.timestamp > STALE_THRESHOLD_MS;
}

export function useEurBrlRate(): EurBrlRateState {
  const [rate, setRate] = useState<number>(() => {
    const cached = getCachedRate();
    return cached?.rate || DEFAULT_RATE;
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const cached = getCachedRate();
    return cached ? new Date(cached.timestamp) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastValidRate = useRef<number>(rate);
  const retryCount = useRef(0);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/EUR-BRL');
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const newRate = parseFloat(data.EURBRL?.bid);

      if (isNaN(newRate) || newRate <= 0) {
        throw new Error('Invalid rate received');
      }

      lastValidRate.current = newRate;
      retryCount.current = 0;
      
      setRate(newRate);
      setLastUpdated(new Date());

      const cacheData: CachedRate = {
        rate: newRate,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch EUR/BRL rate';
      setError(errorMessage);
      
      retryCount.current += 1;

      const cached = getCachedRate();
      if (cached && !isCacheStale(cached)) {
        setRate(cached.rate);
        setLastUpdated(new Date(cached.timestamp));
      } else if (lastValidRate.current !== DEFAULT_RATE) {
        setRate(lastValidRate.current);
      } else {
        setRate(DEFAULT_RATE);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedRate();
    
    if (isCacheValid(cached)) {
      setRate(cached!.rate);
      setLastUpdated(new Date(cached!.timestamp));
      setIsLoading(false);
    } else {
      refresh();
    }

    const intervalId = setInterval(refresh, CACHE_MS);
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
