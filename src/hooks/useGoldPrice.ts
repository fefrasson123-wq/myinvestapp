import { useState, useEffect, useCallback, useRef } from 'react';

interface GoldPriceData {
  pricePerGram: number;
  pricePerOunce: number;
  currency: string;
  lastUpdated: string;
}

// Preço base do ouro 24K (dezembro 2025: ~R$ 800/g)
// Baseado em: 1 onça troy (~31.1g) = ~R$ 25.000
const FALLBACK_GOLD_PRICE_PER_GRAM = 800;

// Chave para cache local
const CACHE_KEY = 'gold_price_cache';

interface CachedPrice {
  pricePerGram: number;
  timestamp: number;
}

function getCachedPrice(): CachedPrice | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached) as CachedPrice;
      // Cache válido por 1 hora
      if (Date.now() - data.timestamp < 60 * 60 * 1000) {
        return data;
      }
    }
  } catch {
    // Ignora erros de localStorage
  }
  return null;
}

function setCachedPrice(pricePerGram: number) {
  try {
    const data: CachedPrice = {
      pricePerGram,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignora erros de localStorage
  }
}

export function useGoldPrice() {
  const [pricePerGram, setPricePerGram] = useState<number | null>(() => {
    // Inicializa com cache local se disponível
    const cached = getCachedPrice();
    return cached?.pricePerGram || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Mantém o último preço válido da API
  const lastValidPrice = useRef<number | null>(null);

  const fetchPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Tenta buscar preço via CoinGecko (PAX Gold = 1 onça de ouro)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=brl',
        { headers: { 'Accept': 'application/json' } }
      );

      if (response.ok) {
        const data = await response.json();
        // PAX Gold é lastreado 1:1 com ouro físico (1 PAXG = 1 onça troy de ouro)
        if (data['pax-gold']?.brl) {
          const pricePerOunce = data['pax-gold'].brl;
          // 1 onça troy = 31.1035 gramas
          const pricePerGramValue = pricePerOunce / 31.1035;
          const roundedPrice = Math.round(pricePerGramValue * 100) / 100;
          
          // Salva no cache e atualiza estado
          setCachedPrice(roundedPrice);
          lastValidPrice.current = roundedPrice;
          setPricePerGram(roundedPrice);
          setLastUpdate(new Date());
          console.log('Gold price updated from API:', roundedPrice, 'BRL/g');
          return;
        }
      }

      // Se API falhou, usa cache ou último preço válido
      const cached = getCachedPrice();
      if (cached) {
        console.log('Using cached gold price:', cached.pricePerGram);
        setPricePerGram(cached.pricePerGram);
        setLastUpdate(new Date(cached.timestamp));
        return;
      }

      if (lastValidPrice.current) {
        console.log('Using last valid gold price:', lastValidPrice.current);
        setPricePerGram(lastValidPrice.current);
        return;
      }

      // Fallback final
      console.log('Using fallback gold price:', FALLBACK_GOLD_PRICE_PER_GRAM);
      setPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching gold price:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotação do ouro');
      
      // Tenta usar cache ou último preço válido antes do fallback
      const cached = getCachedPrice();
      if (cached) {
        setPricePerGram(cached.pricePerGram);
        setLastUpdate(new Date(cached.timestamp));
        return;
      }

      if (lastValidPrice.current) {
        setPricePerGram(lastValidPrice.current);
        return;
      }

      // Fallback final apenas se não há outro dado
      setPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Busca preço na inicialização
  useEffect(() => {
    fetchPrice();
    
    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    pricePerGram,
    isLoading,
    error,
    lastUpdate,
    fetchPrice,
  };
}
