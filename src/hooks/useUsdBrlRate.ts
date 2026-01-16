import { useCallback, useEffect, useState, useRef } from "react";

interface UsdBrlRateState {
  rate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = "usdbrl-rate";
const CACHE_MS = 5 * 60 * 1000; // 5 min - cache válido
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 min - força atualização

// Fallback conservador (não deve ser usado por muito tempo)
const DEFAULT_RATE = 5.0;

interface CachedRate {
  rate: number;
  lastUpdated: string;
}

function getCachedRate(): CachedRate | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached) as CachedRate;
    }
  } catch {
    // Ignora erros
  }
  return null;
}

function isCacheValid(lastUpdated: string): boolean {
  const ts = new Date(lastUpdated).getTime();
  return Date.now() - ts < CACHE_MS;
}

function isCacheStale(lastUpdated: string): boolean {
  const ts = new Date(lastUpdated).getTime();
  return Date.now() - ts > STALE_THRESHOLD_MS;
}

/**
 * Cotação USD/BRL (atualiza e cacheia). Usado para converter cripto (USD) em BRL no app.
 * Fonte: AwesomeAPI (endpoint público, sem chave).
 */
export function useUsdBrlRate(): UsdBrlRateState {
  const [rate, setRate] = useState<number>(() => {
    const cached = getCachedRate();
    return cached?.rate ?? DEFAULT_RATE;
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const cached = getCachedRate();
    return cached?.lastUpdated ? new Date(cached.lastUpdated) : null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mantém última taxa válida
  const lastValidRate = useRef<number | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // USD/BRL (bid) — exemplo de resposta:
      // { "USDBRL": { "bid": "5.1234", ... } }
      const resp = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) throw new Error(`Falha ao buscar USD/BRL: ${resp.status}`);

      const data = await resp.json();
      const bidRaw = data?.USDBRL?.bid;
      const bid = typeof bidRaw === "string" ? Number(bidRaw) : Number(bidRaw);

      if (!Number.isFinite(bid) || bid <= 0) {
        throw new Error("Cotação USD/BRL inválida");
      }

      const now = new Date();
      setRate(bid);
      setLastUpdated(now);
      lastValidRate.current = bid;
      retryCount.current = 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate: bid, lastUpdated: now.toISOString() }));
      console.log('USD/BRL rate updated:', bid);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Erro ao buscar USD/BRL";
      setError(errorMsg);
      console.error('Error fetching USD/BRL:', e);
      
      retryCount.current++;
      
      // Tenta usar último valor válido ou cache
      if (lastValidRate.current) {
        console.log('Using last valid USD/BRL rate:', lastValidRate.current);
        setRate(lastValidRate.current);
      } else {
        const cached = getCachedRate();
        if (cached && !isCacheStale(cached.lastUpdated)) {
          console.log('Using cached USD/BRL rate:', cached.rate);
          setRate(cached.rate);
          setLastUpdated(new Date(cached.lastUpdated));
        } else if (cached) {
          // Cache stale mas melhor que nada
          console.warn('Using stale cached USD/BRL rate:', cached.rate);
          setRate(cached.rate);
          setLastUpdated(new Date(cached.lastUpdated));
          
          // Retry mais rápido
          if (retryCount.current < maxRetries) {
            setTimeout(() => refresh(), 10000);
          }
        }
        // Senão mantém DEFAULT_RATE que já está setado
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedRate();
    
    // Se cache é válido, usa e não busca imediatamente
    if (cached && isCacheValid(cached.lastUpdated)) {
      console.log('Using valid cached USD/BRL rate');
      setRate(cached.rate);
      setLastUpdated(new Date(cached.lastUpdated));
      lastValidRate.current = cached.rate;
      setIsLoading(false);
    } else {
      // Cache inválido ou inexistente - busca imediatamente
      refresh();
    }

    // Atualiza a cada 5 minutos
    const interval = setInterval(() => {
      refresh();
    }, CACHE_MS);

    return () => clearInterval(interval);
  }, [refresh]);

  return { rate, isLoading, error, lastUpdated, refresh };
}
