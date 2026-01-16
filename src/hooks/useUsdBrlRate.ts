import { useCallback, useEffect, useState } from "react";

interface UsdBrlRateState {
  rate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = "usdbrl-rate";
const CACHE_MS = 5 * 60 * 1000; // 5 min

// Fallback conservador (não deve ser usado por muito tempo)
const DEFAULT_RATE = 5.0;

/**
 * Cotação USD/BRL (atualiza e cacheia). Usado para converter cripto (USD) em BRL no app.
 * Fonte: AwesomeAPI (endpoint público, sem chave).
 */
export function useUsdBrlRate(): UsdBrlRateState {
  const [rate, setRate] = useState<number>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return DEFAULT_RATE;
    try {
      const parsed = JSON.parse(cached) as { rate: number; lastUpdated: string };
      return typeof parsed.rate === "number" ? parsed.rate : DEFAULT_RATE;
    } catch {
      return DEFAULT_RATE;
    }
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached) as { rate: number; lastUpdated: string };
      return parsed.lastUpdated ? new Date(parsed.lastUpdated) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate: bid, lastUpdated: now.toISOString() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar USD/BRL");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { rate: number; lastUpdated: string };
        const ts = parsed.lastUpdated ? new Date(parsed.lastUpdated).getTime() : 0;
        if (ts && Date.now() - ts < CACHE_MS) {
          setIsLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    refresh();
  }, [refresh]);

  return { rate, isLoading, error, lastUpdated, refresh };
}
