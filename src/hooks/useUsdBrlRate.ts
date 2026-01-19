import { useCallback, useEffect, useState, useRef } from "react";
import { getPriceCache } from "@/lib/priceCache";
import { exchangeRateLimiter } from "@/lib/rateLimiter";

interface UsdBrlRateState {
  rate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

interface UsdRateData {
  rate: number;
  lastUpdated: string;
}

// Cache instance
const usdCache = getPriceCache<UsdRateData>('usd');

// Fallback conservador (não deve ser usado por muito tempo)
const DEFAULT_RATE = 5.0;

/**
 * Cotação USD/BRL (atualiza e cacheia). Usado para converter cripto (USD) em BRL no app.
 * Fonte: AwesomeAPI (endpoint público, sem chave).
 */
export function useUsdBrlRate(): UsdBrlRateState {
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mantém última taxa válida
  const lastValidRate = useRef<number | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Inicializa com cache
  useEffect(() => {
    const initCache = async () => {
      const cached = await usdCache.get();
      if (cached) {
        setRate(cached.data.rate);
        setLastUpdated(new Date(cached.data.lastUpdated));
        lastValidRate.current = cached.data.rate;
        setIsLoading(false);
      }
    };
    initCache();
    
    // Subscribe to cache updates from other tabs
    const unsubscribe = usdCache.subscribe((data) => {
      const rateData = data as UsdRateData;
      setRate(rateData.rate);
      setLastUpdated(new Date(rateData.lastUpdated));
    });
    
    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // USD/BRL (bid) com rate limiting
      const data = await exchangeRateLimiter.execute(async () => {
        const resp = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
          headers: { Accept: "application/json" },
        });

        if (!resp.ok) throw new Error(`Falha ao buscar USD/BRL: ${resp.status}`);
        return resp.json();
      }, 2);

      const bidRaw = data?.USDBRL?.bid;
      const bid = typeof bidRaw === "string" ? Number(bidRaw) : Number(bidRaw);

      if (!Number.isFinite(bid) || bid <= 0) {
        throw new Error("Cotação USD/BRL inválida");
      }

      const now = new Date();
      
      // Salva no cache
      await usdCache.set({
        rate: bid,
        lastUpdated: now.toISOString(),
      });
      
      setRate(bid);
      setLastUpdated(now);
      lastValidRate.current = bid;
      retryCount.current = 0;
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
        const cached = await usdCache.get();
        if (cached && !cached.isStale) {
          console.log('Using cached USD/BRL rate:', cached.data.rate);
          setRate(cached.data.rate);
          setLastUpdated(new Date(cached.data.lastUpdated));
        } else if (cached) {
          // Cache stale mas melhor que nada
          console.warn('Using stale cached USD/BRL rate:', cached.data.rate);
          setRate(cached.data.rate);
          setLastUpdated(new Date(cached.data.lastUpdated));
          
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
    const init = async () => {
      const cached = await usdCache.get();
      
      // Se cache é válido, usa e não busca imediatamente
      if (cached?.isValid) {
        console.log('Using valid cached USD/BRL rate');
        setRate(cached.data.rate);
        setLastUpdated(new Date(cached.data.lastUpdated));
        lastValidRate.current = cached.data.rate;
        setIsLoading(false);
      } else {
        // Cache inválido ou inexistente - busca imediatamente
        refresh();
      }
    };
    
    init();

    // Atualiza a cada 5 minutos
    const interval = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refresh]);

  return { rate, isLoading, error, lastUpdated, refresh };
}
